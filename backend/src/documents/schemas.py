from datetime import datetime
from pydantic import BaseModel, Field


class CreateVersionRequest(BaseModel):
    content: str = Field(default="")
    save_type: str = Field(default="manual")


class UpdateVersionRequest(BaseModel):
    content: str


class VersionResponse(BaseModel):
    guid: str
    version: int
    content: str
    save_type: str
    created_at: datetime
