from pwdlib import PasswordHash
from datetime import datetime, timedelta, timezone
import jwt
from app.config import settings

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)

def create_access_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15)
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm="HS256"
    )

    return token

def create_refresh_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm="HS256"
    )

    return token