from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Create SQLite engine and session
DATABASE_URL = "sqlite:///./guru_call_data.db"
# DATABASE_URL = "sqlite:///./example.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False},pool_size=50, max_overflow=0)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Create the tables
Base.metadata.create_all(bind=engine)


# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
