from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.models.models import WorkflowReportGuruKF, User
from app.database.db.db_connection import  get_db
from datetime import datetime, timedelta, date
from sqlalchemy import func
from app.database.scehmas import schemas
from app.database.auth import oauth2
from app.src.utils import get_date_subkpis, calculate_percentage_change, validate_user_and_date_permissions
from typing import Optional


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
        # print("Time str", time[0], time)

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
    
def time_to_minutes(time):
    """Convert time in various formats to minutes."""
    try:
        if isinstance(time, tuple):
            pass

        if '.' in time[0]:
            print("float ", time[0])
            return float(time[0])  # Assuming this represents minutes directly

        # Handle time formats
        if ':' in time[0]:
            if len(time[0].split(':')) == 2:
                # Format: 'mm:ss'
                dt = datetime.strptime(time[0], "%M:%S")
                total_minutes = dt.minute + dt.second / 60
                return total_minutes
            elif len(time[0].split(':')) == 3:
                # Format: 'hh:mm:ss'
                dt = datetime.strptime(time[0], "%H:%M:%S")
                total_minutes = dt.hour * 60 + dt.minute + dt.second / 60
                return total_minutes

        return 0  # Return 0 if format is unrecognized
    except Exception as e:
        print(f"Error converting time '{time}': {e}")
        return 0


@router.get("/email_overview")
async def get_email_overview(
    start_date: Optional[date] = Query(
        None, 
        description="Start date for the filter in 'YYYY-MM-DD' format.",
        example="2024-12-29"
    ),
    end_date: Optional[date] = Query(
        None, 
        description="End date for the filter in 'YYYY-MM-DD' format.",
        example="2024-12-30"
    ),
    include_all: bool = Query(
        False, description="Set to True to retrieve all data without date filtering."
    ),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
    # User info
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    # Calculate the allowed date range based on the user's permissions
    start_date, end_date = validate_user_and_date_permissions(db=db, current_user=current_user, start_date=start_date, end_date=end_date, include_all=include_all)
    
    # Determine user access level
    email_filter = current_user.get("email")
    email_contains_5vflug = "5vorflug" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        query = db.query(WorkflowReportGuruKF)
    elif email_contains_5vflug:
        print("containss")
        query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like("%5vorFlug%")  # Replace `special_field` with the relevant field
        )
    else:
        print("executing else containss")
        query = db.query(WorkflowReportGuruKF).filter(WorkflowReportGuruKF.customer.notlike("%5vorFlug%"))
        
    total_processing_time_seconds = 1
    if start_date is None:
        service_level_gross = query.with_entities(
            func.avg(
                WorkflowReportGuruKF.service_level_gross
            )
        ).scalar() or 0
        
        processing_times = query.with_entities(WorkflowReportGuruKF.processing_time).all()
        # Clean the data to extract values from tuples
        processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
        for pt in processing_times:
            # print("Original Time:", pt)  # Debug print
            seconds = time_to_seconds(pt)
            # print("Converted Seconds:", seconds)  # Debug print
            total_processing_time_seconds += seconds
            # print("Interval Data:", dict(interval_data))  # Debug print
        
        total_emails = query.with_entities(
            func.sum(
                WorkflowReportGuruKF.received
            )
        ).scalar() or 0
        
        new_cases = query.with_entities(
            func.sum(
                WorkflowReportGuruKF.new_cases
            )
        ).scalar() or 0
        
        # Query the latest 6 intervals (dates) and service level gross
        service_level_gross_data = query.with_entities(
            WorkflowReportGuruKF.date.label("interval"),
            func.avg(WorkflowReportGuruKF.service_level_gross).label("service_level_gross")
        ).group_by(WorkflowReportGuruKF.date).order_by(WorkflowReportGuruKF.interval.desc()).limit(10).all()

        # Format the service level gross data
        service_level_gross_trend = [
            {"date": row.interval, "service_level_gross": round(row.service_level_gross or 0, 2)}
            for row in service_level_gross_data
        ]
    else:
        service_level_gross = query.with_entities(
            func.avg(
                WorkflowReportGuruKF.service_level_gross
            )
        ).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).scalar() or 0
        
        processing_times = query.with_entities(WorkflowReportGuruKF.processing_time).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).all()
        processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
        for pt in processing_times:
            seconds = time_to_seconds(pt)
            total_processing_time_seconds += seconds
        
        total_emails = query.with_entities(
            func.sum(
                WorkflowReportGuruKF.received
            )
        ).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).scalar() or 0
        
        new_cases = query.with_entities(
            func.sum(
                WorkflowReportGuruKF.new_cases
            )
        ).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).scalar() or 0
        
        # Query the latest 6 intervals (dates) and service level gross
        service_level_gross_data = query.with_entities(
            WorkflowReportGuruKF.date.label("interval"),
            func.avg(WorkflowReportGuruKF.service_level_gross).label("service_level_gross")
        ).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).group_by(WorkflowReportGuruKF.date).order_by(WorkflowReportGuruKF.date.desc()).limit(10).all()

        # Format the service level gross data
        service_level_gross_trend = [
            {"interval": row.interval, "service_level_gross": round(row.service_level_gross or 0, 2)}
            for row in service_level_gross_data
        ]
    
    return {
        "Total Processing Time (sec)": round(total_processing_time_seconds,2) if total_processing_time_seconds>1 else 0,
        "total emails recieved": total_emails,
        "total new cases": new_cases,
        "service_level_gross": round(service_level_gross, 2),
        "daily_service_level_gross": service_level_gross_trend
    }

