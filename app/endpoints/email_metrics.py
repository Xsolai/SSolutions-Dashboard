from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.models.models import WorkflowReportGuru, User, Permission
from app.database.db.db_connection import  get_db
from datetime import datetime, timedelta
from sqlalchemy import func
from collections import defaultdict
from app.database.scehmas import schemas
from app.database.auth import oauth2
from app.src.utils import get_date_range, calculate_percentage_change


router = APIRouter(
    tags=["Email APIS"]
)

def time_to_seconds(time):
    """Convert time in various formats to seconds."""
    try:
        if isinstance(time, tuple):
            pass
        
        if '.' in time[0]:
            print("float ", time[0])
            return (float(time[0])*60)
        print("Time str", time[0], time)

        # Handle time formats
        if ':' in time[0]:
            if len(time[0].split(':')) == 2:
                # Format: 'mm:ss'
                dt = datetime.strptime(time[0], "%M:%S")
                # print("minutes and seconds: ", timedelta(minutes=dt.minute, seconds=dt.second).total_seconds())
                return timedelta(minutes=dt.minute, seconds=dt.second).total_seconds()
            elif len(time[0].split(':')) == 3:
                # Format: 'hh:mm:ss'
                dt = datetime.strptime(time[0], "%H:%M:%S")
                # print("hour, minutes and seconds: ", timedelta(minutes=dt.minute, seconds=dt.second).total_seconds())
                return timedelta(hours=dt.hour, minutes=dt.minute, seconds=dt.second).total_seconds()
        
        return 0  # Return 0 if format is unrecognized
    except Exception as e:
        print(f"Error converting time '{time}': {e}")
        return 0


@router.get("/email_overview")
async def get_email_overview(
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    print("Permission: ", user_permissions.date_filter)
    
    # Parse allowed filters from the permissions table
    if user_permissions and user_permissions.date_filter:
        # Convert the `date_filter` column (assumed to be a comma-separated string) into a set
        allowed_filters = set(user_permissions.date_filter.split(","))
    else:
        # If `date_filter` is empty or no record exists, allow all filters
        allowed_filters = {"all", "yesterday", "last_week", "last_month", "last_year"}
    
    # Validate the requested filter
    if filter_type not in allowed_filters:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Permission Denied",
                "message": f"The filter type '{filter_type}' is not allowed for this user.",
                "allowed_filters": list(allowed_filters)  # Return allowed filters to the client
            }
        )

    start_date, end_date = get_date_range(filter_type)
    total_processing_time_seconds = 1
    if start_date is None:
        service_level_gross = db.query(
            func.avg(
                WorkflowReportGuru.service_level_gross
            )
        ).scalar() or 0
        
        processing_times = db.query(WorkflowReportGuru.processing_time).all()
        # Clean the data to extract values from tuples
        processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
        for pt in processing_times:
            # print("Original Time:", pt)  # Debug print
            seconds = time_to_seconds(pt)
            # print("Converted Seconds:", seconds)  # Debug print
            total_processing_time_seconds += seconds
            # print("Interval Data:", dict(interval_data))  # Debug print
        
        total_emails = db.query(
            func.sum(
                WorkflowReportGuru.received
            )
        ).scalar() or 0
        
        new_cases = db.query(
            func.sum(
                WorkflowReportGuru.new_cases
            )
        ).scalar() or 0
        
        # Query the latest 6 intervals (dates) and service level gross
        service_level_gross_data = db.query(
            WorkflowReportGuru.interval.label("interval"),
            func.avg(WorkflowReportGuru.service_level_gross).label("service_level_gross")
        ).group_by(WorkflowReportGuru.interval).order_by(WorkflowReportGuru.interval.desc()).all()

        # Format the service level gross data
        service_level_gross_trend = [
            {"interval": row.interval, "service_level_gross": round(row.service_level_gross or 0, 2)}
            for row in service_level_gross_data
        ]
    else:
        service_level_gross = db.query(
            func.avg(
                WorkflowReportGuru.service_level_gross
            )
        ).filter(
            WorkflowReportGuru.date.between(start_date, end_date)
        ).scalar() or 0
        
        processing_times = db.query(WorkflowReportGuru.processing_time).filter(
            WorkflowReportGuru.date.between(start_date, end_date)
        ).all()
        processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
        for pt in processing_times:
            seconds = time_to_seconds(pt)
            total_processing_time_seconds += seconds
        
        total_emails = db.query(
            func.sum(
                WorkflowReportGuru.received
            )
        ).filter(
            WorkflowReportGuru.date.between(start_date, end_date)
        ).scalar() or 0
        
        new_cases = db.query(
            func.sum(
                WorkflowReportGuru.new_cases
            )
        ).filter(
            WorkflowReportGuru.date.between(start_date, end_date)
        ).scalar() or 0
        
        # Query the latest 6 intervals (dates) and service level gross
        service_level_gross_data = db.query(
            WorkflowReportGuru.interval.label("interval"),
            func.avg(WorkflowReportGuru.service_level_gross).label("service_level_gross")
        ).filter(
            WorkflowReportGuru.date.between(start_date, end_date)
        ).group_by(WorkflowReportGuru.interval).order_by(WorkflowReportGuru.interval.desc()).all()

        # Format the service level gross data
        service_level_gross_trend = [
            {"interval": row.interval, "service_level_gross": round(row.service_level_gross or 0, 2)}
            for row in service_level_gross_data
        ]
    
    return {
        "Total Processing Time (sec)": total_processing_time_seconds if total_processing_time_seconds>1 else 0,
        "total emails recieved": total_emails,
        "total new cases": new_cases,
        "service_level_gross": round(service_level_gross, 2),
        "daily_service_level_gross": service_level_gross_trend
    }

