from sqlalchemy.ext.declarative import declarative_base

# Initial class for all models
Base = declarative_base()

import src.documents.models
import src.users.models
import src.rooms.models

