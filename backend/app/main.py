from fastapi import FastAPI
from app.config import settings
from app.database import Base, engine
from app.models import user,workspace
from app.routers import auth,workspace
from app.models import db_connection
from app.models import schema_embedding

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(auth.router)
app.include_router(workspace.router)

@app.get("/health")
async def check_health():
    return {"status": "ok", "env": settings.app_env}