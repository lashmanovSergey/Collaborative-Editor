from fastapi import HTTPException, status

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials"
)

inactive_user = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Inactive user"
)

InvalidCredentialsException = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid username or password"
)