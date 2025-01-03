from app.database.models.models import FileProcessingHistory, User, Permission
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status

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
        
def validate_user_and_date_permissions(
    db, 
    current_user, 
    start_date: Optional[datetime], 
    end_date: Optional[datetime],
    include_all: bool
):
    """
    Validate the user's permissions and ensure the requested date range is within the allowed range.
    
    Args:
        db: Database session
        current_user: The current user object
        start_date (Optional[datetime]): The requested start date.
        end_date (Optional[datetime]): The requested end date.

    Returns:
        Tuple[datetime, datetime]: Validated start_date and end_date.
    """
    if include_all:
        return None, None
    
    # Retrieve the user from the database
    user = db.query(User).filter(User.email == current_user.get("email")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    # Retrieve the user permissions from the database
    user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    if not user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permissions found for the user."
        )

    # Parse the comma-separated date filters
    filters = [
        filter_type.strip() 
        for filter_type in user_permissions.date_filter.split(",") 
        if filter_type.strip()
    ]
    
    # Calculate the allowed date range based on the user's permissions
    allowed_start, allowed_end = get_combined_date_range(filters)

    # Validate the requested date range using get_date_range function
    start_date, end_date = get_date_range(start_date, end_date)

    # Ensure the requested date range is within the allowed range
    # if start_date < allowed_start or end_date > allowed_end:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail={
    #             "error": "Permission Denied",
    #             "message": "Requested date range is not within the allowed range.",
    #             "allowed_date_range": {
    #                 "start_date": allowed_start.isoformat(),
    #                 "end_date": allowed_end.isoformat(),
    #             }
    #         }
    #     )
    
    return start_date, end_date
        

def get_date_subkpis(filter_type: str):
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


def get_date_range(
    start_date: Optional[datetime],
    end_date: Optional[datetime],
    include_all: bool = False
):
    """
    Determine and validate the date range based on provided start_date and end_date.
    Defaults to 'yesterday' if neither date is provided.
    
    Args:
        start_date (Optional[datetime]): The start date of the range.
        end_date (Optional[datetime]): The end date of the range.

    Returns:
        Tuple[datetime, datetime]: Validated start_date and end_date.

    Raises:
        HTTPException: If start_date is after end_date.
    """
    today = datetime.now().date()
    if include_all:
        return None, None
    
    elif not start_date and not end_date:
        # Default to "yesterday"
        end_date = today - timedelta(days=1)
        start_date = end_date
    elif not end_date:
        # Single date scenario
        end_date = start_date
    elif not start_date:
        # Single date scenario with only end_date
        start_date = end_date

    # Validate date range
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Invalid date range",
                "message": "The start_date cannot be later than the end_date."
            }
        )

    return start_date, end_date 


def get_combined_date_range(filters):
    today = datetime.now().date()
    date_ranges = {
        "yesterday": (today - timedelta(days=1), today - timedelta(days=1)),
        "last_week": (
            today - timedelta(days=today.weekday() + 7),  
            today - timedelta(days=today.weekday() + 1),  
        ),
        "last_month": (
            today - timedelta(days=today.weekday() + 30),  
            today - timedelta(days=today.weekday() + 1),  
        ),
        "last_year": (
            today - timedelta(days=today.weekday() + 365), 
            today - timedelta(days=today.weekday() + 1), 
        ),
    }
    if not filters:
        raise ValueError("No valid date filters provided.")
    
    if "all" in filters:
        return None, None
    # Calculate the union of the selected date ranges
    selected_ranges = [date_ranges[filter_type] for filter_type in filters if filter_type in date_ranges]
    if not selected_ranges:
        raise ValueError("No valid date filters provided.")
    
    combined_start = min(range_start for range_start, _ in selected_ranges)
    combined_end = max(range_end for _, range_end in selected_ranges)
    
    return combined_start, combined_end
