from pydantic import BaseModel, Field

class room_dto(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=64,
    )