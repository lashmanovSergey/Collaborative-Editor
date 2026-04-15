from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base, TimestampMixin


class Room(Base, TimestampMixin):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(ForeignKey("users.username", ondelete="CASCADE"), nullable=False)
    guid: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(128), nullable=False)
    current_content: Mapped[str] = mapped_column(Text, default="", nullable=False)
