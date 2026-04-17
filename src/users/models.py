from sqlalchemy import String, Column
from src.models import Base

class User(Base):
    __tablename__ = "users"

    username = Column(
        String(32),
        nullable=False, 
        primary_key=True,
        unique=True
    )

    password_hash = Column(
        String(256),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"User(username={self.username!r})"