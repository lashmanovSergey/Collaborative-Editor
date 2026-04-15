from pydantic import BaseModel


class ProfileResponse(BaseModel):
    username: str
