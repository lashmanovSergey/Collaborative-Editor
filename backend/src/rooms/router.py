from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user
from src.config import settings
from src.database import SessionLocal, get_db
from src.documents.service import create_snapshot, restore_version, trim_history
from src.redis_manager import redis_manager
from src.rooms.exceptions import RoomForbiddenError, RoomNotFoundError
from src.rooms.schemas import CreateRoomRequest
from src.rooms.service import create_room, delete_room, get_room_by_guid, get_user_rooms
from src.ws_manager import ws_manager
from src.auto_save import auto_save_manager
from src.simple_security import decode_access_token

router = APIRouter(tags=['rooms'])


def cookie_token_from_ws(websocket: WebSocket) -> str | None:
    cookie_header = websocket.headers.get('cookie', '')
    for chunk in cookie_header.split(';'):
        chunk = chunk.strip()
        if chunk.startswith(f'{settings.cookie_name}='):
            return chunk.split('=', 1)[1]
    return None


def build_room_links(request: Request, guid: str) -> tuple[str, str]:
    scheme = request.url.scheme
    host = request.headers.get('host', '127.0.0.1:8000')
    ws_scheme = 'wss' if scheme == 'https' else 'ws'

    invite_url = f'{scheme}://{host}/rooms/{guid}'
    ws_url = f'{ws_scheme}://{host}/ws/{guid}'
    return invite_url, ws_url


@router.get('/rooms', summary='list all created room')
def list_rooms(
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rooms = get_user_rooms(db, current_user.username)

    scheme = request.url.scheme
    host = request.headers.get('host', '127.0.0.1:8000')

    return [
        {
            'guid': room.guid,
            'title': room.title,
            'current_content': room.current_content,
            'created_at': room.created_at,
            'invite_url': f'{scheme}://{host}/rooms/{room.guid}',
        }
        for room in rooms
    ]


@router.post('/rooms', summary='create room')
async def create_room_endpoint(
    payload: CreateRoomRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = create_room(db, current_user.username, payload.title)
    auto_save_manager.ensure_started(room.guid)

    invite_url, ws_url = build_room_links(request, room.guid)

    return {
        'guid': room.guid,
        'title': room.title,
        'current_content': room.current_content,
        'created_at': room.created_at,
        'invite_url': invite_url,
        'ws_url': ws_url,
    }


@router.delete('/rooms/{guid}', summary='delete room')
def delete_room_endpoint(guid: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        delete_room(db, guid, current_user.username)
    except RoomNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RoomForbiddenError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    return {'status': 'deleted'}


@router.get('/ws/{guid}', summary='websockets')
def websocket_info(guid: str, request: Request):
    _, ws_url = build_room_links(request, guid)

    return {
        'message': 'connect to this websocket url from your client',
        'guid': guid,
        'ws_url': ws_url,
        'example_messages': [
            {'type': 'edit', 'content': 'hello'},
            {'type': 'save'},
            {'type': 'restore_version', 'version': 1},
        ],
    }


@router.websocket('/ws/{guid}')
async def room_websocket(websocket: WebSocket, guid: str):
    token = websocket.query_params.get('token') or cookie_token_from_ws(websocket)
    if token is None:
        await websocket.close(code=4401)
        return

    try:
        decode_access_token(token)
    except Exception:
        await websocket.close(code=4401)
        return

    db = SessionLocal()
    room = get_room_by_guid(db, guid)
    if room is None:
        db.close()
        await websocket.close(code=4404)
        return

    await ws_manager.connect(guid, websocket)
    try:
        content = await redis_manager.get_content(guid)
        if content is None:
            content = room.current_content or ''
            await redis_manager.set_content(guid, content)

        await websocket.send_json({'type': 'init', 'guid': guid, 'content': content})

        while True:
            data = await websocket.receive_json()
            message_type = data.get('type')

            if message_type == 'edit':
                new_content = str(data.get('content', ''))[:settings.max_document_length]
                await redis_manager.set_content(guid, new_content)

                db2 = SessionLocal()
                room2 = get_room_by_guid(db2, guid)
                if room2 is not None:
                    room2.current_content = new_content
                    db2.commit()
                db2.close()

                await ws_manager.broadcast(guid, {'type': 'edit', 'guid': guid, 'content': new_content})

            elif message_type == 'save':
                current_content = await redis_manager.get_content(guid) or ''
                db2 = SessionLocal()
                create_snapshot(db2, guid, current_content, 'manual')
                trim_history(db2, guid)
                db2.close()
                await ws_manager.broadcast(guid, {'type': 'saved', 'guid': guid})

            elif message_type == 'restore_version':
                version = int(data.get('version'))
                db2 = SessionLocal()
                content = restore_version(db2, guid, version)
                db2.close()
                await redis_manager.set_content(guid, content)
                await ws_manager.broadcast(guid, {'type': 'edit', 'guid': guid, 'content': content})

    except WebSocketDisconnect:
        pass
    finally:
        db.close()
        await ws_manager.disconnect(guid, websocket)