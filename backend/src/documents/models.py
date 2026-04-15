from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base, TimestampMixin


class DocumentVersion(Base, TimestampMixin):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_guid_version", "guid", "version", unique=True),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    guid: Mapped[str] = mapped_column(ForeignKey("rooms.guid", ondelete="CASCADE"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    save_type: Mapped[str] = mapped_column(String(16), default="manual", nullable=False)
