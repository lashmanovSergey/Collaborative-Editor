from sqlalchemy import Column, String, ForeignKey
from src.models import Base

class Document(Base):
    __tablename__ = "documents"

    room_uuid = Column(
        String(64),
        ForeignKey("rooms.uuid")
    )

    document_uuid = Column(
        String(64),
        primary_key=True
    )

    name = Column(
        String(64),
        nullable=False
    )

    content = Column(
        String(2048)
    )

    def to_dict(self):
        return {
                'room_uuid': self.room_uuid,
                'name': self.name,
                'document_uuid': self.document_uuid,
                'content': self.content,
            }