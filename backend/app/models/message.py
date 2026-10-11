from datetime import datetime

from sqlalchemy import DateTime, Index
from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class Message(SQLModel, table=True):
    __tablename__ = "message"
    __table_args__ = (
        Index("idx_message_conversation", "conversation_id", "id"),
    )

    id: int | None = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id", ondelete="CASCADE")
    sender_id: int = Field(foreign_key="user.id")
    reply_to_id: int | None = Field(
        default=None, foreign_key="message.id", ondelete="SET NULL"
    )
    body: str
    created_at: datetime = Field(
        default_factory=utcnow, sa_type=DateTime(timezone=True)
    )
    edited_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    deleted_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))