import asyncio

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic import ValidationError
from sqlmodel import Session

from app.database import get_session
from app.dependencies import decode_access_token
from app.models import Conversation, Message
from app.schemas import IncomingMessage
from app.ws_manager import manager

router = APIRouter(tags=["chat"])

AUTH_TIMEOUT_SECONDS = 5


def save_message(
    sender_id: int,
    conversation_id: int,
    body: str,
    session: Session,
) -> Message | None:
    conversation = session.get(Conversation, conversation_id)

    if conversation is None or sender_id not in (
        conversation.user_a_id,
        conversation.user_b_id,
    ):
        return None

    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        body=body,
    )

    try:
        session.add(message)
        session.commit()
        session.refresh(message)
        return message
    except Exception:
        session.rollback()
        raise


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    session: Session = Depends(get_session),
):
    await websocket.accept()

    user_id = None
    connected = False

    try:
        # 1. Require authentication as the first WebSocket message.
        try:
            auth_data = await asyncio.wait_for(
                websocket.receive_json(),
                timeout=AUTH_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            await websocket.close(
                code=1008,
                reason="Authentication timeout",
            )
            return

        if not isinstance(auth_data, dict):
            await websocket.close(
                code=1008,
                reason="Authentication required",
            )
            return

        if auth_data.get("type") != "authenticate":
            await websocket.close(
                code=1008,
                reason="Authentication must be the first message",
            )
            return

        token = auth_data.get("token")

        if not isinstance(token, str) or not token:
            await websocket.close(
                code=1008,
                reason="Missing token",
            )
            return

        try:
            user_id = decode_access_token(token)
        except ValueError:
            await websocket.close(
                code=1008,
                reason="Invalid or expired token",
            )
            return

        # 2. Register only authenticated users.
        await manager.connect(user_id, websocket)
        connected = True

        # 3. Send the current online-user snapshot.
        await websocket.send_json(
            {
                "type": "online_users",
                "user_ids": [int(user_id) for user_id in manager.active.keys()],
            }
        )

        # Always notify peers that this account is online, including refresh/reconnects.
        await manager.broadcast(
            {
                "type": "user_status",
                "user_id": user_id,
                "status": "online",
            }
        )
        await manager.broadcast(
            {
                "type": "user_connected",
                "user_id": user_id,
            }
        )

        # 4. Receive and process messages.
        while True:
            raw_data = await websocket.receive_json()

            try:
                incoming = IncomingMessage.model_validate(raw_data)
            except ValidationError:
                await websocket.send_json(
                    {
                        "type": "error",
                        "detail": "Invalid message format",
                    }
                )
                continue

            if incoming.type != "message":
                await websocket.send_json(
                    {
                        "type": "error",
                        "detail": "Unsupported event type",
                    }
                )
                continue

            # 5. Validate conversation membership and save.
            try:
                message = save_message(
                    sender_id=user_id,
                    conversation_id=incoming.conversation_id,
                    body=incoming.body,
                    session=session,
                )
            except Exception:
                await websocket.send_json(
                    {
                        "type": "error",
                        "detail": "Failed to save message",
                    }
                )
                continue

            if message is None:
                await websocket.send_json(
                    {
                        "type": "error",
                        "detail": "Conversation not found or access denied",
                    }
                )
                continue

            # 6. Identify the recipient.
            conversation = session.get(
                Conversation,
                incoming.conversation_id,
            )

            if conversation is None:
                await websocket.send_json(
                    {
                        "type": "error",
                        "detail": "Conversation no longer exists",
                    }
                )
                continue

            if conversation.user_a_id == user_id:
                recipient_id = conversation.user_b_id
            else:
                recipient_id = conversation.user_a_id

            # 7. Build the payload from the saved database record.
            message_data = {
                "id": message.id,
                "conversation_id": message.conversation_id,
                "sender_id": message.sender_id,
                "body": message.body,
                "created_at": message.created_at.isoformat(),
            }

            # 8. Deliver to the recipient and confirm to the sender.
            await manager.send_to_user(
                recipient_id,
                {
                    "type": "message",
                    "message": message_data,
                },
            )

            await manager.send_to_user(
                user_id,
                {
                    "type": "message_sent",
                    "message": message_data,
                },
            )

    except WebSocketDisconnect:
        pass

    finally:
        if connected and user_id is not None:
            last_connection = manager.disconnect(user_id, websocket)

            if last_connection:
                await manager.broadcast(
                    {
                        "type": "user_status",
                        "user_id": user_id,
                        "status": "offline",
                    }
                )

        if session is not None:
            session.close()
