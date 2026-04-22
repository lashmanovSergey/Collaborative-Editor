from src.rooms.models import Room
from sqlalchemy import select, update, delete
from src.database import SessionLocal
import uuid

def get_room(uuid: str) -> Room:
    """ GET room (by uuid)"""
    query = select(Room).where(Room.uuid == uuid)

    with SessionLocal() as session:
        room = session.execute(query).scalar()
    
    return room

def get_rooms(username: str) -> list[Room]:
    """ GET user (by username) rooms """
    query = select(Room).where(Room.username == username)
    
    rooms = []

    with SessionLocal() as session:
        for room in session.execute(query).scalars():
            rooms.append(room)

    return rooms

def create_room(username: str, name: str) -> Room:
    """ CREATE user (by username) room """
    room_uuid = str(uuid.uuid4())

    with SessionLocal() as session:
        room = Room(
            uuid=room_uuid,
            username=username,
            name=name,
        )

        session.add(room)
        session.commit()
        
    return get_room(room_uuid)
    
def update_room(uuid: str, room: Room) -> Room:
    """ UPDATE room (by uuid) with new room (by room)"""
    query = update(Room).where(
        Room.uuid == uuid,
    ).values(name = room.name)

    with SessionLocal() as session:
        session.execute(query)
        session.commit()

    return get_room(uuid)

def delete_room(uuid: str) -> Room:
    """ DELETE room (by uuid)"""
    room = get_room(uuid)

    query = delete(Room).where(Room.uuid == uuid)

    with SessionLocal() as session:
        session.execute(query)
        session.commit()

    return room