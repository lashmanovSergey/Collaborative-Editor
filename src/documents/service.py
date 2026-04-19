from sqlalchemy.orm import Session 
from src.database import engine
from src.documents.models import Document
from sqlalchemy import delete, select, update
from fastapi import WebSocket
import uuid

def get_documents_from_db(room_uuid: str) -> list:
    query = select(Document).where(Document.room_uuid == room_uuid)

    documents = { "documents": [] }

    with Session(engine) as session:
        for document in session.execute(query).scalars():
            documents["documents"].append(
                {
                    'uuid': document.document_uuid,
                    'name': document.name,
                }
            )

    return documents

def get_document_from_db(room_uuid: str, document_uuid: str) -> dict:
    query = select(Document).where(
        Document.room_uuid == room_uuid,
        Document.document_uuid == document_uuid,
    )

    with Session(engine) as session:
        document = session.execute(query).scalar()
        session.expunge(document)
        
        return {
            'uuid': document_uuid,
            'name': document.name,
            'content': document.content,
        }

def create_document_in_db(room_uuid: str, name: str) -> Document:
    document_uuid = str(uuid.uuid4())
    
    with Session(engine) as session:
        document = Document(
            room_uuid=room_uuid,
            document_uuid=document_uuid,
            content="",
            name=name,
        )
        session.add(document)
        session.commit()

        return {
            'uuid': document_uuid,
            'name': name,
        }

def update_document_name_in_db(room_uuid: str, document_uuid: str, name: str) -> None:
    query = update(Document).where(
        Document.room_uuid == room_uuid,
        Document.document_uuid == document_uuid,
    ).values(name=name)
    with Session(engine) as session:
        session.execute(query)
        session.commit()
        return {
            'uuid': document_uuid,
            'name': name
        }

def delete_document_from_db(room_uuid: str, document_uuid: str) -> None:
    query = delete(Document).where(
        Document.document_uuid == document_uuid,
        Document.room_uuid == room_uuid
    )
    with Session(engine) as session:
        session.execute(query)
        session.commit()

def get_document_content_from_db(room_uuid: str, document_uuid: str) -> str:
    query = select(Document).where(
        Document.room_uuid == room_uuid,
        Document.document_uuid == document_uuid,
    )
    with Session(engine) as session:
        document = session.execute(query).scalar()
        return document.content

def update_document_content_in_db(room_uuid: str, document_uuid: str, content: str) -> None:
    query = update(Document).where(
        Document.room_uuid == room_uuid,
        Document.document_uuid == document_uuid,
    ).values(content=content)
    with Session(engine) as session:
        session.execute(query)
        session.commit()

class DocumentConnectionManager:
    def __init__(self):
        # {"document_uuid": []}
        self.active_connections: dict[str, list[WebSocket]] = {}
        # {"document_uuid": ""}
        self.document_content: dict[str, str] = {} 

    async def connect(self, websocket: WebSocket, room_uuid: str, document_uuid: str) -> None:
        await websocket.accept()

        # Initialize room if needed
        if document_uuid not in self.active_connections.keys():
            self.active_connections[document_uuid] = []
            self.document_content[document_uuid] = get_document_content_from_db(room_uuid, document_uuid)

        self.active_connections[document_uuid].append(websocket)

        # Update document content for new client
        await websocket.send_text(self.document_content[document_uuid])
        
    
    def disconnect(self, websocket: WebSocket, room_uuid: str, document_uuid: str) -> None:
        self.active_connections[document_uuid].remove(websocket)

        if len(self.active_connections[document_uuid]) == 0:
            # Load last document updates to db
            update_document_content_in_db(room_uuid, document_uuid, self.document_content[document_uuid])

            # Clear memory
            del self.active_connections[document_uuid]
            del self.document_content[document_uuid]
    
    async def update_and_broadcast(self, document_uuid: str, message: str):
        self.document_content[document_uuid] = message
    
        for connection in self.active_connections[document_uuid]:
            await connection.send_text(message)     

document_connection_manager = DocumentConnectionManager()