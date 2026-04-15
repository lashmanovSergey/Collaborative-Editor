from datetime import datetime
from pydantic import BaseModel, Field


class CreateRoomRequest(BaseModel):
    title: str = Field(min_length=1, max_length=128)


class RoomResponse(BaseModel):
    guid: str
    title: str
    current_content: str
    created_at: datetime


class RoomLinkResponse(BaseModel):
    guid: str
    invite_url: str
