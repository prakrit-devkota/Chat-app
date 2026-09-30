from fastapi import Depends, FastAPI,HTTPException,Response,Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session,select
from sqlalchemy.exc import IntegrityError
from app.config import settings
import jwt
from fastapi.middleware.cors import CORSMiddleware
security=HTTPBearer()
from app.database import get_session
from app.models import User
from app.schemas import UserCreate, UserLogin
from app.security import hash_password,verify_password,create_access_token,create_refresh_token
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/register")
def register(
    user_data: UserCreate,
    session: Session = Depends(get_session)
):
    hashed_password = hash_password(user_data.password)

    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password
    )

    session.add(user)
    try:
        session.commit()
        session.refresh(user)

    except IntegrityError:
        session.rollback()

        raise HTTPException(
            status_code=409,
            detail="Username or email already exists"
        )

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email
    }

@app.post("/login")
def login(
    user_data: UserLogin,
    response:Response,
    session: Session = Depends(get_session)
):
    statement = select(User).where(User.email == user_data.email)

    user = session.exec(statement).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
        status_code=401,
        detail="Invalid email or password"
        )
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    response.set_cookie(
    key="refresh_token",
    value=refresh_token,
    httponly=True,
    max_age=7 * 24 * 60 * 60
)


    return {"access_token": access_token, 
            "token_type": "bearer"}

@app.post("/refresh")
def refresh(
    request: Request
):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Refresh token missing"
        )

    try:
        payload = jwt.decode(
            refresh_token,
            settings.jwt_secret_key,
            algorithms=["HS256"]
        )

        user_id = int(payload["sub"])

    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token"
        )

    access_token = create_access_token(user_id)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    payload = jwt.decode(
    token,
    settings.jwt_secret_key,
    algorithms=["HS256"]
)
    user_id = int(payload["sub"])
    return user_id

@app.get("/protected")
def protected(user_id: int = Depends(get_current_user)):
    return {
        "message": "You are authenticated!",
        "user_id": user_id
    }