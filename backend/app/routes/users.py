from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy import delete

from app.database import get_session
from app.dependencies import get_current_user
from app.models import User, Message, Conversation, Friendship
from app.models.enum import FriendshipStatus
from app.schemas import PasswordConfirmation
from app.security import verify_password

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
    users = session.exec(select(User).where(User.id != current_user_id)).all()

    return [{"id": u.id, "username": u.username} for u in users]


@router.delete("/users/delete")
def delete_user(
    credentials: PasswordConfirmation,
    current_user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    user = session.get(User, current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=403, detail="Incorrect password")

    if user:
        # Delete associated messages and conversations
        session.exec(delete(Message).where(Message.sender_id == current_user_id))
        session.exec(
            delete(Conversation).where(
                (Conversation.user_a_id == current_user_id)
                | (Conversation.user_b_id == current_user_id)
            )
        )
        session.delete(user)
        session.commit()
        return {"message": "User deleted successfully"}

@router.post("/users/friend-request/{user_id}")
def send_friend_request(
    user_id: int,
    current_user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user_id == current_user_id:
        raise HTTPException(
            status_code=400, detail="Cannot send a friend request to yourself"
        )

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    friendship = session.exec(
        select(Friendship).where(
            (
                (Friendship.requester_id == current_user_id)
                & (Friendship.addressee_id == user_id)
            )
            | (
                (Friendship.requester_id == user_id)
                & (Friendship.addressee_id == current_user_id)
            )
        )
    ).first()

    if friendship:
        if friendship.status == FriendshipStatus.accepted:
            raise HTTPException(status_code=409, detail="You are already friends")
        if friendship.status == FriendshipStatus.pending:
            if friendship.requester_id == current_user_id:
                return {"message": "Friend request already sent", "status": "pending"}
            raise HTTPException(
                status_code=409,
                detail="This user has already sent you a friend request",
            )
        raise HTTPException(status_code=403, detail="Friend request unavailable")

    session.add(Friendship(requester_id=current_user_id, addressee_id=user_id))
    session.commit()
    return {"message": f"Friend request sent to user {user.username}", "status": "pending"}

@router.get("/users/friends")
def get_friends(
    current_user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    friendships = session.exec(
        select(Friendship).where(
            (Friendship.requester_id == current_user_id)
            | (Friendship.addressee_id == current_user_id),
            Friendship.status == FriendshipStatus.accepted,
        )
    ).all()

    friends = []
    for friendship in friendships:
        if friendship.requester_id == current_user_id:
            friend_id = friendship.addressee_id
        else:
            friend_id = friendship.requester_id

        friend = session.get(User, friend_id)
        if friend:
            friends.append({"id": friend.id, "username": friend.username})

    return friends

@router.get("/users/friends/requests")
def get_incoming_friend_requests(
    current_user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    requests = session.exec(
        select(Friendship).where(
            Friendship.addressee_id == current_user_id,
            Friendship.status == FriendshipStatus.pending,
        )
    ).all()

    return [
        {"id": user.id, "username": user.username}
        for request in requests
        if (user := session.get(User, request.requester_id))
    ]


@router.get("/users/friends/requests/sent")
def get_sent_friend_requests(
    current_user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    requests = session.exec(
        select(Friendship).where(
            Friendship.requester_id == current_user_id,
            Friendship.status == FriendshipStatus.pending,
        )
    ).all()

    return [
        {"id": user.id, "username": user.username}
        for request in requests
        if (user := session.get(User, request.addressee_id))
    ]

@router.post("/users/friend-request-accept/{user_id}")
def accept_friend_request(
    user_id: int,
    current_user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    friendship = session.exec(
        select(Friendship).where(
            (Friendship.requester_id == user_id)
            & (Friendship.addressee_id == current_user_id)
        )
    ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")

    friendship.status = "accepted"
    session.add(friendship)
    session.commit()
    session.refresh(friendship)

    return {"message": f"Friend request from user {user_id} accepted"}