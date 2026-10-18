
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.dependencies import get_current_user
from app.models import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas import ConversationCreate

router = APIRouter(tags=["conversations"])


@router.post("/conversation")
async def create_conversation(
    data: ConversationCreate,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    user_b = session.get(User, data.user_b_id)

    if not user_b:
        raise HTTPException(status_code=404, detail="User not found")

    if user_id == data.user_b_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot create a conversation with yourself",
        )

    # Always use the same order for both users.
    user_a_id = min(user_id, data.user_b_id)
    user_b_id = max(user_id, data.user_b_id)

    # Check whether this conversation already exists.
    statement = select(Conversation).where(
        Conversation.user_a_id == user_a_id,
        Conversation.user_b_id == user_b_id,
    )

    existing_conversation = session.exec(statement).first()

    if existing_conversation:
        return {"conversation_id": existing_conversation.id}

    # Create a new conversation using the correct ID order.
    conversation = Conversation(
        user_a_id=user_a_id,
        user_b_id=user_b_id,
    )

    session.add(conversation)
    session.commit()
    session.refresh(conversation)

    return {"conversation_id": conversation.id}


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation(
    conversation_id: int,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    conversation = session.get(Conversation, conversation_id)

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    if user_id not in (
        conversation.user_a_id,
        conversation.user_b_id,
    ):
        raise HTTPException(
            status_code=403,
            detail="You are not a participant in this conversation",
        )

    statement = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.id)
    )

    messages = session.exec(statement).all()
    return messages
