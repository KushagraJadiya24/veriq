from typing import TypedDict
from langgraph.graph import StateGraph, END
import google.generativeai as genai
from app.config import settings
from app.guardrails import validate_sql, enforce_row_limit, check_complexity, check_sensitive_columns
from google.api_core.exceptions import ResourceExhausted
from pydantic import BaseModel, ValidationError

genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel("gemini-3.6-flash")


class AgentState(TypedDict):
    question: str
    schema_context: str
    sql: str
    error: str
    result: list
    attempts: int
    explanation: str


class SQLGeneration(BaseModel):
    sql: str
    explanation: str


def generate_sql_node(state: AgentState) -> AgentState:
    prompt = f"""Given this database schema:
{state['schema_context']}

Write a single PostgreSQL SELECT query to answer: {state['question']}
{f"Previous attempt failed: {state['error']}. Fix it." if state.get('error') else ""}

Respond with ONLY valid JSON matching this exact shape, no markdown, no extra text:
{{"sql": "<the SQL query>", "explanation": "<one sentence on what it does>"}}"""

    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
        )
    except ResourceExhausted:
        state["error"] = "Rate limit reached — please wait a moment and try again."
        state["sql"] = ""
        state["attempts"] = 3
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
    if state["error"] and state["attempts"] < 3:
        return "retry"
    if state["error"]:
        return "fail"
    return "proceed"


graph = StateGraph(AgentState)
graph.add_node("generate_sql", generate_sql_node)
graph.add_node("validate", validate_node)
graph.set_entry_point("generate_sql")
graph.add_edge("generate_sql", "validate")
graph.add_conditional_edges("validate", route_after_validate, {
    "retry": "generate_sql",
    "proceed": END,
    "fail": END,
})
compiled_agent = graph.compile()