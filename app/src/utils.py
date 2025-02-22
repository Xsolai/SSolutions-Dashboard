from app.database.models.models import (FileProcessingHistory, User, 
                                        Permission, QueueStatistics, 
                                        WorkflowReportGuruKF, EmailData,
                                        OrderJoin, SoftBookingKF, AllQueueStatisticsData, GuruTask)
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
    
    # print("Allowed: ", allowed_start, allowed_end)
    # print("current: ", start_date, end_date)

    # Ensure the requested date range is within the allowed range
    if start_date < allowed_start or end_date > allowed_end:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Permission Denied",
                "message": "Requested date range is not within the allowed range.",
                "allowed_date_range": {
                    "start_date": allowed_start.isoformat(),
                    "end_date": allowed_end.isoformat(),
                }
            }
        )
    
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
    
    # Calculate the union of the selected date ranges
    selected_ranges = [date_ranges[filter_type] for filter_type in filters if filter_type in date_ranges]
    # print(selected_ranges)
    if not selected_ranges:
        raise ValueError("No valid date filters provided.")
    
    combined_start = min(range_start for range_start, _ in selected_ranges)
    combined_end = max(range_end for _, range_end in selected_ranges)
    
    return combined_start, combined_end

def get_date_rng_subkpis(
    db, 
    current_user,
    start_date: Optional[datetime],
    end_date: Optional[datetime]):
    # Validate date range
    start_date, end_date = validate_user_and_date_permissions_subkpis(db, current_user, start_date, end_date)
    # print("current: ", start_date, end_date)
    
    date_diff = (end_date - start_date).days
    
    # print("date difference: ", date_diff)
    
    prev_start_date = start_date - timedelta(days=date_diff+1)
    prev_end_date = end_date - timedelta(days=date_diff+1)
    
    # print("prev: ", prev_start_date, prev_end_date)
    return start_date, end_date, prev_start_date, prev_end_date
    
    
def validate_user_and_date_permissions_subkpis(
    db, 
    current_user, 
    start_date: Optional[datetime], 
    end_date: Optional[datetime]
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
    
    # print("Allowed: ", allowed_start, allowed_end)
    # print("current: ", start_date, end_date)

    # Ensure the requested date range is within the allowed range
    if start_date < allowed_start or end_date > allowed_end:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Permission Denied",
                "message": "Requested date range is not within the allowed range.",
                "allowed_date_range": {
                    "start_date": allowed_start.isoformat(),
                    "end_date": allowed_end.isoformat(),
                }
            }
        )
    
    return start_date, end_date


# def domains_checker(db, user_id, filter_5vf, filter_bild):
    
#     # Retrieve the user permissions from the database
#     user_permission = db.query(Permission).filter(Permission.user_id == user_id).first()
#     user_domains = [
#         domain.strip().lower()
#         for domain in user_permission.domains.split(",")
#         if domain.strip()
#     ]
#     print("Domains: ", user_domains)
#      # Determine accessible companies based on permissions
#     accessible_companies = []
#     if "urlaubsguru" in user_domains:
#         accessible_companies.append("guru")
#     if "5vorflug" in user_domains:
#         accessible_companies.append("5vorflug")
#     if "bild" in user_domains:
#         accessible_companies.append("bild")
#     if "adac" in user_domains:
#         accessible_companies.append("ADAC")
#     if "galeria" in user_domains:
#         accessible_companies.append("Galeria")
#     if "urlaub" in user_domains:
#         accessible_companies.append("Urlaub")
    
#     print("accessible_companies: ", accessible_companies)
    
