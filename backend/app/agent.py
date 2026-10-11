from typing import TypedDict
from langgraph.graph import StateGraph, END
import google.generativeai as genai
from app.config import settings
from app.guardrails import validate_sql, enforce_row_limit, check_complexity, check_sensitive_columns
from google.api_core.exceptions import ResourceExhausted
from pydantic import BaseModel, ValidationError
import sqlglot
genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel("gemini-3.5-flash-lite")


class AgentState(TypedDict):
    question: str
    schema_context: str
    sql: str
    error: str
    result: list
    attempts: int
    explanation: str
    hallucination_check: str


class SQLGeneration(BaseModel):
    sql: str
    explanation: str


def generate_sql_node(state: AgentState) -> AgentState:
    prompt = f"""Given this database schema:
    {state['schema_context']}

    Write a single PostgreSQL SELECT query to answer: {state['question']}
    Never select password, hashed_password, secret, token, or any encrypted_* columns.
    {f"Previous attempt failed: {state['error']}. Fix it." if state.get('error') else ""}

    Respond with ONLY valid JSON matching this exact shape, no markdown, no extra text:
    {{"sql": "<the SQL query>", "explanation": "<one sentence on what it does>"}}"""
    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
        )
    except ResourceExhausted as e:
        state["error"] = "Rate limit reached — please wait a moment and try again."
        state["sql"] = ""
        state["attempts"] = 1
        return state

    try:
        parsed = SQLGeneration.model_validate_json(response.text)
        state["sql"] = parsed.sql
        state["explanation"] = parsed.explanation
    except ValidationError as e:
        state["error"] = f"Model returned invalid structure: {e}"
        state["sql"] = ""

    state["attempts"] = state.get("attempts", 0) + 1
    return state

def validate_node(state: AgentState) -> AgentState:
    if state.get("error"):
        return state  # generation already failed (e.g. rate limit) — don't overwrite

    valid, message = validate_sql(state["sql"])
    if valid:
        complex_ok, complex_msg = check_complexity(state["sql"])
        if not complex_ok:
            valid, message = False, complex_msg
    if valid:
        sensitive_ok, sensitive_msg = check_sensitive_columns(state["sql"])
        if not sensitive_ok:
            valid, message = False, sensitive_msg
    if valid:
        state["sql"] = enforce_row_limit(state["sql"])
    state["error"] = "" if valid else message
    return state


def route_after_validate(state: AgentState) -> str:
    if state["error"] and state["attempts"] < 1:
        return "retry"
    if state["error"]:
        return "fail"
    return "proceed"

class VerificationResult(BaseModel):
    is_valid: bool
    concern: str

def verify_node(state: AgentState) -> AgentState:
    prompt = f"""Question: {state['question']}
SQL used: {state['sql']}
Does this SQL correctly answer the question? Check aggregation type,
filters, and whether any JOIN could cause double-counting (e.g. a
one-to-many join inflating a SUM/COUNT).
Respond with ONLY JSON: {{"is_valid": true/false, "concern": "<brief reason if invalid, empty string if valid>"}}"""
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        result = VerificationResult.model_validate_json(response.text)
        state["hallucination_check"] = result.concern if not result.is_valid else ""
    except Exception:
        state["hallucination_check"] = ""
    return state

from sqlglot import exp as sqlexp

def check_grain(sql: str) -> str:
    parsed = sqlglot.parse_one(sql, read="postgres")
    has_join = bool(list(parsed.find_all(sqlexp.Join)))
    has_aggregate = bool(list(parsed.find_all(sqlexp.Count)) + list(parsed.find_all(sqlexp.Sum)))
    if has_join and has_aggregate:
        return "Query joins multiple tables while aggregating — verify this isn't double-counting due to a one-to-many join (e.g. summing an amount per order-item row instead of per order)."
    return ""

def grain_check_node(state: AgentState) -> AgentState:
    warning = check_grain(state["sql"])
    if warning:
        existing = state.get("hallucination_check", "")
        state["hallucination_check"] = f"{existing} {warning}".strip()
    return state

graph = StateGraph(AgentState)
graph.add_node("generate_sql", generate_sql_node)
graph.add_node("validate", validate_node)
graph.add_node("verify", verify_node)
graph.add_node("grain_check", grain_check_node)
graph.set_entry_point("generate_sql")
graph.add_edge("generate_sql", "validate")
graph.add_conditional_edges("validate", route_after_validate, {
    "retry": "generate_sql",
    "proceed": "verify",
    "fail": END,
})
graph.add_edge("verify", "grain_check")
graph.add_edge("grain_check", END)
compiled_agent = graph.compile()