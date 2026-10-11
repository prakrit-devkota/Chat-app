from sqlalchemy import CheckConstraint, Index, func
from sqlmodel import Field, SQLModel, text
from .enum import FriendshipStatus

class Friendship(SQLModel, table=True):
    __tablename__ = "friendship"

    __table_args__ = (
        CheckConstraint("requester_id <> addressee_id", name="ck_friendship_not_self"),
        Index(
            "uq_friendship_pair",
            text("LEAST(requester_id, addressee_id)"),
            text("GREATEST(requester_id, addressee_id)"),
            unique=True,
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    requester_id: int = Field(foreign_key="user.id")
    addressee_id: int = Field(foreign_key="user.id")
    status: FriendshipStatus = Field(default=FriendshipStatus.pending)