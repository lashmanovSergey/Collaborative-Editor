from fastapi import APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from src.database import engine
from src.rooms.models import Room

from src.rooms.exceptions import RoomNotFoundException

import uuid

def find_room(uuid: str, username: str) -> None:
    query = select(Room).where(Room.uuid == uuid, Room.username == username)

    with Session(engine) as session:
        if session.execute(query).scalar() == None:
            raise RoomNotFoundException

def create_room_in_db(username: str) -> None:
    room_uuid = str(uuid.uuid4())
    with Session(engine) as session:
        session.add(Room(
            uuid=room_uuid,
            username=username,
        ))
        session.commit()

def delete_room_from_db(uuid: str, username: str) -> None:
    # check if room exist
    find_room(uuid, username)

    # delete room
    query = delete(Room).where(Room.uuid == uuid, Room.username == username)
    with Session(engine) as session:
        session.execute(query)
        session.commit()

def get_all_rooms_from_db(username: str) -> list:
    query = select(Room).where(Room.username == username)
    rooms = {
        "rooms": []
    }
    with Session(engine) as session:
        for room in session.execute(query).scalars():
            rooms["rooms"].append(room.uuid)
    return rooms
    


