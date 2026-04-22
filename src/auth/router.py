from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.requests import Request
from src.auth.exceptions import inactive_user
from typing import Annotated
from src.users.models import User
from src.users.schemas import user_auth_dto, user_reg_dto
from src.users.exceptions import UsernameAlreadyExistsException, UserNotFoundException
from src.users.database import get_user, create_user
from src.service import check_passwords
from src.auth.service import get_current_user, create_access_token

router_for_auth = APIRouter(
    prefix="",
    tags=["authentication"]
)

@router_for_auth.post("/auth")
def route_auth(user_dto: user_auth_dto):
    user = get_user(user_dto.username)

    # Check if user exist
    if user == None:
        raise InvalidCredentialsException

    # Check if password valid
    if check_passwords(user.password_hash, user_dto.password) == False:
        raise InvalidCredentialsException

    access_token = create_access_token(data={"sub": user.username})

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
    user = get_user(user_dto.username)

    # Check if username already in use
    if user != None:
        raise UsernameAlreadyExistsException
    
    user = create_user(user_dto.username, user_dto.password)

    access_token = create_access_token(data={"sub": user.username})

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
def me(request: Request, user: Annotated[User, Depends(get_current_user)]):
    if user == None:
        raise inactive_user

    return JSONResponse(
        status_code=200,
        content={
            'username': user.username
        }
    )
    