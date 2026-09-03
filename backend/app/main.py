from fastapi import FastAPI
from app.config import settings
from app.database import Base, engine
from app.models import user
from app.routers import auth

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(auth.router)

@app.get("/health")
async def check_health():
    return {"status": "ok", "env": settings.app_env}