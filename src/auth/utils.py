from fastapi.requests import Request
from src.auth.exceptions import credentials_exception

def get_token_from_cookie(request: Request) -> str:
    access_token = request.cookies.get("access_token")
    if access_token == None:
        raise credentials_exception
    return access_token