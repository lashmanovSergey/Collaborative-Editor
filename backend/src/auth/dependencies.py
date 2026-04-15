from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from src.auth.models import User
from src.database import get_db
from src.simple_security import decode_access_token


def get_optional_username(access_token: str | None = Cookie(default=None)) -> str | None:
    if not access_token:
        return None
    try:
        payload = decode_access_token(access_token)
        return payload.get("sub")
    except Exception:
        return None


def get_current_user(
    db: Session = Depends(get_db),
    access_token: str | None = Cookie(default=None),
) -> User:
    if not access_token:
        raise HTTPException(status_code=401, detail="not authenticated")
    try:
        payload = decode_access_token(access_token)
        username = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="invalid token")

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="user not found")
    return user
