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
        start_date = today - timedelta(days=7)
        end_date = today - timedelta(days=1)
        print(start_date, end_date)
    elif filter_type == "last_month":
        start_date = today - timedelta(days=30)
        end_date = today
    elif filter_type == "last_year":
        start_date = today - timedelta(days=365)
        end_date = today
    else:
        raise ValueError(f"Invalid filter type: '{filter_type}'. Valid options are 'all', 'yesterday', 'last_week', 'last_month', 'last_year'.")

    return start_date, end_date



def get_date_range_booking(filter_type: str):
    """
    Utility to calculate date ranges based on filter type.

    Args:
        filter_type (str): The type of filter. Options include "all", "yesterday", "last_week", "last_month", "last_year".

    Returns:
        tuple: A tuple of (start_date, end_date) where dates are in ISO 8601 format (YYYY-MM-DD HH:MM:SS.ssssss) or None for "all".

    Raises:
        ValueError: If an invalid filter type is provided.
    """
    today = datetime.now()

    if filter_type == "all":
        start_date, end_date = None, None
    elif filter_type == "yesterday":
        start_date = (today - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif filter_type == "last_week":  # Last 7 days including today
        start_date = (today - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif filter_type == "last_month":  # Last 30 days including today
        start_date = (today - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif filter_type == "last_year":  # Last 365 days including today
        start_date = (today - timedelta(days=365)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
    else:
        raise ValueError(f"Invalid filter type: '{filter_type}'. Valid options are 'all', 'yesterday', 'last_week', 'last_month', 'last_year'.")

    return start_date, end_date

# def calculate_percentage_change(current, previous):
#     if previous == 0:
#         return "N/A" if current == 0 else "+100%"
#     return f"{((current - previous) / previous) * 100:.1f}%"
def calculate_percentage_change(current, previous):
    if previous == 0:
        return "0%" if current == 0 else "100%"
    
    percent_change = ((current - previous) / previous) * 100
    
    if percent_change > 100:
        return "100%"
    elif percent_change < -100:
        return "0%"
    
    return f"{percent_change:.1f}%"