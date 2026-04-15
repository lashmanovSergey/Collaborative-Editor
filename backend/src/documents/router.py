from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user
from src.database import get_db
from src.documents.exceptions import VersionNotFoundError
from src.documents.schemas import CreateVersionRequest, UpdateVersionRequest
from src.documents.service import create_snapshot, delete_version, get_history, get_version, restore_version, trim_history, update_version
from src.redis_manager import redis_manager
from src.rooms.exceptions import RoomForbiddenError, RoomNotFoundError
from src.rooms.service import require_room_owner

router = APIRouter(tags=['documents'])


def require_owned_room(db: Session, guid: str, username: str) -> None:
    try:
        require_room_owner(db, guid, username)
    except RoomNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RoomForbiddenError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.get('/rooms/{guid}/versions', summary='get room history')
def list_versions(guid: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    require_owned_room(db, guid, current_user.username)
    versions = get_history(db, guid)
    return [
        {
            'guid': item.guid,
            'version': item.version,
            'content': item.content,
            'save_type': item.save_type,
            'created_at': item.created_at,
        }
        for item in versions
    ]


@router.post('/rooms/{guid}/versions', include_in_schema=False)
async def create_version_legacy_endpoint(
    guid: str,
    payload: CreateVersionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owned_room(db, guid, current_user.username)
    version = create_snapshot(db, guid, payload.content, payload.save_type)
    trim_history(db, guid)
    await redis_manager.set_content(guid, payload.content)
    return {
        'guid': version.guid,
        'version': version.version,
        'content': version.content,
        'save_type': version.save_type,
        'created_at': version.created_at,
    }


@router.get('/rooms/{guid}/versions/{v}', summary='get room version')
def get_version_endpoint(guid: str, v: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    require_owned_room(db, guid, current_user.username)
    try:
        item = get_version(db, guid, v)
    except VersionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return {
        'guid': item.guid,
        'version': item.version,
        'content': item.content,
        'save_type': item.save_type,
        'created_at': item.created_at,
    }


@router.patch('/rooms/{guid}/versions/{v}', summary='update room version')
def update_version_endpoint(
    guid: str,
    v: int,
    payload: UpdateVersionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owned_room(db, guid, current_user.username)
    try:
        item = update_version(db, guid, v, payload.content)
    except VersionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {
        'guid': item.guid,
        'version': item.version,
        'content': item.content,
        'save_type': item.save_type,
        'created_at': item.created_at,
    }


@router.delete('/rooms/{guid}/versions/{v}', summary='delete room version')
def delete_version_endpoint(guid: str, v: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    require_owned_room(db, guid, current_user.username)
    try:
        delete_version(db, guid, v)
    except VersionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {'status': 'deleted'}


@router.post('/rooms/{guid}/versions/{v}', summary='create room version')
async def create_version_endpoint(
    guid: str,
    v: int,
    payload: CreateVersionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owned_room(db, guid, current_user.username)

    # v is treated as the version the editor started from.
    # the server still creates the next snapshot number automatically.
    version = create_snapshot(db, guid, payload.content, payload.save_type)
    trim_history(db, guid)
    await redis_manager.set_content(guid, payload.content)
    return {
        'base_version': v,
        'guid': version.guid,
        'version': version.version,
        'content': version.content,
        'save_type': version.save_type,
        'created_at': version.created_at,
    }


@router.post('/rooms/{guid}/versions/{v}/restore', include_in_schema=False)
async def restore_version_endpoint(guid: str, v: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    require_owned_room(db, guid, current_user.username)
    try:
        content = restore_version(db, guid, v)
    except VersionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    await redis_manager.set_content(guid, content)
    return {'status': 'restored', 'content': content}