#     filters = []
#     summe_filters = []
#     if "5vorflug" in accessible_companies:
#         # print("containss")
#         filters.append(QueueStatistics.queue_name.like(f"%{filter_5vf}%"))
#         summe_filters.append(AllQueueStatisticsData.customer.like(f"%{filter_5vf}%"))
#         # total_call_reasons = 0
#     if "bild" in accessible_companies:
#         # print("containss bild")
#         filters.append(QueueStatistics.queue_name.like(f"%{filter_bild}%"))
#         summe_filters.append(AllQueueStatisticsData.customer.like(f"%{filter_bild}%"))
#     if "Galeria" in accessible_companies:
#         # print("containss bild")
#         filters.append(QueueStatistics.queue_name.like(f"%Galeria%"))
#         summe_filters.append(AllQueueStatisticsData.customer.like(f"%Galeria%"))
#     if "ADAC" in accessible_companies:
#         # print("containss bild")
#         filters.append(QueueStatistics.queue_name.like(f"%ADAC%"))
#         summe_filters.append(AllQueueStatisticsData.customer.like(f"%ADAC%"))
#     if "Urlaub" in accessible_companies:
#         # print("containss bild")
#         filters.append(QueueStatistics.queue_name.like(f"%Urlaub"))
#         summe_filters.append(AllQueueStatisticsData.customer.like(f"%Urlaub"))
#         # total_call_reasons = 0
#     if "guru" in accessible_companies:
#         print("contains guru")
#         # filters.append(QueueStatistics.queue_name.notlike(f"%{filter_5vf}%").notlike(f"%{filter_bild}%"))
#         # total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
#         return accessible_companies, [], []
        
#     # print("Filters: ", filters)
#     return accessible_companies, filters, summe_filters

# def domains_checker_email(db, user_id, filter_5vf, filter_bild):
    
#     # Retrieve the user permissions from the database
#     user_permission = db.query(Permission).filter(Permission.user_id == user_id).first()
#     user_domains = [
#         domain.strip().lower()
#         for domain in user_permission.domains.split(",")
#         if domain.strip()
#     ]
#     print("Domains: ", user_domains)
#      # Determine accessible companies based on permissions
#     accessible_companies = []
#     if "urlaubsguru" in user_domains:
#         print(f"contains urlaubsguru")
#         accessible_companies.append("guru")
#     if "5vorflug" in user_domains:
#         print(f"contains 5vorflug")
#         accessible_companies.append("5vorflug")
#     if "bild" in user_domains:
#         print(f"contains bild")
#         accessible_companies.append("bild")
#     if "adac" in user_domains:
#         accessible_companies.append("ADAC")
#     if "galeria" in user_domains:
#         accessible_companies.append("Galeria")
#     if "urlaub" in user_domains:
#         accessible_companies.append("Urlaub")
    
#     print("accessible_companies: ", accessible_companies)
    
#     filters = []
#     email_filters = []
#     if "5vorflug" in accessible_companies:
#         print("containss")
#         filters.append(WorkflowReportGuruKF.customer.like(f"%{filter_5vf}%"))
#         email_filters.append(EmailData.customer.like(f"%{filter_5vf}%"))
#         # total_call_reasons = 0
#     if "bild" in accessible_companies:
#         print("containss bild")
#         filters.append(WorkflowReportGuruKF.customer.like(f"%{filter_bild}%"))
#         email_filters.append(EmailData.customer.like(f"%{filter_bild}%"))
#     if "ADAC" in accessible_companies:
#         # print("containss bild")
#         filters.append(WorkflowReportGuruKF.customer.like(f"%ADAC%"))
#         email_filters.append(EmailData.customer.like(f"%ADAC%"))
#     if "Galeria" in accessible_companies:
#         # print("containss bild")
#         filters.append(WorkflowReportGuruKF.customer.like(f"%Galeria%"))
#         email_filters.append(EmailData.customer.like(f"%Galeria%"))
#     if "Urlaub" in accessible_companies:
#         print("containss bild")
#         filters.append(WorkflowReportGuruKF.customer.like(f"%Urlaub%"))
#         email_filters.append(EmailData.customer.like(f"%Urlaub%"))
#         # total_call_reasons = 0
#     if "guru" in accessible_companies:
#         print("contains guru")
#         # filters.append(WorkflowReportGuruKF.customer.notlike(f"%{filter_5vf}%").notlike(f"%{filter_bild}%"))
#         # email_filters.append(EmailData.customer.notlike(f"%{filter_5vf}%").notlike(f"%{filter_bild}%"))
#         return accessible_companies, [],[]
#         # total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
        
