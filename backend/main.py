from fastapi import Depends, FastAPI
from sqlmodel import Session

from app.database import get_session
from app.models import User
from app.schemas import UserCreate
from app.security import hash_password

app = FastAPI()


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
    session.commit()
    session.refresh(user)

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email
    }