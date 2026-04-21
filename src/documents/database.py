from sqlalchemy import select, update, delete
from src.database import SessionLocal
from src.documents.models import Document

def get_document(room_uuid: str, document_uuid: str) -> Document:
    """ GET document (document_uuid) in room (room_uuid) """
    query = select(Document).where(
        Document.room_uuid == room_uuid,
        Document.document_uuid == document_uuid,
    )

    with SessionLocal() as session:
        document = session.execute(query).scalar()
        
    return document

def get_documents(room_uuid: str) -> list[Document]:
    """ GET all documents in room (room_uuid) """
    query = select(Document).where(Document.room_uuid == room_uuid)

    documents = []

    with SessionLocal() as session:
        for document in session.execute(query).scalars():
            documents.append(document)

    return documents

def create_document(room_uuid: str, name: str) -> Document:
    """ CREATE document in room (room_uuid) """
    document_uuid = str(uuid.uuid4())
    
    with SessionLocal() as session:
        document = Document(
            room_uuid=room_uuid,
            document_uuid=document_uuid,
            content="",
            name=name,
        )
        session.add(document)
        session.commit()

    return document

def update_document(room_uuid: str, document_uuid: str, document: Document) -> Document:
    """ UPDATE document (document_uuid) in room (room_uuid) by new document """
    query = update(Document).where(
        Document.room_uuid == room_uuid,
        Document.document_uuid == document_uuid,
    ).values(
        name=document.name,
        content=document.content
    )

    with SessionLocal() as session:
        session.execute(query)
        session.commit()

    return get_document(room_uuid, document_uuid)

def delete_document(room_uuid: str, document_uuid: str) -> Document:
    """ DELETE document (document_uuid) in room (room_uuid) """
    document = get_document(room_uuid, document_uuid)

    query = delete(Document).where(
        Document.document_uuid == document_uuid,
        Document.room_uuid == room_uuid
    )

    with SessionLocal() as session:
        session.execute(query)
        session.commit()
    
    return document