@router.get("/email_overview_sub_kpis")
async def get_email_overview_sub_kpis(
    start_date: Optional[date] = Query(
        None, 
        description="Start date for the filter in 'YYYY-MM-DD' format.",
        example="2024-12-29"
    ),
    end_date: Optional[date] = Query(
        None, 
        description="End date for the filter in 'YYYY-MM-DD' format.",
        example="2024-12-30"
    ),
    include_all: bool = Query(
        False, description="Set to True to retrieve all data without date filtering."
    ),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
    # User info
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    # Calculate the allowed date range based on the user's permissions
    start_date, end_date = validate_user_and_date_permissions(db=db, current_user=current_user, start_date=start_date, end_date=end_date, include_all=include_all)
    
    # Determine user access level
    email_filter = current_user.get("email")
    email_contains_5vflug = "5vorflug" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        query = db.query(WorkflowReportGuruKF)
    elif email_contains_5vflug:
        print("containss")
        query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like("%5vorFlug%")  # Replace `special_field` with the relevant field
        )
    else:
        print("executing else containss")
        query = db.query(WorkflowReportGuruKF).filter(WorkflowReportGuruKF.customer.notlike("%5vorFlug%"))
    
    start_date, end_date = get_date_subkpis("yesterday")
    prev_start_date, prev_end_date = get_date_subkpis("last_week")
    total_processing_time_seconds = 1
    prev_total_processing_time_seconds = 1
    # start_date, end_date = start_date.strftime("%d.%m.%Y"), end_date.strftime("%d.%m.%Y")
    # prev_start_date, prev_end_date = prev_start_date.strftime("%d.%m.%Y"), prev_end_date.strftime("%d.%m.%Y")
    # Normal Kpis
    service_level_gross = query.with_entities(
        func.avg(
            WorkflowReportGuruKF.service_level_gross
        )
    ).filter(
        WorkflowReportGuruKF.date.between(start_date, end_date)
    ).scalar() or 0
    
    processing_times = query.with_entities(WorkflowReportGuruKF.processing_time).filter(
        WorkflowReportGuruKF.date.between(start_date, end_date)
    ).all()
    processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
    for pt in processing_times:
        seconds = time_to_seconds(pt)
        total_processing_time_seconds += seconds
    
    total_emails = query.with_entities(
        func.sum(
            WorkflowReportGuruKF.received
        )
    ).filter(
        WorkflowReportGuruKF.date.between(start_date, end_date)
    ).scalar() or 0
    
    new_cases = query.with_entities(
        func.sum(
            WorkflowReportGuruKF.new_cases
        )
    ).filter(
        WorkflowReportGuruKF.date.between(start_date, end_date)
    ).scalar() or 0
    
    # Previous Kpis to calculate the change
    prev_service_level_gross = query.with_entities(
        func.avg(
            WorkflowReportGuruKF.service_level_gross
        )
    ).filter(
        WorkflowReportGuruKF.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    
    prev_processing_times = query.with_entities(WorkflowReportGuruKF.processing_time).filter(
        WorkflowReportGuruKF.date.between(prev_start_date, prev_end_date)
    ).all()
    prev_processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in prev_processing_times]
    for pt in prev_processing_times:
        prev_seconds = time_to_seconds(pt)
        prev_total_processing_time_seconds += prev_seconds
    
    prev_total_emails = query.with_entities(
        func.sum(
            WorkflowReportGuruKF.received
        )
    ).filter(
        WorkflowReportGuruKF.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    
    prev_new_cases = query.with_entities(
        func.sum(
            WorkflowReportGuruKF.new_cases
        )
    ).filter(
        WorkflowReportGuruKF.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    
    return {
        "Total Processing Time (sec)": round(total_processing_time_seconds, 2),
        "Total Processing Time (sec) change": round(((total_processing_time_seconds - prev_total_processing_time_seconds)/ prev_total_processing_time_seconds)/60, 2),
        "total emails recieved": total_emails,
        "total emails recieved change": calculate_percentage_change(total_emails, prev_total_emails),
        "total new cases": new_cases,
        "total new cases change": calculate_percentage_change(new_cases, prev_new_cases),
        "service_level_gross": round(service_level_gross, 2),
        "service_level_gross change": calculate_percentage_change(service_level_gross, prev_service_level_gross),
    }


@router.get("/email_performance")
async def get_mailbox_SL(
    start_date: Optional[date] = Query(
        None, 
        description="Start date for the filter in 'YYYY-MM-DD' format.",
        example="2024-12-29"
    ),
    end_date: Optional[date] = Query(
        None, 
        description="End date for the filter in 'YYYY-MM-DD' format.",
        example="2024-12-30"
    ),
    include_all: bool = Query(
        False, description="Set to True to retrieve all data without date filtering."
    ),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
    
    # User info
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    # Calculate the allowed date range based on the user's permissions
    start_date, end_date = validate_user_and_date_permissions(db=db, current_user=current_user, start_date=start_date, end_date=end_date, include_all=include_all)
    
    
    # Determine user access level
    email_filter = current_user.get("email")
    email_contains_5vflug = "5vorflug" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        query = db.query(WorkflowReportGuruKF)
    elif email_contains_5vflug:
        print("containss")
        query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like("%5vorFlug%")  
        )
    else:
        print("executing else containss")
        query = db.query(WorkflowReportGuruKF).filter(WorkflowReportGuruKF.customer.notlike("%5vorFlug%"))
    
    if start_date is None:
        # Query the latest 6 intervals (dates) and service level gross
        service_level_gross_data = query.with_entities(
            WorkflowReportGuruKF.mailbox.label("mailbox"),
            func.avg(WorkflowReportGuruKF.service_level_gross).label("service_level_gross")
        ).group_by(WorkflowReportGuruKF.mailbox).order_by(WorkflowReportGuruKF.service_level_gross.desc()).all()

        # Format the service level gross data
        service_level_gross = [
            {"mailbox": row.mailbox, "service_level_gross": round(row.service_level_gross or 0, 2)}
            for row in service_level_gross_data
        ]

        mailbox_processing_data = query.with_entities(
            WorkflowReportGuruKF.mailbox.label("mailbox"),
            WorkflowReportGuruKF.processing_time.label("processing_time")  # Fetch raw time strings
        ).all()

        # Process data to calculate total processing time for each mailbox
        processing_time_by_mailbox = {}
        for row in mailbox_processing_data:
            if row.mailbox not in processing_time_by_mailbox:
                processing_time_by_mailbox[row.mailbox] = 0

            # Convert processing_time to seconds and accumulate
            processing_time_by_mailbox[row.mailbox] += time_to_minutes((row.processing_time,))

        # Format the results
        pt_mailbox = [
            {"mailbox": mailbox, "processing_time_sec": round(total_time, 2)}
            for mailbox, total_time in processing_time_by_mailbox.items()
        ]

        # Sort by processing time in descending order
        pt_mailbox = sorted(pt_mailbox, key=lambda x: x["processing_time_sec"], reverse=True)
        
        # Query total new sent emails
        replies_data = query.with_entities(
            WorkflowReportGuruKF.customer.label("customer"),
            func.sum(WorkflowReportGuruKF.sent).label("sent"),
            func.sum(WorkflowReportGuruKF.received).label("recieved")
        ).group_by(WorkflowReportGuruKF.customer).order_by(WorkflowReportGuruKF.sent.desc()).all()

        replies = [
        {"customer": row.customer, "sent": round(row.sent or 0, 2), "recieved": round(row.recieved or 0, 2)}
        for row in replies_data
        ]
    else:
        service_level_gross_data = query.with_entities(
            WorkflowReportGuruKF.mailbox.label("mailbox"),
            func.avg(WorkflowReportGuruKF.service_level_gross).label("service_level_gross")
        ).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).group_by(WorkflowReportGuruKF.mailbox).order_by(WorkflowReportGuruKF.service_level_gross.desc()).all()

        # Format the service level gross data
        service_level_gross = [
            {"mailbox": row.mailbox, "service_level_gross": round(row.service_level_gross or 0, 2)}
            for row in service_level_gross_data
        ]

        mailbox_processing_data = query.with_entities(
            WorkflowReportGuruKF.mailbox.label("mailbox"),
            WorkflowReportGuruKF.processing_time.label("processing_time")  # Fetch raw time strings
        ).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).all()
        
        # Process data to calculate total processing time for each mailbox
        processing_time_by_mailbox = {}
        for row in mailbox_processing_data:
            if row.mailbox not in processing_time_by_mailbox:
                processing_time_by_mailbox[row.mailbox] = 0
            
            print("Processing time: ", row.processing_time)    

            # Convert processing_time to seconds and accumulate
            processing_time_by_mailbox[row.mailbox] += time_to_minutes((row.processing_time,))

        # Format the results
        pt_mailbox = [
            {"mailbox": mailbox, "processing_time_sec": round(total_time, 2)}
            for mailbox, total_time in processing_time_by_mailbox.items()
        ]

        # Sort by processing time in descending order
        pt_mailbox = sorted(pt_mailbox, key=lambda x: x["processing_time_sec"], reverse=True)
        
        # Query total new sent emails
        replies_data = query.with_entities(
            WorkflowReportGuruKF.customer.label("customer"),
            func.sum(WorkflowReportGuruKF.sent).label("sent"),
            func.sum(WorkflowReportGuruKF.received).label("recieved")
        ).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).group_by(WorkflowReportGuruKF.customer).order_by(WorkflowReportGuruKF.sent.desc()).all()

        replies = [
        {"customer": row.customer, "sent": round(row.sent or 0, 2), "recieved": round(row.recieved or 0, 2)}
        for row in replies_data
        ]

    return {
        "service_level_by_mailbox": service_level_gross,
        "Processing_time_by_mailbox": pt_mailbox,
        "respone_by_customers": replies
    }