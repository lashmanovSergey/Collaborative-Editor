from fastapi import FastAPI, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware

from src.auth.router import router_for_auth
from src.rooms.router import router_for_rooms
from src.documents.router import router_for_documents
from src.documents.router import router_for_websockets

from src.auth.service import get_current_user

app = FastAPI()

secure_router = APIRouter(
    dependencies=[Depends(get_current_user)]
)

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_for_auth)
app.include_router(router_for_rooms)
app.include_router(router_for_documents)
app.include_router(router_for_websockets)

@secure_router.get("/profile")
def profile():
    return "You are welcome!"

app.include_router(secure_router)
