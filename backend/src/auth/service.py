from sqlalchemy import select
from sqlalchemy.orm import Session

from src.auth.constants import invalid_credentials_message, user_exists_message
from src.auth.exceptions import InvalidCredentialsError, UserAlreadyExistsError
from src.auth.models import User
from src.auth.utils import normalize_username
from src.simple_security import hash_password, verify_password


def register_user(db: Session, username: str, password: str, password_confirm: str) -> User:
    username = normalize_username(username)
    if password != password_confirm:
        raise UserAlreadyExistsError("passwords do not match")

    existing = db.scalar(select(User).where(User.username == username))
    if existing is not None:
        raise UserAlreadyExistsError(user_exists_message)

    user = User(username=username, password_hash=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> User:
    username = normalize_username(username)
    user = db.scalar(select(User).where(User.username == username))
    if user is None:
        raise InvalidCredentialsError(invalid_credentials_message)
    if not verify_password(password, user.password_hash):
        raise InvalidCredentialsError(invalid_credentials_message)
    return user
