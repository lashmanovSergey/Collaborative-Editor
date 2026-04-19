from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from src.models import Base

class Document(Base):
    __tablename__ = "documents"

    room_uuid = Column(
        String(64),
        ForeignKey("rooms.uuid")
    )

    name = Column(
        String(64),
        nullable=False
    )

    document_uuid = Column(
        String(64),
        primary_key=True
    )

    content = Column(
        String(2048)
    )

    def __repr__(self) -> str:
        return f"Document(room_uuid={self.uuid!r}, document_uuid={self.document_uuid!r})"