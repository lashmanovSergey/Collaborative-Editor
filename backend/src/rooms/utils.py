import uuid


def make_room_guid() -> str:
    return str(uuid.uuid4())
