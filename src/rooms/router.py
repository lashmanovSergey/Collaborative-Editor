from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from src.auth.service import get_current_user
from src.rooms.schemas import room_dto
from src.users.models import User
from src.rooms.models import Room
from typing import Annotated
import src.rooms.database as db

router_for_rooms = APIRouter(
    prefix="",
    tags=["rooms"],
    dependencies=[Depends(get_current_user)]
)

@router_for_rooms.get("/rooms")
def route_get_rooms(request: Request, user: Annotated[User, Depends(get_current_user)]) -> JSONResponse:
    rooms = db.get_rooms(user.username)

    return JSONResponse(
        status_code=200,
        content={
            'rooms': [room.to_dict() for room in rooms]
        },
    )

@router_for_rooms.post("/rooms")
def route_create_room(dto: room_dto, request: Request, user: Annotated[User, Depends(get_current_user)]) -> JSONResponse:
    room = db.create_room(user.username, dto.name)

    return JSONResponse(
        status_code=200,
        content=room.to_dict()
    )

@router_for_rooms.delete("/rooms/{uuid}")
def delete_room(uuid: str, request: Request) -> JSONResponse:
    room = db.delete_room(uuid)

    return JSONResponse(
        status_code=200,
        content=room.to_dict(),
    )

@router_for_rooms.patch("/rooms/{uuid}")
def update_room(uuid: str, dto: room_dto, request: Request, user: Annotated[User, Depends(get_current_user)]):
    new_room = Room(
        uuid = uuid,
        name = dto.name,
        username = user.username,
    )

    room = db.update_room(uuid, new_room)

    return JSONResponse(
        status_code=200,
        content=room.to_dict()
    )