from fastapi import WebSocket
import src.documents.database as db

class DocumentConnectionManager:
    """ Class to manage all WebSocket connections """
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.document_content: dict[str, str] = {} 

    async def connect(self, websocket: WebSocket, room_uuid: str, document_uuid: str) -> None:
        await websocket.accept()

        # Initialize variables in case of first connection
        if document_uuid not in self.active_connections.keys():
            self.active_connections[document_uuid] = []
            document = db.get_document(room_uuid, document_uuid)
            self.document_content[document_uuid] = document.content

        # Add connection
        self.active_connections[document_uuid].append(websocket)

        # Update document content for new client
        await websocket.send_text(self.document_content[document_uuid])
        
    
    def disconnect(self, websocket: WebSocket, room_uuid: str, document_uuid: str) -> None:
        self.active_connections[document_uuid].remove(websocket)

        # Handle saving document in case of last connection leave
        if len(self.active_connections[document_uuid]) == 0:
            document = db.get_document(room_uuid, document_uuid)
            document.content = self.document_content[document_uuid]
            db.update_document(room_uuid, document_uuid, document)

            # Clear memory
            del self.active_connections[document_uuid]
            del self.document_content[document_uuid]
    
    async def update_and_broadcast(self, document_uuid: str, message: str):
        # Handle any document content change
        self.document_content[document_uuid] = message
    
        # Broadcast all changes
        for connection in self.active_connections[document_uuid]:
            await connection.send_text(message)     

document_connection_manager = DocumentConnectionManager()