from sqlalchemy import select
from sqlalchemy.orm import Session

from src.rooms.constants import room_forbidden_message, room_not_found_message
from src.rooms.exceptions import RoomForbiddenError, RoomNotFoundError
from src.rooms.models import Room
from src.rooms.utils import make_room_guid


def create_room(db: Session, username: str, title: str) -> Room:
    room = Room(username=username, guid=make_room_guid(), title=title, current_content="")
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def get_user_rooms(db: Session, username: str) -> list[Room]:
    return list(db.scalars(select(Room).where(Room.username == username).order_by(Room.created_at.desc())).all())


def get_room_by_guid(db: Session, guid: str) -> Room | None:
    return db.scalar(select(Room).where(Room.guid == guid))


def require_room_owner(db: Session, guid: str, username: str) -> Room:
    room = get_room_by_guid(db, guid)
    if room is None:
        raise RoomNotFoundError(room_not_found_message)
    if room.username != username:
        raise RoomForbiddenError(room_forbidden_message)
    return room


def delete_room(db: Session, guid: str, username: str):
    room = require_room_owner(db, guid, username)
    db.delete(room)
    db.commit()
