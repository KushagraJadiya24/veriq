from pydantic import BaseModel

class DBConnectionCreate(BaseModel):
    host: str
    port: int
    database_name: str
    username: str
    password: str

class DBConnectionOut(BaseModel):
    id: int
    host: str
    port: int
    database_name: str
    username: str

    class Config:
        from_attributes = True