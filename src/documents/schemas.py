from pydantic import BaseModel, Field

class document_update_dto(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=64
    )

class create_document_dto(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=64
    )