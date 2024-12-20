from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db.db_connection import get_db
from app.database.models.models import FileProcessingHistory, User
from app.database.scehmas import schemas
from app.database.auth import oauth2

router = APIRouter()

@router.get("/history")
async def get_history(db: Session = Depends(get_db), current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Retrieve the file processing history."""
    current_user = db.query(User).filter(User.email == current_user.get("email")).first()
    # Check if the current user is an admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access permissions.")
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
