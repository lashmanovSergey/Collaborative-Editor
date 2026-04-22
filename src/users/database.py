from sqlalchemy import select
from src.database import SessionLocal
from src.users.models import User
import bcrypt

def get_user(username: str) -> User:
    query = select(User).where(User.username == username)

    with SessionLocal() as session:
        user = session.execute(query).scalar()
    
    return user

def create_user(username: str, password: str) -> User:
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    user = User(
        username=username,
        password_hash=password_hash.decode("utf-8")
    )

    with SessionLocal() as session:
        session.add(user)
        session.commit()

    return get_user(username)
