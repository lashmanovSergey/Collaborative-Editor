from fastapi import APIRouter, Depends
from fastapi.responses import Response, JSONResponse
from fastapi.requests import Request
from src.auth.service import get_current_user, get_token_from_cookie
from src.rooms.service import create_room_in_db, delete_room_from_db, get_all_rooms_from_db, \
    update_room_name_in_db
from src.documents.service import get_documents_from_db
from src.rooms.schemas import create_room_dto, update_room_dto
from src.service import check_uuid

router_for_rooms = APIRouter(
    prefix="",
    tags=["rooms"],
    dependencies=[Depends(get_current_user)]
)

@router_for_rooms.get("/rooms")
def get_rooms(request: Request):
    token = get_token_from_cookie(request)
    user = get_current_user(token=token)

    rooms = get_all_rooms_from_db(user.username)

    return JSONResponse(
        status_code=200,
        content=rooms,
    )

@router_for_rooms.post("/rooms")
def create_room(room_dto: create_room_dto, request: Request) -> str:
    token = get_token_from_cookie(request)
    user = get_current_user(token=token)

    room_json = create_room_in_db(user.username, room_dto.name)
    documents = get_documents_from_db(room_json['uuid'])
    room_json['childrenCount'] = len(documents["documents"])

    print(room_json)

    return JSONResponse(
        status_code=200,
        content=room_json
    )

@router_for_rooms.delete("/rooms/{uuid}")
def delete_room(uuid: str, request: Request):
    check_uuid(uuid)

    token = get_token_from_cookie(request)
    user = get_current_user(token=token)

    delete_room_from_db(uuid, user.username)

    return JSONResponse(
        status_code=200,
        content = {
            "detail": "you deleted room"
        },
    )

@router_for_rooms.put("/rooms/{uuid}")
def update_room(uuid: str, room_dto: update_room_dto, request: Request):
    check_uuid(uuid)

    token = get_token_from_cookie(request)
    user = get_current_user(token=token)

    room = update_room_name_in_db(uuid, user.username, room_dto.name)

    return JSONResponse(
        status_code=200,
        content=room
    )