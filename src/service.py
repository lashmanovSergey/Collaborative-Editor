from src.exceptions import InvalidUUIDException
import uuid

def check_uuid(uuid_: str, version: int = 4) -> None:
    try:
        uuid.UUID(uuid_, version=version)
    except ValueError:
        raise InvalidUUIDException