#     # print("Filters: ", filters)
#     return accessible_companies, filters, email_filters

def domains_checker(db, user_id, filter_5vf, filter_bild, target_company=None):
    # Retrieve the user permissions from the database
    user_permission = db.query(Permission).filter(Permission.user_id == user_id).first()
    user_domains = [
        domain.strip().lower()
        for domain in user_permission.domains.split(",")
        if domain.strip()
    ]
    print("User domains: ", user_domains)
    
    # Determine accessible companies based on permissions
    accessible_companies = []
    if "urlaubsguru" in user_domains:
        accessible_companies.append("guru")
    if "5vorflug" in user_domains:
        accessible_companies.append("5vorflug")
    if "bild" in user_domains:
        accessible_companies.append("bild")
    if "adac" in user_domains:
        accessible_companies.append("ADAC")
    if "galeria" in user_domains:
        accessible_companies.append("Galeria")
    if "urlaub" in user_domains:
        accessible_companies.append("Urlaub")
    
    print("Accessible companies: ", accessible_companies)
    
    # If a specific target company is provided, return only its filters.
    if target_company:
        if target_company.lower() not in [c.lower() for c in accessible_companies]:
            # The user is not allowed to access this company.
            return accessible_companies, [], []
        
        # Build filters only for the target company.
        if target_company.lower() == "5vorflug":
            filters = [QueueStatistics.queue_name.like(f"%{filter_5vf}%")]
            summe_filters = [AllQueueStatisticsData.customer.like(f"%5vFlug%")]
        elif target_company.lower() == "bild":
            filters = [QueueStatistics.queue_name.like(f"%{filter_bild}%")]
            summe_filters = [AllQueueStatisticsData.customer.like(f"%Bild%")]
        elif target_company.lower() == "galeria":
            filters = [QueueStatistics.queue_name.like(f"%Galeria%")]
            summe_filters = [AllQueueStatisticsData.customer.like(f"%Galeria%")]
        elif target_company.lower() == "adac":
            filters = [QueueStatistics.queue_name.like("%ADAC%")]
            summe_filters = [AllQueueStatisticsData.customer.like("%ADAC%")]
        elif target_company.lower() in ["guru", "urlaubsguru"]:
            filters = [QueueStatistics.queue_name.like(f"%guru%")]
            summe_filters = [AllQueueStatisticsData.customer.like(f"%Guru%")]
        elif target_company.lower() == "urlaub":
            filters = [QueueStatistics.queue_name.like("%Urlaub%")]
            summe_filters = [AllQueueStatisticsData.customer.like("%Urlaub%")]
        else:
            filters = []
            summe_filters = []
        return accessible_companies, filters, summe_filters

    # Otherwise, if no target_company is provided, return filters for all accessible companies.
    filters = []
    summe_filters = []
    if "5vorflug" in accessible_companies:
        filters.append(QueueStatistics.queue_name.like(f"%{filter_5vf}%"))
        summe_filters.append(AllQueueStatisticsData.customer.like(f"%{filter_5vf}%"))
    if "bild" in accessible_companies:
        filters.append(QueueStatistics.queue_name.like(f"%{filter_bild}%"))
        summe_filters.append(AllQueueStatisticsData.customer.like(f"%{filter_bild}%"))
    if "Galeria" in accessible_companies:
        filters.append(QueueStatistics.queue_name.like(f"%Galeria%"))
        summe_filters.append(AllQueueStatisticsData.customer.like(f"%Galeria%"))
    if "ADAC" in accessible_companies:
        filters.append(QueueStatistics.queue_name.like("%ADAC%"))
        summe_filters.append(AllQueueStatisticsData.customer.like("%ADAC%"))
    if "Urlaub" in accessible_companies:
        filters.append(QueueStatistics.queue_name.like("%Urlaub%"))
        summe_filters.append(AllQueueStatisticsData.customer.like("%Urlaub%"))
    if "guru" in accessible_companies:
        # For guru, assume no filters should be applied.
        return accessible_companies, [], [] # Return empty filters for guru.
    
    return accessible_companies, filters, summe_filters


