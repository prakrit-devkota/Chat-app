
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings

security = HTTPBearer()


def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=["HS256"],
        )

        return int(payload["sub"])

    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise ValueError("Invalid or expired token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> int:
    try:
        return decode_access_token(credentials.credentials)

    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )
