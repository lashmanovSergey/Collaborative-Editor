from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from src.config import settings
from src.documents.exceptions import VersionNotFoundError
from src.documents.models import DocumentVersion
from src.rooms.models import Room


def next_version_number(db: Session, guid: str) -> int:
    latest = db.scalar(select(func.max(DocumentVersion.version)).where(DocumentVersion.guid == guid))
    return 1 if latest is None else latest + 1


def create_snapshot(db: Session, guid: str, content: str, save_type: str = 'manual') -> DocumentVersion:
    room = db.scalar(select(Room).where(Room.guid == guid))
    if room is None:
        raise VersionNotFoundError('room not found')

    room.current_content = content
    version = DocumentVersion(
        guid=guid,
        version=next_version_number(db, guid),
        content=content,
        save_type=save_type,
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def get_history(db: Session, guid: str) -> list[DocumentVersion]:
    return list(
        db.scalars(
            select(DocumentVersion)
            .where(DocumentVersion.guid == guid)
            .order_by(DocumentVersion.version.desc())
            .limit(settings.max_history_items)
        ).all()
    )


def trim_history(db: Session, guid: str):
    versions = list(
        db.scalars(
            select(DocumentVersion)
            .where(DocumentVersion.guid == guid)
            .order_by(DocumentVersion.version.desc())
        ).all()
    )
    extra = versions[settings.max_history_items:]
    for item in extra:
        db.delete(item)
    db.commit()


def get_version(db: Session, guid: str, version_number: int) -> DocumentVersion:
    version = db.scalar(
        select(DocumentVersion).where(
            DocumentVersion.guid == guid,
            DocumentVersion.version == version_number,
        )
    )
    if version is None:
        raise VersionNotFoundError('version not found')
    return version


def update_version(db: Session, guid: str, version_number: int, content: str) -> DocumentVersion:
    version = get_version(db, guid, version_number)
    version.content = content
    db.commit()
    db.refresh(version)
    return version


def delete_version(db: Session, guid: str, version_number: int):
    version = get_version(db, guid, version_number)
    db.delete(version)
    db.commit()


def restore_version(db: Session, guid: str, version_number: int) -> str:
    version = get_version(db, guid, version_number)
    room = db.scalar(select(Room).where(Room.guid == guid))
    if room is None:
        raise VersionNotFoundError('room not found')
    room.current_content = version.content
    db.commit()
    create_snapshot(db, guid, version.content, 'restore')
    trim_history(db, guid)
    return version.content
