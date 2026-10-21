from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordConfirmation(BaseModel):
    password: str


class IncomingMessage(BaseModel):
    type: str
    conversation_id: int
    body: str


class ConversationCreate(BaseModel):
    user_b_id: int
