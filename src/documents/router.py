from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.requests import Request
from src.documents.utils import get_html
from src.documents.service import document_connection_manager, create_document_in_db, get_documents_from_db
from src.auth.service import get_current_user, get_token_from_cookie
from src.rooms.service import find_room
from src.rooms.exceptions import RoomNotFoundException

router_for_documents = APIRouter(
    prefix="/rooms/{room_uuid}",
    tags=["documents"],
    dependencies=[Depends(get_current_user)]
)

router_for_websockets = APIRouter(
    prefix="/rooms/{room_uuid}",
    tags=["documents","websockets"],
)

@router_for_documents.get("/documents")
def get_documents(room_uuid: str, request: Request):
    user = get_current_user(get_token_from_cookie(request))
    find_room(room_uuid, user.username)

    documents = get_documents_from_db(room_uuid)
    return JSONResponse(
        status_code=200,
        content=documents
    )

@router_for_documents.post("/documents")
def create_documents(room_uuid: str, request: Request):
    document_uuid = create_document_in_db(room_uuid)
    return JSONResponse(
        status_code=200,
        content={
            "document_uuid": document_uuid
        }
    )

@router_for_documents.get("/documents/{document_uuid}")
def get_document_content(room_uuid: str, document_uuid: str, request: Request):
    return HTMLResponse(get_html(room_uuid, document_uuid))

@router_for_websockets.websocket("/documents/ws/{document_uuid}")
async def document_websockets(websocket: WebSocket, room_uuid: str, document_uuid: str):
    # Add websocket to Manager
    await document_connection_manager.connect(websocket, room_uuid, document_uuid)

    # Live editing
    try:
        while True:
            data = await websocket.receive_text()
            await document_connection_manager.update_and_broadcast(document_uuid, data)
    except WebSocketDisconnect:
        document_connection_manager.disconnect(websocket, room_uuid, document_uuid)