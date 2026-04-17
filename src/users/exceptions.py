from fastapi.exceptions import HTTPException

UserNotFoundException = HTTPException(
    status_code=400,
    detail="Username not found"
)

UsernameAlreadyExistsException = HTTPException(
    status_code=400,
    detail="Username already exist"
)