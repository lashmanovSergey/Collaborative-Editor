from pydantic import BaseModel, Field

class create_room_dto(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=64,
    )

class update_room_dto(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=64,
    )