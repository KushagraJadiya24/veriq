from cryptography.fernet import Fernet
from app.config import settings

_fernet = Fernet(settings.fernet_key.encode())

def encrypt_value(plain_text: str) -> str:
    return _fernet.encrypt(plain_text.encode()).decode()

def decrypt_value(cipher_text: str) -> str:
    return _fernet.decrypt(cipher_text.encode()).decode()