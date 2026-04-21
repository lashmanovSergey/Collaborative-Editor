from fastapi.exceptions import HTTPException

InvalidUUIDException = HTTPException(
    status_code=400,
    detail="Invalid uuid format"
)

AccessDeniedException = HTTPException(
    status_code=403,
    detail="Access denied"
)