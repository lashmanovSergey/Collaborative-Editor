from typing import Annotated
from fastapi import Depends
from datetime import timedelta, datetime, timezone
import jwt
from jwt.exceptions import InvalidTokenError

from src.auth.exceptions import credentials_exception, inactive_user
from src.auth.config import Token, TokenData
from src.auth.utils import get_token_from_cookie
from src.users.service import get_user_from_db
from src.config import settings

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)

    to_encode.update({"exp":expire})

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return encoded_jwt

def get_current_user(token: Annotated[str, Depends(get_token_from_cookie)]):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        username = payload.get("sub")

        if username is None:
            raise credentials_exception

        token_data = TokenData(username=username)
        
    except InvalidTokenError:
        raise credentials_exception
    
    user = get_user_from_db(username=token_data.username)

    return user