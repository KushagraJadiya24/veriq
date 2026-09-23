from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    question = Column(String, nullable=True)
    sql = Column(String, nullable=False)
    blocked = Column(Boolean, nullable=False, default=False)
    block_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())