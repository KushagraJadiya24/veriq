from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.db_connection import DBConnection
from app.schemas.db_connection import DBConnectionCreate, DBConnectionOut
from app.auth import get_current_user
from app.encryption import encrypt_value

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