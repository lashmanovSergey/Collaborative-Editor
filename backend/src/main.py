from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from src.auth.router import router as auth_router
from src.auto_save import auto_save_manager
from src.config import settings
from src.database import Base, SessionLocal, engine
from src.documents.router import router as documents_router
from src.redis_manager import redis_manager
from src.rooms.models import Room
from src.rooms.router import router as rooms_router
from src.users.router import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    await redis_manager.connect()

    db = SessionLocal()
    try:
        for room in db.query(Room).all():
            auto_save_manager.ensure_started(room.guid)
    finally:
        db.close()

    yield

    await auto_save_manager.stop_all()
    await redis_manager.disconnect()


app = FastAPI(title='collaborative editor backend', lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(rooms_router)
app.include_router(documents_router)


@app.get('/', summary='redirects to /auth')
def root():
    return RedirectResponse(url='/auth')


@app.post('/rooms/start-autosave/{guid}', include_in_schema=False)
def start_autosave(guid: str):
    auto_save_manager.ensure_started(guid)
    return {'status': 'started'}
