import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.config import settings
from app.database import get_session
from app.models import User
from app.schemas import UserCreate, UserLogin
from app.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)

router = APIRouter(tags=["auth"])


@router.post("/register")
def register(
    user_data: UserCreate,
    session: Session = Depends(get_session),
):
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
    )

    session.add(user)
    try:
        session.commit()
        session.refresh(user)
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=409,
            detail="Username or email already exists",
        )

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
    }


@router.post("/login")
def login(
    user_data: UserLogin,
    response: Response,
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.email == user_data.email)).first()

    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=7 * 24 * 60 * 60,
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh")
def refresh(request: Request):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Refresh token missing",
        )

    try:
        payload = jwt.decode(
            refresh_token,
            settings.jwt_secret_key,
            algorithms=["HS256"],
        )
        user_id = int(payload["sub"])

    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token",
        )

    return {
        "access_token": create_access_token(user_id),
        "token_type": "bearer",
    }