@router.get("/email_overview_sub_kpis")
async def get_email_overview_sub_kpis(
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
    start_date, end_date = get_date_range("yesterday")
    prev_start_date, prev_end_date = get_date_range("last_week")
    total_processing_time_seconds = 1
    prev_total_processing_time_seconds = 1
    # start_date, end_date = start_date.strftime("%d.%m.%Y"), end_date.strftime("%d.%m.%Y")
    # prev_start_date, prev_end_date = prev_start_date.strftime("%d.%m.%Y"), prev_end_date.strftime("%d.%m.%Y")
    # Normal Kpis
    service_level_gross = db.query(
        func.avg(
            WorkflowReportGuru.service_level_gross
        )
    ).filter(
        WorkflowReportGuru.date.between(start_date, end_date)
    ).scalar() or 0
    
    processing_times = db.query(WorkflowReportGuru.processing_time).filter(
        WorkflowReportGuru.date.between(start_date, end_date)
    ).all()
    processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
    for pt in processing_times:
        seconds = time_to_seconds(pt)
        total_processing_time_seconds += seconds
    
    total_emails = db.query(
        func.sum(
            WorkflowReportGuru.received
        )
    ).filter(
        WorkflowReportGuru.date.between(start_date, end_date)
    ).scalar() or 0
    
    new_cases = db.query(
        func.sum(
            WorkflowReportGuru.new_cases
        )
    ).filter(
        WorkflowReportGuru.date.between(start_date, end_date)
    ).scalar() or 0
    
    # Previous Kpis to calculate the change
    prev_service_level_gross = db.query(
        func.avg(
            WorkflowReportGuru.service_level_gross
        )
    ).filter(
        WorkflowReportGuru.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    
    prev_processing_times = db.query(WorkflowReportGuru.processing_time).filter(
        WorkflowReportGuru.date.between(prev_start_date, prev_end_date)
    ).all()
    prev_processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in prev_processing_times]
    for pt in prev_processing_times:
        prev_seconds = time_to_seconds(pt)
        prev_total_processing_time_seconds += prev_seconds
    
    prev_total_emails = db.query(
        func.sum(
            WorkflowReportGuru.received
        )
    ).filter(
        WorkflowReportGuru.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    
    prev_new_cases = db.query(
        func.sum(
            WorkflowReportGuru.new_cases
        )
    ).filter(
        WorkflowReportGuru.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    
    return {
        "Total Processing Time (sec)": total_processing_time_seconds,
        "Total Processing Time (sec) change": round(((total_processing_time_seconds - prev_total_processing_time_seconds)/ prev_total_processing_time_seconds)/60, 2),
        "total emails recieved": total_emails,
        "total emails recieved change": calculate_percentage_change(total_emails, prev_total_emails),
        "total new cases": new_cases,
        "total new cases change": calculate_percentage_change(new_cases, prev_new_cases),
        "service_level_gross": round(service_level_gross, 2),
        "service_level_gross change": calculate_percentage_change(service_level_gross, prev_service_level_gross),
    }


@router.get("/email_performance")
async def get_mailbox_SL(filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
    
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    print("Permission: ", user_permissions.date_filter)
    
    # Parse allowed filters from the permissions table
    if user_permissions and user_permissions.date_filter:
        # Convert the `date_filter` column (assumed to be a comma-separated string) into a set
        allowed_filters = set(user_permissions.date_filter.split(","))
    else:
        # If `date_filter` is empty or no record exists, allow all filters
        allowed_filters = {"all", "yesterday", "last_week", "last_month", "last_year"}
    
    # Validate the requested filter
    if filter_type not in allowed_filters:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Permission Denied",
                "message": f"The filter type '{filter_type}' is not allowed for this user.",
                "allowed_filters": list(allowed_filters)  # Return allowed filters to the client
            }
        )
    
    start_date, end_date = get_date_range(filter_type=filter_type)
    if start_date is None:
        # Query the latest 6 intervals (dates) and service level gross
        service_level_gross_data = db.query(
            WorkflowReportGuru.mailbox.label("mailbox"),
            func.sum(WorkflowReportGuru.service_level_gross).label("service_level_gross")
        ).group_by(WorkflowReportGuru.mailbox).order_by(WorkflowReportGuru.service_level_gross.desc()).all()

        # Format the service level gross data
        service_level_gross = [
            {"mailbox": row.mailbox, "service_level_gross": round(row.service_level_gross or 0, 2)}
            for row in service_level_gross_data
        ]

        mailbox_processing_data = db.query(
            WorkflowReportGuru.mailbox.label("mailbox"),
            WorkflowReportGuru.processing_time.label("processing_time")  # Fetch raw time strings
        ).all()

        # Process data to calculate total processing time for each mailbox
        processing_time_by_mailbox = {}
        for row in mailbox_processing_data:
            if row.mailbox not in processing_time_by_mailbox:
                processing_time_by_mailbox[row.mailbox] = 0

            # Convert processing_time to seconds and accumulate
            processing_time_by_mailbox[row.mailbox] += time_to_seconds((row.processing_time,))

        # Format the results
        pt_mailbox = [
            {"mailbox": mailbox, "processing_time_sec": round(total_time, 2)}
            for mailbox, total_time in processing_time_by_mailbox.items()
        ]

        # Sort by processing time in descending order
        pt_mailbox = sorted(pt_mailbox, key=lambda x: x["processing_time_sec"], reverse=True)
        
        # Query total new sent emails
        replies_data = db.query(
            WorkflowReportGuru.mailbox.label("mailbox"),
            func.sum(WorkflowReportGuru.sent_reply).label("sent"),
            func.sum(WorkflowReportGuru.sent_forwarded).label("forwarded")
        ).group_by(WorkflowReportGuru.mailbox).order_by(WorkflowReportGuru.sent_reply.desc()).all()

        replies = [
        {"mailbox": row.mailbox, "sent": round(row.sent or 0, 2), "forwarded": round(row.forwarded or 0, 2)}
        for row in replies_data
        ]
    else:
        service_level_gross_data = db.query(
            WorkflowReportGuru.mailbox.label("mailbox"),
            func.sum(WorkflowReportGuru.service_level_gross).label("service_level_gross")
        ).filter(
            WorkflowReportGuru.date.between(start_date, end_date)
        ).group_by(WorkflowReportGuru.mailbox).order_by(WorkflowReportGuru.service_level_gross.desc()).all()

        # Format the service level gross data
        service_level_gross = [
            {"mailbox": row.mailbox, "service_level_gross": round(row.service_level_gross or 0, 2)}
            for row in service_level_gross_data
        ]

        mailbox_processing_data = db.query(
            WorkflowReportGuru.mailbox.label("mailbox"),
            WorkflowReportGuru.processing_time.label("processing_time")  # Fetch raw time strings
        ).filter(
            WorkflowReportGuru.date.between(start_date, end_date)
        ).all()
        
        # Process data to calculate total processing time for each mailbox
        processing_time_by_mailbox = {}
        for row in mailbox_processing_data:
            if row.mailbox not in processing_time_by_mailbox:
                processing_time_by_mailbox[row.mailbox] = 0
            
            print("Processing time: ", row.processing_time)    

            # Convert processing_time to seconds and accumulate
            processing_time_by_mailbox[row.mailbox] += time_to_seconds((row.processing_time,))

        # Format the results
        pt_mailbox = [
            {"mailbox": mailbox, "processing_time_sec": round(total_time, 2)}
            for mailbox, total_time in processing_time_by_mailbox.items()
        ]

        # Sort by processing time in descending order
        pt_mailbox = sorted(pt_mailbox, key=lambda x: x["processing_time_sec"], reverse=True)
        
        # Query total new sent emails
        replies_data = db.query(
            WorkflowReportGuru.mailbox.label("mailbox"),
            func.sum(WorkflowReportGuru.sent_reply).label("sent"),
            func.sum(WorkflowReportGuru.sent_forwarded).label("forwarded")
        ).filter(
            WorkflowReportGuru.date.between(start_date, end_date)
        ).group_by(WorkflowReportGuru.mailbox).order_by(WorkflowReportGuru.sent_reply.desc()).all()

        replies = [
        {"mailbox": row.mailbox, "sent": round(row.sent or 0, 2), "forwarded": round(row.forwarded or 0, 2)}
        for row in replies_data
        ]

    return {
        "service_level_by_mailbox": service_level_gross,
        "Processing_time_by_mailbox": pt_mailbox,
        "respone_by_mailbox": replies
    }