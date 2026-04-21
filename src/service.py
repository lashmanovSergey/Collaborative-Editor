from src.exceptions import InvalidUUIDException
from src.exceptions import AccessDeniedException
from src.users.models import User
from src.auth.service import get_current_user
from src.rooms.service import get_room_from_db

from typing import Annotated

from fastapi import Depends
from fastapi.requests import Request

import uuid

def check_uuid(uuid_: str, version: int = 4) -> None:
    try:
        uuid.UUID(uuid_, version=version)
    except ValueError:
        raise InvalidUUIDException

def check_user_room_access(room_uuid: str, user: Annotated[User, Depends(get_current_user)]) -> None:
    if get_room_from_db(room_uuid, user.username) == None:
        raise AccessDeniedException

    
    