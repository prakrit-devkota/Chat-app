from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.dependencies import get_current_user
from app.models import User, Message, Conversation
from app.ws_manager import manager
from app.schemas import IncomingMessage

router = APIRouter(tags=["chat"])


def save_message(sender_id: int, conversation_id: int, body: str, session: Session):
    conversation = session.get(Conversation, conversation_id)

    if conversation is None or sender_id not in (
        conversation.user_a_id,
        conversation.user_b_id,
    ):
        return None

    try:
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            body=body,
        )
        session.add(message)
        session.commit()
        session.refresh(message)
        return message
    except Exception:
        session.rollback()
        raise HTTPException(status_code=500, detail="Failed to save message")


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Register the connection
    first_connection = await manager.connect(user_id, websocket)
    online_users = list(manager.active.keys())

    await websocket.send_json(
        {
            "type": "online_users",
            "user_ids": online_users,
        }
    )

    if first_connection:
        await manager.broadcast(
            {
                "type": "user_connected",
                "user_id": user_id,
            }
        )

    try:
        while True:
            data = await websocket.receive_json()

            # We'll handle incoming messages here next!
            # Receive messages
            # Save messages
            # Send messages to the intended recipient
            pass
    except WebSocketDisconnect:
        pass
    finally:
        last_connection = manager.disconnect(user_id, websocket)

        if last_connection:
            await manager.broadcast(
                {
                    "type": "user_status",
                    "user_id": user_id,
                    "status": "offline",
                }
            )
