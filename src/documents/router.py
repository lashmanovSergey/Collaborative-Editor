from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.responses import JSONResponse
from src.documents.models import Document
from fastapi.requests import Request
from typing import Annotated
from src.auth.service import get_current_user
from src.documents.schemas import document_dto
from src.documents.service import document_connection_manager

import src.documents.database as db

router_for_documents = APIRouter(
    prefix="/rooms/{room_uuid}",
    tags=["documents"],
    dependencies=[Depends(get_current_user)]
)

router_for_websockets = APIRouter(
    prefix="/rooms/{room_uuid}",
    tags=["documents","websockets"]
)

@router_for_documents.get("/documents/{document_uuid}")
def route_get_document(room_uuid: str, document_uuid: str, request: Request) -> JSONResponse:
    """ GET certain document from certain user room """
    document = db.get_document(room_uuid, document_uuid)
    return JSONResponse(
        status_code=200,
        content=document.to_dict()
    )

@router_for_documents.get("/documents")
def route_get_documents(room_uuid: str, request: Request) -> JSONResponse:
    """ GET all user documents in certain room """
    documents = db.get_documents(room_uuid)

    return JSONResponse(
        status_code=200,
        content={
            'documents': [document.to_dict() for document in documents]
        }
    )

@router_for_documents.post("/documents")
def route_create_documents(room_uuid: str, dto: document_dto, request: Request) -> JSONResponse:
    """ CREATE document in certain user room """
    document = db.create_document(room_uuid, dto.name, dto.content)
    return JSONResponse(
        status_code=200,
        content=document.to_dict()
    )

@router_for_documents.delete("/documents/{document_uuid}")
def route_delete_documents(room_uuid: str, document_uuid: str, request: Request) -> JSONResponse:
    """ DELETE document from certain user room """
    document = db.delete_document(room_uuid, document_uuid)
    return JSONResponse(
        status_code=200,
        content=document.to_dict()
    )

@router_for_documents.patch("/documents/{document_uuid}")
def route_update_documents(room_uuid: str, document_uuid: str, dto: document_dto, request: Request) -> JSONResponse:
    """ UPDATE document in certain user room """
    new_document = Document(
        room_uuid=room_uuid,
        document_uuid=document_uuid,
        name=dto.name,
        content=dto.content,
    )

    document = db.update_document(room_uuid, document_uuid, new_document)

    return JSONResponse(
        status_code=200,
        content=document.to_dict()
    )

@router_for_websockets.websocket("/documents/ws/{document_uuid}")
async def route_document_websockets(websocket: WebSocket, room_uuid: str, document_uuid: str):
    """ Manage all WebSocket connections """
    await document_connection_manager.connect(websocket, room_uuid, document_uuid)

    # Live editing until WebSocketDisconnect
    try:
        while True:
            data = await websocket.receive_text()
            await document_connection_manager.update_and_broadcast(document_uuid, data)
    except WebSocketDisconnect:
        document_connection_manager.disconnect(websocket, room_uuid, document_uuid)