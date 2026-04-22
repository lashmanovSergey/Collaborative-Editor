from fastapi import HTTPException, status

InvalidUUIDException = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid uuid format"
)

InvalidCredentialsException = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid username or password"
)