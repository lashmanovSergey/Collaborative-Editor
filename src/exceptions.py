from fastapi.exceptions import HTTPException

InvalidUUIDException = HTTPException(
    status_code=400,
    detail="Invalid uuid format"
)