def domains_checker_email(db, user_id, filter_5vf, filter_bild, target_company=None):
    # Retrieve the user permissions from the database
    user_permission = db.query(Permission).filter(Permission.user_id == user_id).first()
    user_domains = [
        domain.strip().lower()
        for domain in user_permission.domains.split(",")
        if domain.strip()
    ]
    print("User domains: ", user_domains)
    
    accessible_companies = []
    if "urlaubsguru" in user_domains:
        accessible_companies.append("guru")
    if "5vorflug" in user_domains:
        accessible_companies.append("5vorflug")
    if "bild" in user_domains:
        accessible_companies.append("bild")
    if "adac" in user_domains:
        accessible_companies.append("ADAC")
    if "galeria" in user_domains:
        accessible_companies.append("Galeria")
    if "urlaub" in user_domains:
        accessible_companies.append("Urlaub")
    
    print("Accessible companies: ", accessible_companies)
    
    if target_company:
        if target_company.lower() not in [c.lower() for c in accessible_companies]:
            return accessible_companies, [], []
        
        if target_company.lower() == "5vorflug":
            filters = [WorkflowReportGuruKF.customer.like(f"%{filter_5vf}%")]
            email_filters = [EmailData.customer.like(f"%{filter_5vf}%")]
        elif target_company.lower() == "bild":
            filters = [WorkflowReportGuruKF.customer.like(f"%{filter_bild}%")]
            email_filters = [EmailData.customer.like(f"%{filter_bild}%")]
        elif target_company.lower() == "galeria":
            filters = [WorkflowReportGuruKF.customer.like("%Galeria%")]
            email_filters = [EmailData.customer.like("%Galeria%")]
        elif target_company.lower() == "adac":
            filters = [WorkflowReportGuruKF.customer.like("%ADAC%")]
            email_filters = [EmailData.customer.like("%ADAC%")]
        elif target_company.lower() in ["guru", "urlaubsguru"]:
            filters = [WorkflowReportGuruKF.customer.like(f"%Guru%")]
            email_filters = [EmailData.customer.like(f"%Guru%")]
        elif target_company.lower() == "urlaub":
            filters = [WorkflowReportGuruKF.customer.like("%Urlaub%")]
            email_filters = [EmailData.customer.like("%Urlaub%")]
        else:
            filters = []
            email_filters = []
        return accessible_companies, filters, email_filters

    filters = []
    email_filters = []
    if "5vorflug" in accessible_companies:
        filters.append(WorkflowReportGuruKF.customer.like(f"%{filter_5vf}%"))
        email_filters.append(EmailData.customer.like(f"%{filter_5vf}%"))
    if "bild" in accessible_companies:
        filters.append(WorkflowReportGuruKF.customer.like(f"%{filter_bild}%"))
        email_filters.append(EmailData.customer.like(f"%{filter_bild}%"))
    if "ADAC" in accessible_companies:
        filters.append(WorkflowReportGuruKF.customer.like("%ADAC%"))
        email_filters.append(EmailData.customer.like("%ADAC%"))
    if "Galeria" in accessible_companies:
        filters.append(WorkflowReportGuruKF.customer.like("%Galeria%"))
        email_filters.append(EmailData.customer.like("%Galeria%"))
    if "Urlaub" in accessible_companies:
        filters.append(WorkflowReportGuruKF.customer.like("%Urlaub%"))
        email_filters.append(EmailData.customer.like("%Urlaub%"))
    if "guru" in accessible_companies:
        return accessible_companies, [], []
    
    return accessible_companies, filters, email_filters


