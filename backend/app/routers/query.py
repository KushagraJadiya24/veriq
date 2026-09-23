import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.db_connection import DBConnection
from app.auth import get_current_user
from app.encryption import decrypt_value
from app.guardrails import validate_sql
from app.db_utils import build_connection_url
from pydantic import BaseModel
from app.models.audit_log import AuditLog
from app.agent import compiled_agent
from app.retrieval import retrieve_relevant_tables

router = APIRouter(prefix="/query", tags=["query"])


class SQLIn(BaseModel):
    sql: str


class QuestionIn(BaseModel):
    question: str


@router.post("/run")
def run_query(
    body: SQLIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    conn = db.query(DBConnection).filter(DBConnection.workspace_id == workspace.id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="No database connected")

    valid, message = validate_sql(body.sql)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Guardrail rejected query: {message}")

    password = decrypt_value(conn.encrypted_password)
    url = build_connection_url(conn.host, conn.port, conn.database_name, conn.username, password)
    engine = create_engine(url, connect_args={"connect_timeout": 5})
    try:
        with engine.connect() as target_conn:
            result = target_conn.execute(text(body.sql))
            rows = [dict(row._mapping) for row in result]
        return {"rows": rows}
    finally:
        engine.dispose()


@router.post("/ask")
def ask(
    body: QuestionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    conn = db.query(DBConnection).filter(DBConnection.workspace_id == workspace.id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="No database connected")

    tables = retrieve_relevant_tables(db, workspace.id, body.question)
    schema_context = "\n".join(t["content"] for t in tables)

    final_state = compiled_agent.invoke({
        "question": body.question,
        "schema_context": schema_context,
        "sql": "",
        "error": "",
        "result": [],
        "attempts": 0,
    })

    log = AuditLog(
        workspace_id=workspace.id,
        question=body.question,
        sql=final_state.get("sql", ""),
        blocked=bool(final_state["error"]),
        block_reason=final_state["error"] or None,
    )
    db.add(log)
    db.commit()

    if final_state["error"]:
        raise HTTPException(status_code=400, detail=f"Agent failed after retries: {final_state['error']}")

    password = decrypt_value(conn.encrypted_password)
    url = build_connection_url(conn.host, conn.port, conn.database_name, conn.username, password)
    engine = create_engine(url, connect_args={"connect_timeout": 5})
    try:
        with engine.connect() as target_conn:
            target_conn.execute(text("SET TRANSACTION READ ONLY"))
            start = time.perf_counter()
            result = target_conn.execute(text(final_state["sql"]))
            rows = [dict(row._mapping) for row in result]
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "question": body.question,
            "sql": final_state["sql"],
            "explanation": final_state.get("explanation"),
            "rows": rows,
            "row_count": len(rows),
            "execution_time_ms": elapsed_ms,
        }
    finally:
        engine.dispose()