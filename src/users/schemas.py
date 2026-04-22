from pydantic import BaseModel, Field, model_validator
from src.users.config import user_settings
from typing_extensions import Self
from src.exceptions import InvalidCredentialsException

class user_auth_dto(BaseModel):
    username: str = Field(
        min_length=user_settings.username_min_length,
        max_length=user_settings.username_max_length,
    )
    password: str = Field(
        min_length=user_settings.password_min_length,
        max_length=user_settings.username_max_length,
    )

class user_reg_dto(BaseModel):
    username: str = Field(
        min_length=user_settings.username_min_length,
        max_length=user_settings.username_max_length,
    )
    password: str = Field(
        min_length=user_settings.password_min_length,
        max_length=user_settings.username_max_length,
    )
    password_confirm: str = Field(
        min_length=user_settings.password_min_length,
        max_length=user_settings.username_max_length,
    )

    @model_validator(mode="after")
    def validate_passwords(self) -> Self:
        if self.password != self.password_confirm:
            raise InvalidCredentialsException
        return self