from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse

from src.auth.dependencies import get_current_user

router = APIRouter(prefix='', tags=['users'])


@router.get('/profile', summary='main page')
def get_profile(current_user=Depends(get_current_user)):
    return {
        'username': current_user.username,
        'message': 'you are in profile',
        'actions': [
            'create room',
            'view room history',
            'delete room',
        ],
    }


@router.get('/profile/page', response_class=HTMLResponse, include_in_schema=False)
def get_profile_page(current_user=Depends(get_current_user)):
    return f"""
    <html>
      <body>
        <h2>profile</h2>
        <p>hello, {current_user.username}</p>
        <p>use /docs for api testing</p>
      </body>
    </html>
    """
