from app.database.models.models import FileProcessingHistory
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta

def add_file_record(db: Session, filename: str, status: str):
    """Add a record of a processed file to the database."""
    try:
        record = FileProcessingHistory(
            filename=filename,
            status=status
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        print(f"File record added: {filename} with status {status}")
    except Exception as e:
        db.rollback()
        print(f"Error adding file record: {e}")
        

def get_date_range(filter_type: str):
    """
    Utility to calculate date ranges based on filter type.

    Args:
        filter_type (str): The type of filter. Options include "all", "yesterday", "last_week", "last_month", "last_year".

    Returns:
        tuple: A tuple of (start_date, end_date) where dates are in YYYY-MM-DD format or None for "all".

    Raises:
        ValueError: If an invalid filter type is provided.
    """
    today = datetime.now().date()

    if filter_type == "all":
        start_date, end_date = None, None
    elif filter_type == "yesterday":
        start_date = end_date = today - timedelta(days=1)
    elif filter_type == "last_week":
        start_date = today - timedelta(days=today.weekday() + 7)
        end_date = today - timedelta(days=today.weekday() + 1)
    elif filter_type == "last_month":
        first_day_of_current_month = today.replace(day=1)
        end_date = first_day_of_current_month - timedelta(days=1)
        start_date = end_date.replace(day=1)
    elif filter_type == "last_year":
        start_date = today.replace(year=today.year - 1, month=1, day=1)
        end_date = today.replace(year=today.year - 1, month=12, day=31)
    else:
        raise ValueError(f"Invalid filter type: '{filter_type}'. Valid options are 'all', 'yesterday', 'last_week', 'last_month', 'last_year'.")

    return start_date, end_date


def calculate_percentage_change(current, previous):
    if previous == 0:
        return "N/A" if current == 0 else "+100%"
    return f"{((current - previous) / previous) * 100:.1f}%"