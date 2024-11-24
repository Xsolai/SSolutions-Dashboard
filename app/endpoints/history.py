from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db.db_connection import get_db
from app.database.models.models import FileProcessingHistory

router = APIRouter()

@router.get("/history")
async def get_history(db: Session = Depends(get_db)):
    """Retrieve the file processing history."""
    history = db.query(FileProcessingHistory).order_by(FileProcessingHistory.processed_at.desc()).all()

    # Format the history for the frontend
    result = [
        {
            "id": record.id,
            "filename": record.filename,
            "status": record.status,
            "processed_at": record.processed_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for record in history
    ]

    return result
