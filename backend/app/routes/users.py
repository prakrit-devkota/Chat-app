from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.dependencies import get_current_user
from app.models import User

router = APIRouter(tags=["users"])


@router.get("/protected")
def protected(user_id: int = Depends(get_current_user)):
    return {
        "message": "You are authenticated!",
        "user_id": user_id,
    }


@router.get("/users")
def get_users(
    current_user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    users = session.exec(
        select(User).where(User.id != current_user_id)
    ).all()

    return [{"id": u.id, "username": u.username} for u in users]