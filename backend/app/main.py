from fastapi import FastAPI
from app.config import settings
from app.database import Base, engine
from app.models import user, workspace, db_connection, schema_embedding, audit_log
from app.routers import auth, workspace, query

app = FastAPI()
app.include_router(auth.router)
app.include_router(workspace.router)
app.include_router(query.router)
Base.metadata.create_all(bind=engine)

@app.get("/health")
async def check_health():
    return {"status": "ok", "env": settings.app_env}