from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.db_connection import DBConnection
from app.schemas.db_connection import DBConnectionCreate, DBConnectionOut
from app.auth import get_current_user
from app.encryption import encrypt_value, decrypt_value
from app.db_utils import test_connection,get_schema
from app.models.schema_embedding import SchemaEmbedding
from app.embeddings import generate_embedding

router = APIRouter(prefix="/workspace", tags=["workspace"])


@router.post("/connect-db", response_model=DBConnectionOut)
def connect_db(
    conn_in: DBConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    existing = db.query(DBConnection).filter(DBConnection.workspace_id == workspace.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="A database is already connected to this workspace")

    success, message = test_connection(
        conn_in.host, conn_in.port, conn_in.database_name, conn_in.username, conn_in.password
    )
    if not success:
        raise HTTPException(status_code=400, detail=f"Could not connect to database: {message}")

    new_conn = DBConnection(
        workspace_id=workspace.id,
        host=conn_in.host,
        port=conn_in.port,
        database_name=conn_in.database_name,
        username=conn_in.username,
        encrypted_password=encrypt_value(conn_in.password),
    )
    db.add(new_conn)
    db.commit()
    db.refresh(new_conn)
    return new_conn


@router.get("/schema")
def get_workspace_schema(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    conn = db.query(DBConnection).filter(DBConnection.workspace_id == workspace.id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="No database connected to this workspace")

    password = decrypt_value(conn.encrypted_password)
    schema = get_schema(conn.host, conn.port, conn.database_name, conn.username, password)
    return schema


@router.post("/generate-embeddings")
def generate_embeddings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    conn = db.query(DBConnection).filter(DBConnection.workspace_id == workspace.id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="No database connected to this workspace")

    password = decrypt_value(conn.encrypted_password)
    schema = get_schema(conn.host, conn.port, conn.database_name, conn.username, password)

    db.query(SchemaEmbedding).filter(SchemaEmbedding.workspace_id == workspace.id).delete()

    created = []
    for table_name, columns in schema.items():
        column_desc = ", ".join(f"{c['name']} ({c['type']})" for c in columns)
        content = f"table: {table_name}, columns: {column_desc}"
        vector = generate_embedding(content)

        row = SchemaEmbedding(
            workspace_id=workspace.id,
            table_name=table_name,
            content=content,
            embedding=vector,
        )
        db.add(row)
        created.append(table_name)

    db.commit()
    return {"tables_embedded": created}

from app.retrieval import retrieve_relevant_tables
from pydantic import BaseModel

class QuestionIn(BaseModel):
    question: str

@router.post("/relevant-tables")
def relevant_tables(
    body: QuestionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return retrieve_relevant_tables(db, workspace.id, body.question)