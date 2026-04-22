from src.exceptions import InvalidUUIDException, InvalidCredentialsException
import uuid
import bcrypt

def check_uuid(uuid_: str, version: int = 4) -> str:
    try:
        uuid.UUID(uuid_, version=version)
    except ValueError:
        raise InvalidUUIDException
    return uuid_

def check_passwords(password_hash: str, password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        