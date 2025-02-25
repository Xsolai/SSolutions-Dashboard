from datetime import datetime, timedelta, date
from typing import Optional
from fastapi import HTTPException, status
from app.database.models.models import User, Permission

def validate_user_and_date_permissions_booking(
    db, 
    current_user, 
    start_date: Optional[datetime], 
    end_date: Optional[datetime],
    include_all: bool
):
    """
    Validate the user's permissions and ensure the requested date range is within the allowed range.
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
    
    # Retrieve the user's permissions
    user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    if not user_permissions or not user_permissions.date_filter:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permissions found for the user."
        )

    # Parse and calculate the allowed date range
    filters = [
        filter_type.strip() for filter_type in user_permissions.date_filter.split(",") 
        if filter_type.strip()
    ]
    allowed_start, allowed_end = get_combined_date_range_booking(filters)

    # Ensure dates are `datetime` objects with time components
    if isinstance(start_date, date) and not isinstance(start_date, datetime):
        start_date = datetime.combine(start_date, datetime.min.time())
    if isinstance(end_date, date) and not isinstance(end_date, datetime):
        end_date = datetime.combine(end_date, datetime.max.time())

    # start_date = start_date or allowed_start
    # end_date = end_date or allowed_end
    # Validate the requested date range using get_date_range function
    start_date, end_date = get_date_range_booking(start_date, end_date)
    # print("Final: ", start_date, end_date)

    if allowed_start and start_date < allowed_start:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Start date {start_date.isoformat()} is before the allowed range starting {allowed_start.isoformat()}."
        )
    if allowed_end and end_date > allowed_end:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"End date {end_date.isoformat()} is after the allowed range ending {allowed_end.isoformat()}."
        )
    
    return start_date, end_date


def get_date_subkpis_booking(filter_type: str):
    """
    Utility to calculate date ranges based on filter type with time adjustments.

    Args:
        filter_type (str): The type of filter. Options include "all", "yesterday", "last_week", "last_month", "last_year".

    Returns:
        tuple: A tuple of (start_date, end_date) where dates are in YYYY-MM-DD format or None for "all".
    """
    today = datetime.now()

    if filter_type == "all":
        start_date, end_date = None, None
    elif filter_type == "yesterday":
        start_date = (today - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = (today - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
    elif filter_type == "last_week":
        start_date = (today - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = (today - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
    elif filter_type == "last_month":
        start_date = (today - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = (today - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
    elif filter_type == "last_year":
        start_date = (today - timedelta(days=365)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = (today - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
    else:
        raise ValueError(f"Invalid filter type: '{filter_type}'. Valid options are 'all', 'yesterday', 'last_week', 'last_month', 'last_year'.")

    return start_date, end_date

def calculate_percentage_change_booking(current, previous):
    """
    Calculate the percentage change between current and previous values.
    
    Args:
        current: The current value.
        previous: The previous value.

    Returns:
        str: The percentage change as a string (e.g., "100%").
    """
    if previous == 0:
        return "0%" if current == 0 else "100%"

    percent_change = ((current - previous) / previous) * 100

    if percent_change > 100:
        return "100%"
    elif percent_change < -100:
        return "0%"

    return f"{percent_change:.1f}%"

def get_date_range_booking(
    start_date: Optional[datetime],
    end_date: Optional[datetime],
    include_all: bool = False
):
    """
    Determine and validate the date range based on provided start_date and end_date with time adjustments.
    Defaults to 'yesterday' if neither date is provided.
    
    Args:
        start_date (Optional[datetime]): The start date of the range.
        end_date (Optional[datetime]): The end date of the range.

    Returns:
        Tuple[datetime, datetime]: Validated start_date and end_date.

    Raises:
        HTTPException: If start_date is after end_date.
    """
    today = datetime.now()
    if include_all:
        return None, None
    
    # Ensure start_date and end_date are full datetime objects
    if isinstance(start_date, date) and not isinstance(start_date, datetime):
        start_date = datetime.combine(start_date, datetime.min.time())
    if isinstance(end_date, date) and not isinstance(end_date, datetime):
        end_date = datetime.combine(end_date, datetime.max.time())
        
    # print("date range: ", start_date, end_date)

    if not start_date and not end_date:
        # Default to "yesterday"
        end_date = (today - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
        start_date = (today - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif not end_date:
        # Single date scenario
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif not start_date:
        # Single date scenario with only end_date
        start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Validate date range
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Invalid date range",
                "message": "The start_date cannot be later than the end_date."
            }
        )
    # print("date range: ", start_date, end_date)
    return start_date, end_date

def get_combined_date_range_booking(filters: list):
    """
    Calculate the combined date range based on the provided filters.

    Args:
        filters (list): A list of date filters like "yesterday", "last_week", etc.

    Returns:
        tuple: A tuple of (start_date, end_date) where dates are `datetime` or None for "all".
    """
    today = datetime.now()
    date_ranges = {
        "yesterday": (
            (today - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0),
            (today - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
        ),
        "last_week": (
            (today - timedelta(days=today.weekday() + 7)).replace(hour=0, minute=0, second=0, microsecond=0),
            (today - timedelta(days=today.weekday() + 1)).replace(hour=23, minute=59, second=59, microsecond=999999)
        ),
        "last_month": (
            (today - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0),
            (today - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
        ),
        "last_year": (
            (today - timedelta(days=365)).replace(hour=0, minute=0, second=0, microsecond=0),
            (today - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
        ),
    }

    if not filters:
        raise ValueError("No valid date filters provided.")

    if "all" in filters:
        return None, None

    valid_filters = [filter_type for filter_type in filters if filter_type in date_ranges]
    if not valid_filters:
        raise ValueError("No valid date filters provided.")

    selected_ranges = [date_ranges[filter_type] for filter_type in valid_filters]
    combined_start = min(range_start for range_start, _ in selected_ranges)
    combined_end = max(range_end for _, range_end in selected_ranges)

    return combined_start, combined_end

def get_date_rng_subkpis_booking(
    db, 
    current_user,
    start_date: Optional[datetime],
    end_date: Optional[datetime]):
    # Validate date range
    start_date, end_date = validate_user_and_date_permissions_subkpis_booking(db, current_user, start_date, end_date)
    print("current: ", start_date, end_date)
    
    date_diff = (end_date - start_date).days
    
    print("date difference: ", date_diff)
    
    prev_start_date = (start_date - timedelta(days=date_diff+1)).replace(hour=0, minute=0, second=0, microsecond=0)
    prev_end_date = (end_date - timedelta(days=date_diff+1)).replace(hour=23, minute=59, second=59, microsecond=999999)
    
    print("prev: ", prev_start_date, prev_end_date)
    return start_date, end_date, prev_start_date, prev_end_date
    
    
def validate_user_and_date_permissions_subkpis_booking(
    db, 
    current_user, 
    start_date: Optional[datetime], 
    end_date: Optional[datetime]
):
    """
    Validate the user's permissions and ensure the requested date range is within the allowed range.
    """    
    # Retrieve the user from the database
    user = db.query(User).filter(User.email == current_user.get("email")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found." 
        )
    
    # Retrieve the user's permissions
    user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    if not user_permissions or not user_permissions.date_filter:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permissions found for the user."
        )

    # Parse and calculate the allowed date range
    filters = [
        filter_type.strip() for filter_type in user_permissions.date_filter.split(",") 
        if filter_type.strip()
    ]
    allowed_start, allowed_end = get_combined_date_range_booking(filters)

    # Ensure dates are `datetime` objects with time components
    if isinstance(start_date, date) and not isinstance(start_date, datetime):
        start_date = datetime.combine(start_date, datetime.min.time())
    if isinstance(end_date, date) and not isinstance(end_date, datetime):
        end_date = datetime.combine(end_date, datetime.max.time())

    # start_date = start_date or allowed_start
    # end_date = end_date or allowed_end
    # Validate the requested date range using get_date_range function
    start_date, end_date = get_date_range_booking(start_date, end_date)
    # print("Final: ", start_date, end_date)

    if allowed_start and start_date < allowed_start:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Start date {start_date.isoformat()} is before the allowed range starting {allowed_start.isoformat()}."
        )
    if allowed_end and end_date > allowed_end:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"End date {end_date.isoformat()} is after the allowed range ending {allowed_end.isoformat()}."
        )
    
    return start_date, end_date

def validate_user_and_date_permissions_export(db, current_user):
    """
    Validate the user's permissions and return the appropriate date range.

    Args:
        db: Database session
        current_user: The current user object

    Returns:
        Tuple[datetime, datetime]: Validated start_date and end_date.
    """
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

    # Define today's date and calculate possible ranges
    today = datetime.now().date()
    current_month_start = today.replace(day=1)
    current_month_end = (datetime.now() - timedelta(days=1)).date()
    yesterday = today - timedelta(days=1)
    last_week_start = today - timedelta(days=today.weekday() + 7)
    last_week_end = today - timedelta(days=today.weekday() + 1)
    last_month_end = current_month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    # Prioritize larger date ranges first
    if "all" in filters:
        return current_month_start, current_month_end  
    elif "last_year" in filters:
        return current_month_start, current_month_end  
    elif "last_month" in filters:
        return current_month_start, current_month_end  
    elif "last_week" in filters:
        return last_week_start, last_week_end
    elif "yesterday" in filters:
        return yesterday, yesterday
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid permissions or no matching date range found."
        )
        
def validate_user_and_date_permissions_booking_export(db, current_user):
    """
    Validate the user's permissions and return the appropriate date range.

    Args:
        db: Database session
        current_user: The current user object

    Returns:
        Tuple[datetime, datetime]: Validated start_date and end_date.
    """
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

    # Define today's date and calculate possible ranges
    today = datetime.now().date()
    current_month_start = today.replace(day=1)
    current_month_end = (datetime.now() - timedelta(days=1)).date()

    # Set start and end times for the date range
    current_month_start = datetime.combine(current_month_start, datetime.min.time())
    current_month_end = datetime.combine(current_month_end, datetime.max.time())

    last_week_start = today - timedelta(days=today.weekday() + 7)
    last_week_end = today - timedelta(days=today.weekday() + 1)

    # Set start and end times for last week
    last_week_start = datetime.combine(last_week_start, datetime.min.time())
    last_week_end = datetime.combine(last_week_end, datetime.max.time())

    yesterday = today - timedelta(days=1)

    # Set start and end times for yesterday
    yesterday_start = datetime.combine(yesterday, datetime.min.time())
    yesterday_end = datetime.combine(yesterday, datetime.max.time())

    # Prioritize larger date ranges first
    if "all" in filters:
        return current_month_start, current_month_end  
    elif "last_year" in filters:
        return current_month_start, current_month_end  
    elif "last_month" in filters:
        return current_month_start, current_month_end  
    elif "last_week" in filters:
        return last_week_start, last_week_end
    elif "yesterday" in filters:
        return yesterday_start, yesterday_end
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid permissions or no matching date range found."
        )