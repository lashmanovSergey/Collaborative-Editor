from fastapi import APIRouter, Depends, Form, HTTPException, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user
from src.auth.exceptions import InvalidCredentialsError, UserAlreadyExistsError
from src.auth.schemas import LoginRequest, RegisterRequest, TokenResponse
from src.auth.service import authenticate_user, register_user
from src.config import settings
from src.database import get_db
from src.simple_security import create_access_token

router = APIRouter(tags=["auth"])


def auth_page_html(message: str = "") -> str:
    return f"""
    <html>
      <body>
        <h2>login</h2>
        <form method='post' action='/auth/form'>
          <input name='username' placeholder='username' />
          <input name='password' placeholder='password' type='password' />
          <button type='submit'>login</button>
        </form>
        <p style='color:red;'>{message}</p>
      </body>
    </html>
    """


def register_page_html(message: str = "") -> str:
    return f"""
    <html>
      <body>
        <h2>register</h2>
        <form method='post' action='/register/form'>
          <input name='username' placeholder='username' />
          <input name='password' placeholder='password' type='password' />
          <input name='password_confirm' placeholder='confirm password' type='password' />
          <button type='submit'>register</button>
        </form>
        <p style='color:red;'>{message}</p>
      </body>
    </html>
    """


@router.get('/auth', response_class=HTMLResponse, summary='page with auth form')
def get_auth_page():
    return auth_page_html()


@router.post('/auth', response_model=TokenResponse, summary='authentication')
def login_json(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, payload.username, payload.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    token = create_access_token(user.username)
    response.set_cookie(settings.cookie_name, token, httponly=True, samesite='lax')
    return TokenResponse(access_token=token)


@router.post('/auth/form', include_in_schema=False)
def login_form(
    response: Response,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    try:
        user = authenticate_user(db, username, password)
    except InvalidCredentialsError as exc:
        return HTMLResponse(auth_page_html(str(exc)), status_code=401)

    token = create_access_token(user.username)
    redirect = RedirectResponse(url='/profile', status_code=303)
    redirect.set_cookie(settings.cookie_name, token, httponly=True, samesite='lax')
    return redirect


@router.get('/register', response_class=HTMLResponse, summary='page with register form')
def get_register_page():
    return register_page_html()


@router.post('/register', response_model=TokenResponse, summary='registration')
def register_json(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    try:
        user = register_user(db, payload.username, payload.password, payload.password_confirm)
    except UserAlreadyExistsError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    token = create_access_token(user.username)
    response.set_cookie(settings.cookie_name, token, httponly=True, samesite='lax')
    return TokenResponse(access_token=token)


@router.post('/register/form', include_in_schema=False)
def register_form(
    username: str = Form(...),
    password: str = Form(...),
    password_confirm: str = Form(...),
    db: Session = Depends(get_db),
):
    try:
        user = register_user(db, username, password, password_confirm)
    except UserAlreadyExistsError as exc:
        return HTMLResponse(register_page_html(str(exc)), status_code=400)

    token = create_access_token(user.username)
    redirect = RedirectResponse(url='/profile', status_code=303)
    redirect.set_cookie(settings.cookie_name, token, httponly=True, samesite='lax')
    return redirect


@router.post('/logout', summary='logout, redirects to /auth')
def logout():
    response = RedirectResponse(url='/auth', status_code=303)
    response.delete_cookie(settings.cookie_name)
    return response


@router.get('/me', include_in_schema=False)
def me(current_user=Depends(get_current_user)):
    return {'username': current_user.username}
