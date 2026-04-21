from sqlalchemy import String, ForeignKey, Column
from src.models import Base

class Room(Base):
    __tablename__ = "rooms"

    uuid = Column(
        String(64),
        nullable=False,
        primary_key=True,
        unique=True
    )

    name = Column(
        String(64),
        nullable=False
    )

    username = Column(
        ForeignKey("users.username")
    )

    def to_dict(self):
        return {
                'uuid': self.uuid,
                'name': self.name,
                'username': self.username,
            }