from fastapi import APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from src.database import engine
from src.rooms.models import Room

from src.rooms.exceptions import RoomNotFoundException
from src.documents.service import get_documents_from_db

import uuid

def find_room(uuid: str, username: str) -> None:
    query = select(Room).where(Room.uuid == uuid, Room.username == username)

    with Session(engine) as session:
        if session.execute(query).scalar() == None:
            raise RoomNotFoundException

def create_room_in_db(username: str, name) -> dict:
    room_uuid = str(uuid.uuid4())
    with Session(engine) as session:
        room = Room(
            uuid=room_uuid,
            username=username,
            name=name,
        )
        session.add(room)
        session.commit()
        
        return {
            'uuid': room_uuid,
            'name': name
        }

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
            rooms["rooms"].append(
                {
                    'uuid': room.uuid,
                    'name': room.name,
                    'childrenCount': len(get_documents_from_db(room.uuid)),
                }
            )
    return rooms
    