# def domains_checker_task(db, user_id, filter_5vf, filter_bild):
    
#     # Retrieve the user permissions from the database
#     user_permission = db.query(Permission).filter(Permission.user_id == user_id).first()
#     user_domains = [
#         domain.strip().lower()
#         for domain in user_permission.domains.split(",")
#         if domain.strip()
#     ]
#     print("Domains: ", user_domains)
#      # Determine accessible companies based on permissions
#     accessible_companies = []
#     if "urlaubsguru" in user_domains:
#         accessible_companies.append("guru")
#     if "5vorflug" in user_domains:
#         accessible_companies.append("5vorflug")
#     if "bild" in user_domains:
#         accessible_companies.append("bild")
#     if "adac" in user_domains:
#         accessible_companies.append("ADAC")
#     if "galeria" in user_domains:
#         accessible_companies.append("Galeria")
#     if "urlaub" in user_domains:
#         accessible_companies.append("Urlaub") 
    
#     print("accessible_companies: ", accessible_companies)
    
#     filters = []
#     if "5vorflug" in accessible_companies:
#         print("containss")
#         filters.append(GuruTask.customer.like(f"%{filter_5vf}%"))
#         # total_call_reasons = 0 
#     if "bild" in accessible_companies:
#         print("containss bild")
#         filters.append(GuruTask.customer.like(f"%{filter_bild}%"))
#     if "Galeria" in accessible_companies:
#         print("containss galeria")
#         filters.append(GuruTask.customer.like(f"%Galeria%"))
#     if "ADAC" in accessible_companies:
#         print("containss ADAC")
#         filters.append(GuruTask.customer.like(f"%ADAC%"))
#     if "Urlaub" in accessible_companies:
#         print("containss urlaub")
#         filters.append(GuruTask.customer.like(f"%Urlaub%"))
#         # total_call_reasons = 0
#     if "guru" in accessible_companies:
#         print("contains guru")
#         # filters.append(OrderJoin.customer.notlike(f"%{filter_5vf}%").notlike(f"%{filter_bild}%"))
#         # filters.append(OrderJoin.customer.notlike(f"%{filter_5vf}%").notlike(f"%{filter_bild}%"))
#         return accessible_companies,[]
        
#     # print("Filters: ", filters)
#     return accessible_companies, filters


# def domains_checker_booking(db, user_id, filter_5vf, filter_bild):
    
#     # Retrieve the user permissions from the database
#     user_permission = db.query(Permission).filter(Permission.user_id == user_id).first()
#     user_domains = [
#         domain.strip().lower()
#         for domain in user_permission.domains.split(",")
#         if domain.strip()
#     ]
#     print("Domains: ", user_domains)
#      # Determine accessible companies based on permissions
#     accessible_companies = []
#     if "urlaubsguru" in user_domains:
#         accessible_companies.append("guru")
#     if "5vorflug" in user_domains:
#         accessible_companies.append("5vorflug")
#     if "bild" in user_domains:
#         accessible_companies.append("bild")
#     if "adac" in user_domains:
#         accessible_companies.append("ADAC")
#     if "galeria" in user_domains:
#         accessible_companies.append("Galeria")
#     if "urlaub" in user_domains:
#         accessible_companies.append("Urlaub")
    
#     print("accessible_companies: ", accessible_companies)
    
