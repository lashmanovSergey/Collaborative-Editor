from pydantic import BaseModel, Field

class document_dto(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=64
    )

    content: str = Field(
        min_length=0,
        max_length=2048,
    )