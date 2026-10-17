from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active: dict[int, set[WebSocket]] = {}

    async def connect(self, user_id: int, ws: WebSocket) -> bool:
        await ws.accept()
        first_connection = user_id not in self.active
        self.active.setdefault(user_id, set()).add(ws)
        return first_connection

    def disconnect(self, user_id: int, ws: WebSocket) -> bool:
        sockets = self.active.get(user_id)
        if not sockets:
            return False
        sockets.discard(ws)
        if not sockets:
            del self.active[user_id]
            return True
        return False

    async def send_to_user(self, user_id: int, data: dict):
        for ws in list(self.active.get(user_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(user_id, ws)

    async def broadcast(self, data: dict):
        for sockets in list(self.active.values()):
            for ws in list(sockets):
                try:
                    await ws.send_json(data)
                except Exception:
                    # We'll handle failed connections during cleanup
                    pass


manager = ConnectionManager()



