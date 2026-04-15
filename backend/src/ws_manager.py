import asyncio
import json
from collections import defaultdict

from fastapi import WebSocket

from src.redis_manager import redis_manager


class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, set[WebSocket]] = defaultdict(set)
        self.redis_tasks: dict[str, asyncio.Task] = {}

    async def connect(self, guid: str, websocket: WebSocket):
        await websocket.accept()
        self.connections[guid].add(websocket)
        if redis_manager.enabled and guid not in self.redis_tasks:
            self.redis_tasks[guid] = asyncio.create_task(self.redis_listener(guid))

    async def disconnect(self, guid: str, websocket: WebSocket):
        self.connections[guid].discard(websocket)
        if not self.connections[guid]:
            self.connections.pop(guid, None)
            task = self.redis_tasks.pop(guid, None)
            if task:
                task.cancel()

    async def broadcast_local(self, guid: str, message: dict):
        dead = []
        for ws in self.connections.get(guid, set()):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.connections[guid].discard(ws)

    async def broadcast(self, guid: str, message: dict):
        await self.broadcast_local(guid, message)
        await redis_manager.publish(guid, message)

    async def redis_listener(self, guid: str):
        pubsub = await redis_manager.subscribe(guid)
        if pubsub is None:
            return
        try:
            async for item in pubsub.listen():
                if item.get("type") != "message":
                    continue
                data = json.loads(item["data"])
                await self.broadcast_local(guid, data)
        except asyncio.CancelledError:
            pass
        finally:
            try:
                await pubsub.unsubscribe(f"room:{guid}:channel")
                await pubsub.aclose()
            except Exception:
                pass


ws_manager = ConnectionManager()
