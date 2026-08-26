from fastapi import FastAPI
from app.config import settings
from app.database import Base, engine
from app.models import user  # noqa: F401 — import registers the model with Base

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/health")
async def check_health():
    return {"status": "ok", "env": settings.app_env}