from fastapi import FastAPI

app = FastAPI()

from app.config import settings

@app.get("/health")
async def check_health():
    return {"status": "ok", "env": settings.app_env}