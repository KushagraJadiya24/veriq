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

router = APIRouter(prefix="/query", tags=["query"])

class SQLIn(BaseModel):
    sql: str

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