#     filters = []
#     order_filters = []
#     if "5vorflug" in accessible_companies:
#         print("containss")
#         filters.append(SoftBookingKF.customer.like(f"%{filter_5vf}%"))
#         order_filters.append(GuruTask.customer.like(f"%5VFL%"))
#         # total_call_reasons = 0
#     if "bild" in accessible_companies:
#         print("containss bild")
#         filters.append(SoftBookingKF.customer.like(f"%{filter_bild}%"))
#         order_filters.append(GuruTask.customer.like(f"%{filter_bild}%"))
#         # total_call_reasons = 0
#     if "ADAC" in accessible_companies:
#         print("containss bild")
#         filters.append(SoftBookingKF.customer.like(f"%ADAC%"))
#         order_filters.append(GuruTask.customer.like(f"%ADAC%"))
#     if "Galeria" in accessible_companies:
#         print("containss bild")
#         filters.append(SoftBookingKF.customer.like(f"%Galeria%"))
#         order_filters.append(GuruTask.customer.like(f"%Galeria%"))
#     if "Urlaub" in accessible_companies:
#         print("containss bild")
#         filters.append(SoftBookingKF.customer.like(f"%Urlaub%"))
#         order_filters.append(GuruTask.customer.like(f"%Urlaub%"))
#     if "guru" in accessible_companies:
#         print("contains guru")
#         # filters.append(SoftBookingKF.customer.notlike(f"%{filter_5vf}%").notlike(f"%{filter_bild}%"))
#         return accessible_companies, [], []
#         # total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
        
#     # print("Filters: ", filters)
#     return accessible_companies, filters, order_filters

def domains_checker_task(db, user_id, filter_5vf, filter_bild, target_company=None):
    # Retrieve the user permissions from the database
    user_permission = db.query(Permission).filter(Permission.user_id == user_id).first()
    user_domains = [
        domain.strip().lower()
        for domain in user_permission.domains.split(",")
        if domain.strip()
    ]
    print("Domains: ", user_domains)
    
    # Determine accessible companies based on permissions
    accessible_companies = []
    if "urlaubsguru" in user_domains:
        accessible_companies.append("guru")
    if "5vorflug" in user_domains:
        accessible_companies.append("5vorflug")
    if "bild" in user_domains:
        accessible_companies.append("bild")
    if "adac" in user_domains:
        accessible_companies.append("ADAC")
    if "galeria" in user_domains:
        accessible_companies.append("Galeria")
    if "urlaub" in user_domains:
        accessible_companies.append("Urlaub")
    
    print("accessible_companies: ", accessible_companies)
    
    # If a target company is provided, return filters only for that company.
    if target_company:
        if target_company.lower() not in [c.lower() for c in accessible_companies]:
            # The user is not allowed to access the target company.
            return accessible_companies, []
        
        if target_company.lower() == "5vorflug":
            filters = [GuruTask.customer.like(f"%{filter_5vf}%")]
        elif target_company.lower() == "bild":
            filters = [GuruTask.customer.like(f"%{filter_bild}%")]
        elif target_company.lower() == "galeria":
            filters = [GuruTask.customer.like("%Galeria%")]
        elif target_company.lower() == "adac":
            filters = [GuruTask.customer.like("%ADAC%")]
        elif target_company.lower() == "urlaub":
            filters = [GuruTask.customer.like("%Urlaub%")]
        elif target_company.lower() in ["guru", "urlaubsguru"]:
            # For guru, assume no extra filter is applied.
            filters = []
        else:
            filters = []
        return accessible_companies, filters

    # Otherwise, build filters for all accessible companies.
    filters = []
    if "5vorflug" in accessible_companies:
        print("containss 5vorflug")
        filters.append(GuruTask.customer.like(f"%{filter_5vf}%"))
    if "bild" in accessible_companies:
        print("containss bild")
        filters.append(GuruTask.customer.like(f"%{filter_bild}%"))
    if "Galeria" in accessible_companies:
        print("containss galeria")
        filters.append(GuruTask.customer.like("%Galeria%"))
    if "ADAC" in accessible_companies:
        print("containss ADAC")
        filters.append(GuruTask.customer.like("%ADAC%"))
    if "Urlaub" in accessible_companies:
        print("containss urlaub")
        filters.append(GuruTask.customer.like("%Urlaub%"))
    if "guru" in accessible_companies:
        print("contains guru")
        return accessible_companies, []
        
    return accessible_companies, filters


