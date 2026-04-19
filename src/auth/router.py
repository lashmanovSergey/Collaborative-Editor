from fastapi import APIRouter
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.requests import Request

from src.users.schemas import user_auth_dto, user_reg_dto
from src.config import settings
from datetime import timedelta

from src.users.service import get_user_from_db, create_user_in_db, check_user_password, check_user_in_db
from src.users.exceptions import UsernameAlreadyExistsException, UserNotFoundException
from src.auth.exceptions import InvalidCredentialsException
from src.auth.service import create_access_token

from src.auth.utils import get_token_from_cookie
import jwt
from jwt.exceptions import DecodeError

router_for_auth = APIRouter(
    prefix="",
    tags=["authentication"]
)

@router_for_auth.post("/auth")
def auth(user_dto: user_auth_dto):
    # get user if exist
    user = get_user_from_db(user_dto.username)

    # validate credentials
    check_user_password(user.password_hash, user_dto.password)

    # create JWT Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    redirect_response = RedirectResponse(url="/profile", status_code=200)
    
    redirect_response.set_cookie(
        key="access_token",
        value=f"{access_token}",
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=3600
    )

    return redirect_response

@router_for_auth.post("/register")
def register(user_dto: user_reg_dto):
    # check if username is already exist
    if check_user_in_db(user_dto.username):
        raise UsernameAlreadyExistsException
    
    # create user in db
    create_user_in_db(user_dto.username, user_dto.password)

    # get user
    user = get_user_from_db(user_dto.username)

    # create JWT Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    redirect_response = RedirectResponse(url="/profile", status_code=200)

    redirect_response.set_cookie(
        key="access_token",
        value=f"{access_token}",
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=3600
    )

    return redirect_response
    
@router_for_auth.post("/logout")
def logout():
    redirect_response = RedirectResponse(url="/auth", status_code=200)
    redirect_response.delete_cookie("access_token")
    return redirect_response

@router_for_auth.post("/me")
def me(request: Request):
    access_token = get_token_from_cookie(request)
    try:
        payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except DecodeError:
        return JSONResponse(
            status_code=400,
            content={
                'error':'invalid jwt token'
            }
        )

    return JSONResponse(
        status_code=200,
        content={
            'username': payload.get('sub')
        }
    )
    