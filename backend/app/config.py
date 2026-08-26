from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql://veriq:veriq_dev_password@localhost:5432/veriq"

    class Config:
        env_file = ".env"
settings = Settings()