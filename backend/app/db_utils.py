from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

def build_connection_url(host: str, port: int, database_name: str, username: str, password: str) -> str:
    return f"postgresql://{username}:{password}@{host}:{port}/{database_name}"

def test_connection(host: str, port: int, database_name: str, username: str, password: str) -> tuple[bool, str]:
    url = build_connection_url(host, port, database_name, username, password)
    engine = create_engine(url, connect_args={"connect_timeout": 5})
    try:
        with engine.connect():
            return True, "Connection successful"
    except OperationalError as e:
        return False, str(e)
    finally:
        engine.dispose()