from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, UniqueConstraint
from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class Conversation(SQLModel, table=True):
    __tablename__ = "conversation"
    __table_args__ = (
        CheckConstraint("user_a_id < user_b_id", name="ck_conversation_ordered"),
        UniqueConstraint("user_a_id", "user_b_id", name="uq_conversation_pair"),
        Index("idx_conversation_user_b", "user_b_id"),
    )

    id: int | None = Field(default=None, primary_key=True)
    user_a_id: int = Field(foreign_key="user.id", ondelete="CASCADE")  # smaller id
    user_b_id: int = Field(foreign_key="user.id", ondelete="CASCADE")  # larger id
    user_a_last_read_message_id: int | None = Field(default=None)
    user_b_last_read_message_id: int | None = Field(default=None)
    created_at: datetime = Field(
        default_factory=utcnow, sa_type=DateTime(timezone=True)
    )