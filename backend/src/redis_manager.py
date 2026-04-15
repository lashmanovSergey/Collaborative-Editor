import asyncio
import json
from collections import defaultdict

from redis.asyncio import Redis

from src.config import settings


class RedisManager:
    def __init__(self):
        self.client: Redis | None = None
        self.enabled = False
        self.locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

    async def connect(self):
        try:
            self.client = Redis.from_url(settings.redis_url, decode_responses=True)
            await self.client.ping()
            self.enabled = True
        except Exception:
            self.client = None
            self.enabled = False

    async def disconnect(self):
        if self.client is not None:
            await self.client.aclose()

    async def get_content(self, guid: str) -> str | None:
        if not self.enabled or self.client is None:
            return None
        return await self.client.get(f"room:{guid}:content")

    async def set_content(self, guid: str, content: str):
        if not self.enabled or self.client is None:
            return
        await self.client.set(f"room:{guid}:content", content)

    async def publish(self, guid: str, message: dict):
        if not self.enabled or self.client is None:
            return
        await self.client.publish(f"room:{guid}:channel", json.dumps(message))

    async def subscribe(self, guid: str):
        if not self.enabled or self.client is None:
            return None
        pubsub = self.client.pubsub()
        await pubsub.subscribe(f"room:{guid}:channel")
        return pubsub


redis_manager = RedisManager()
