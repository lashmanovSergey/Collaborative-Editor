import asyncio

from src.config import settings
from src.database import SessionLocal
from src.documents.service import create_snapshot, trim_history
from src.redis_manager import redis_manager
from src.rooms.service import get_room_by_guid


class AutoSaveManager:
    def __init__(self):
        self.tasks: dict[str, asyncio.Task] = {}
        self.last_content: dict[str, str] = {}

    def ensure_started(self, guid: str):
        if guid not in self.tasks:
            self.tasks[guid] = asyncio.create_task(self.worker(guid))

    async def worker(self, guid: str):
        try:
            while True:
                await asyncio.sleep(settings.auto_save_seconds)
                content = await redis_manager.get_content(guid)
                if content is None:
                    continue
                if self.last_content.get(guid) == content:
                    continue

                db = SessionLocal()
                room = get_room_by_guid(db, guid)
                if room is None:
                    db.close()
                    break
                create_snapshot(db, guid, content, 'auto')
                trim_history(db, guid)
                db.close()
                self.last_content[guid] = content
        except asyncio.CancelledError:
            pass

    async def stop_all(self):
        for task in self.tasks.values():
            task.cancel()
        self.tasks.clear()


auto_save_manager = AutoSaveManager()