def domains_checker_booking(db, user_id, filter_5vf, filter_bild, target_company=None):
    # Retrieve the user permissions from the database
    user_permission = db.query(Permission).filter(Permission.user_id == user_id).first()
    user_domains = [
        domain.strip().lower()
        for domain in user_permission.domains.split(",")
        if domain.strip()
    ]
    print("Domains: ", user_domains)
    
    # Determine accessible companies based on permissions
    accessible_companies = []
    if "urlaubsguru" in user_domains:
        accessible_companies.append("guru")
    if "5vorflug" in user_domains:
        accessible_companies.append("5vorflug")
    if "bild" in user_domains:
        accessible_companies.append("bild")
    if "adac" in user_domains:
        accessible_companies.append("ADAC")
    if "galeria" in user_domains:
        accessible_companies.append("Galeria")
    if "urlaub" in user_domains:
        accessible_companies.append("Urlaub")
    
    print("accessible_companies: ", accessible_companies)
    
    # If a target company is provided, build filters only for that company.
    if target_company:
        if target_company.lower() not in [c.lower() for c in accessible_companies]:
            return accessible_companies, [], []
        
        if target_company.lower() == "5vorflug":
            filters = [SoftBookingKF.customer.like(f"%{filter_5vf}%")]
            order_filters = [GuruTask.customer.like("%5VFL%")]
        elif target_company.lower() == "bild":
            filters = [SoftBookingKF.customer.like(f"%{filter_bild}%")]
            order_filters = [GuruTask.customer.like(f"%{filter_bild}%")]
        elif target_company.lower() == "adac":
            filters = [SoftBookingKF.customer.like("%ADAC%")]
            order_filters = [GuruTask.customer.like("%ADAC%")]
        elif target_company.lower() == "galeria":
            filters = [SoftBookingKF.customer.like(f"%Galeria%")]
            order_filters = [GuruTask.customer.like(f"%Galeria%")]
        elif target_company.lower() == "urlaub":
            filters = [SoftBookingKF.customer.like("%Urlaub%")]
            order_filters = [GuruTask.customer.like("%Urlaub%")]
        elif target_company.lower() in ["guru", "urlaubsguru"]:
            filters = [SoftBookingKF.customer.like(f"%Guru%")]
            order_filters = [GuruTask.customer.like(f"%Guru%")]
        else:
            filters = []
            order_filters = []
        return accessible_companies, filters, order_filters

    # Otherwise, build filters for all accessible companies.
    filters = []
    order_filters = []
    if "5vorflug" in accessible_companies:
        print("containss 5vorflug")
        filters.append(SoftBookingKF.customer.like(f"%{filter_5vf}%"))
        order_filters.append(GuruTask.customer.like("%5VFL%"))
    if "bild" in accessible_companies:
        print("containss bild")
        filters.append(SoftBookingKF.customer.like(f"%{filter_bild}%"))
        order_filters.append(GuruTask.customer.like(f"%{filter_bild}%"))
    if "ADAC" in accessible_companies:
        print("containss ADAC")
        filters.append(SoftBookingKF.customer.like("%ADAC%"))
        order_filters.append(GuruTask.customer.like("%ADAC%"))
    if "Galeria" in accessible_companies:
        print("containss Galeria")
        filters.append(SoftBookingKF.customer.like("%Galeria%"))
        order_filters.append(GuruTask.customer.like("%Galeria%"))
    if "Urlaub" in accessible_companies:
        print("containss Urlaub")
        filters.append(SoftBookingKF.customer.like("%Urlaub%"))
        order_filters.append(GuruTask.customer.like("%Urlaub%"))
    if "guru" in accessible_companies:
        print("contains guru")
        return accessible_companies, [], []
        
    return accessible_companies, filters, order_filters

def time_formatter(hours, minutes, seconds):
    if int(hours)>0:
        return f"{str(hours).zfill(2)}:{str(minutes).zfill(2)}:{str(seconds).zfill(2)}"
    if int(hours)<=0 and int(minutes)>0:
        return f"{str(minutes).zfill(2)}:{str(seconds).zfill(2)}"
    else:
        return f"00:00:{str(seconds).zfill(2)}"
    
