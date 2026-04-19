from fastapi.exceptions import HTTPException

# todo: make exceptions for the following cases
# 1) FailedToCreate
# 2) FailedToDelete
# 3) FailtedToList???

RoomNotFoundException = HTTPException(
    status_code=400,
    detail="Room not found"
)