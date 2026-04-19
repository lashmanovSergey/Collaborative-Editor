from sqlalchemy import create_engine, String, Column
from src.config import settings

engine = create_engine(settings.DATABASE_URL)