# def time_format(time):
#     """Convert time in various formats to minutes."""
#     try:
#         if isinstance(time, tuple):
#             pass

#         if '.' in time[0]:
#             print("float ", time[0])
#             return float(time[0])  # Assuming this represents minutes directly

#         # Handle time formats
#         if ':' in time[0]:
#             if len(time[0].split(':')) == 2:
#                 # Format: 'mm:ss'
#                 dt = datetime.strptime(time[0], "%M:%S")
#                 # total_minutes = dt.minute + dt.second
#                 return (dt.minute, dt.second)
#             elif len(time[0].split(':')) == 3:
#                 # Format: 'hh:mm:ss'
#                 # dt = datetime.strptime(time[0], "%H:%M:%S")
#                 hours, minutes, seconds = time[0].split(":")[0], time[0].split(":")[1], time[0].split(":")[2]
#                 # print(hours, minutes, seconds)
#                 # total_minutes = int(hours) * 60 + int(minutes)
#                 return (int(hours), int(minutes), int(seconds))

#         return 0  # Return 0 if format is unrecognized
#     except Exception as e:
#         print(f"Error converting time '{time}': {e}")
#         return 0
def time_format(time):
    """Convert time to (hours, minutes, seconds)."""
    try:
        if isinstance(time, tuple):
            return time 

        if '.' in time[0]:
            print("float ", time[0])
            minutes = int(float(time[0]))
            seconds = int((float(time[0]) - minutes) * 60)
            return 0, minutes, seconds

        if ':' in time[0]:
            parts = time[0].split(':')
            if len(parts) == 2:  # Format: 'mm:ss'
                dt = datetime.strptime(time[0], "%M:%S")
                return 0, dt.minute, dt.second  
            elif len(parts) == 3:  # Format: 'hh:mm:ss'
                hours, minutes, seconds = map(int, parts)
                return hours, minutes, seconds

        return 0, 0, 0 
    except Exception as e:
        print(f"Error converting time '{time}': {e}")
        return 0, 0, 0 
    


# def validate_user_and_date_permissions_export(db, current_user):
#     """
#     Validate the user's permissions and return the appropriate date range.
    
#     Args:
#         db: Database session
#         current_user: The current user object

#     Returns:
#         Tuple[datetime, datetime]: Validated start_date and end_date.
#     """
#     # Retrieve the user from the database
#     user = db.query(User).filter(User.email == current_user.get("email")).first()
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="User not found."
#         )
    
#     # Retrieve the user permissions from the database
#     user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
#     if not user_permissions:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="No permissions found for the user."
#         )

#     # Parse the comma-separated date filters
#     filters = [
#         filter_type.strip()
#         for filter_type in user_permissions.date_filter.split(",")
#         if filter_type.strip()
#     ]

#     # Define today's date and start of the current month
#     today = datetime.now().date()
#     current_month_start = today.replace(day=1)
#     current_month_end = today  # End of the current month defaults to today

#     # Determine the date range based on permissions
#     if "all" in filters or "last_year" in filters or "last_month" in filters:
#         # If permissions contain "all", "last_year", or "last_month", return current month's range
#         return current_month_start, current_month_end 
#     elif "yesterday" in filters and "last_week" in filters and "last_month" in filters and "last_year" in filters:
#         # If all permissions are present, return current month's range
#         return current_month_start, current_month_end
#     elif "last_week" in filters and len(filters) == 1:
#         # If the only permission is "last_week", return the last week's range
#         start_date = today - timedelta(days=today.weekday() + 7)
#         end_date = today - timedelta(days=today.weekday() + 1)
#         return start_date, end_date
#     elif "yesterday" in filters and len(filters) == 1:
#         # If the only permission is "yesterday", return yesterday's date
#         yesterday = today - timedelta(days=1)
#         return yesterday, yesterday
#     else:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Invalid permissions or no matching date range found."
#         )
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

