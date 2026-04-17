from sqlalchemy import select
from sqlalchemy.orm import Session
from src.database import engine
from src.users.models import User
from src.users.exceptions import UserNotFoundException
from src.auth.exceptions import InvalidCredentialsException
import bcrypt

def get_user_from_db(username: str) -> User:
    query = select(User).where(User.username == username)

    with Session(engine) as session:
        user = session.execute(query).scalar()
        
        if user == None:
            raise UserNotFoundException
    
    return user

def create_user_in_db(username: str, password: str) -> None:
    with Session(engine) as session:
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        user = User(
            username=username,
            password_hash=password_hash.decode("utf-8")
        )
        session.add(user)
        session.commit()

def check_user_password(password_hash: str, password: str) -> None:
    if bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')) == False:
        raise InvalidCredentialsException