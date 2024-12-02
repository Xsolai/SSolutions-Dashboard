from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.models.models import WorkflowReportGuru
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

def time_to_seconds(time_str):
    """Convert time in various formats to seconds."""
    try:
        if isinstance(time_str, tuple):
            pass
        
        if '.' in time_str[0]:
            print("float ", time_str[0])
            return (float(time_str[0])*60)
        print("Time str", time_str[0], time_str)

        # Handle time formats
        if ':' in time_str[0]:
            if len(time_str[0].split(':')) == 2:
                # Format: 'mm:ss'
                dt = datetime.strptime(time_str[0], "%M:%S")
                # print("minutes and seconds: ", timedelta(minutes=dt.minute, seconds=dt.second).total_seconds())
                return timedelta(minutes=dt.minute, seconds=dt.second).total_seconds()
            elif len(time_str[0].split(':')) == 3:
                # Format: 'hh:mm:ss'
                dt = datetime.strptime(time_str[0], "%H:%M:%S")
                # print("hour, minutes and seconds: ", timedelta(minutes=dt.minute, seconds=dt.second).total_seconds())
                return timedelta(hours=dt.hour, minutes=dt.minute, seconds=dt.second).total_seconds()
        
        return 0  # Return 0 if format is unrecognized
    except Exception as e:
        print(f"Error converting time '{time_str}': {e}")
        return 0

@router.get("/anaytics_email_data")
async def get_anaytics_email_data(
    filter_type: str = Query("all", description="Filter by date range: yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db)
):
    """Endpoint to retrieve graphs data from the database with date filtering."""
    # Get date range based on filter_type
    start_date, end_date = get_date_range(filter_type)
    
    # Retrieve data from database
    if start_date is None:
        # Filter data based on the interval (date) column
        email_recieved = db.query(
            func.sum(WorkflowReportGuru.received)
        ).scalar() or 0

        email_answered = db.query(
            func.sum(WorkflowReportGuru.sent_reply)
        ).scalar() or 0

        email_forwarded = db.query(
            func.sum(WorkflowReportGuru.sent_forwarded)
        ).scalar() or 0

        email_archieved = db.query(
            func.sum(WorkflowReportGuru.archived)
        ).scalar() or 0

        service_level_gross = db.query(
            func.avg(WorkflowReportGuru.service_level_gross)
        ).scalar() or 0

        new_sent = db.query(
            func.sum(WorkflowReportGuru.sent_new_message)
        ).scalar() or 0

        processing_times = db.query(WorkflowReportGuru.processing_time).all()
        

    else:
        # Convert date strings to datetime for filtering
        start_date_str = start_date.strftime("%d.%m.%Y")
        end_date_str = end_date.strftime("%d.%m.%Y")
        # Filter data based on the interval (date) column
        email_recieved = db.query(
            func.sum(WorkflowReportGuru.received)
        ).filter(
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
        ).scalar() or 0

        email_answered = db.query(
            func.sum(WorkflowReportGuru.sent_reply)
        ).filter(
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
        ).scalar() or 0

        email_forwarded = db.query(
            func.sum(WorkflowReportGuru.sent_forwarded)
        ).filter(
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
        ).scalar() or 0

        email_archieved = db.query(
            func.sum(WorkflowReportGuru.archived)
        ).filter(
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
        ).scalar() or 0

        service_level_gross = db.query(
            func.avg(WorkflowReportGuru.service_level_gross)
        ).filter(
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
        ).scalar() or 0

        new_sent = db.query(
            func.sum(WorkflowReportGuru.sent_new_message)
        ).filter(
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
        ).scalar() or 0

        processing_times = db.query(WorkflowReportGuru.processing_time).filter(
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
        ).all()
    # Clean the data to extract values from tuples
    processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
    
    total_processing_time_seconds = 0
    interval_data = defaultdict(float)

    for pt in processing_times:
        # print("Original Time:", pt)  # Debug print
        seconds = time_to_seconds(pt)
        # print("Converted Seconds:", seconds)  # Debug print
        total_processing_time_seconds += seconds
        interval = (seconds // 600) * 10
        interval_data[interval] += seconds
        # print("Interval Data:", dict(interval_data))  # Debug print

    processing_time_trend = [
        {"interval_start": f"{interval}m", "total_processing_time_sec": total}
        for interval, total in sorted(interval_data.items())
    ]
    # calculating for counts 
    interval_count_data = defaultdict(int)  # Default value is int for counting occurrences

    for pt in processing_times:
        seconds = time_to_seconds(pt)
        if seconds > 0:  # Exclude 0.0 values
            interval_count = (seconds // 600) * 10  # Group into 10-minute intervals
            interval_count_data[interval_count] += 1  # Increment the count for this interval

    processing_count_trend = [
        {"interval_start": f"{interval}m", "count": count}
        for interval, count in sorted(interval_count_data.items())
    ]
    return {
        "email recieved": email_recieved,
        "email answered": email_answered,
        "email forwarded": email_forwarded,
        "email archived": email_archieved,
        "SL Gross": round(service_level_gross, 2),
        "New Sent": new_sent,
        "Total Processing Time (sec)": round(total_processing_time_seconds, 2),
        "Processing Time Trend in seconds": processing_time_trend,
        "Processing Count Trend": processing_count_trend
    }
    
@router.get("/anaytics_email_data_sub_kpis")
async def get_anaytics_email_data_sub_kpis(
    filter_type: str = Query("all", description="Filter by date range: yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db)
):
    """Endpoint to retrieve graphs data from the database with date filtering."""
    start_date, end_date = get_date_range("yesterday")
    prev_start_date, prev_end_date = get_date_range("last_week")
    total_processing_time_seconds = 0
    prev_total_processing_time_seconds = 0
    start_date_str, end_date_str = start_date.strftime("%d.%m.%Y"), end_date.strftime("%d.%m.%Y")
    prev_start_date_str, prev_end_date_str = prev_start_date.strftime("%d.%m.%Y"), prev_end_date.strftime("%d.%m.%Y")
    # Filter data based on the interval (date) column
    email_recieved = db.query(
        func.sum(WorkflowReportGuru.received)
    ).filter(
        WorkflowReportGuru.interval.between(start_date_str, end_date_str)
    ).scalar() or 0

    email_answered = db.query(
        func.sum(WorkflowReportGuru.sent_reply)
    ).filter(
        WorkflowReportGuru.interval.between(start_date_str, end_date_str)
    ).scalar() or 0

    email_forwarded = db.query(
        func.sum(WorkflowReportGuru.sent_forwarded)
    ).filter(
        WorkflowReportGuru.interval.between(start_date_str, end_date_str)
    ).scalar() or 0

    email_archieved = db.query(
        func.sum(WorkflowReportGuru.archived)
    ).filter(
        WorkflowReportGuru.interval.between(start_date_str, end_date_str)
    ).scalar() or 0

    new_sent = db.query(
        func.sum(WorkflowReportGuru.sent_new_message)
    ).filter(
        WorkflowReportGuru.interval.between(start_date_str, end_date_str)
    ).scalar() or 0
    
    # Previous values to calculate the change
    prev_email_recieved = db.query(
        func.sum(WorkflowReportGuru.received)
    ).filter(
        WorkflowReportGuru.interval.between(prev_start_date_str, prev_end_date_str)
    ).scalar() or 0

    prev_email_answered = db.query(
        func.sum(WorkflowReportGuru.sent_reply)
    ).filter(
        WorkflowReportGuru.interval.between(prev_start_date_str, prev_end_date_str)
    ).scalar() or 0

    prev_email_forwarded = db.query(
        func.sum(WorkflowReportGuru.sent_forwarded)
    ).filter(
        WorkflowReportGuru.interval.between(prev_start_date_str, prev_end_date_str)
    ).scalar() or 0

    prev_email_archieved = db.query(
        func.sum(WorkflowReportGuru.archived)
    ).filter(
        WorkflowReportGuru.interval.between(prev_start_date_str, prev_end_date_str)
    ).scalar() or 0

    prev_new_sent = db.query(
        func.sum(WorkflowReportGuru.sent_new_message)
    ).filter(
        WorkflowReportGuru.interval.between(prev_start_date_str, prev_end_date_str)
    ).scalar() or 0
        
    return {
        "email recieved": email_recieved,
        "email recieved change": calculate_percentage_change(email_answered, prev_email_recieved),
        "email answered": email_answered,
        "email answered change": calculate_percentage_change(email_answered, prev_email_answered),
        "email forwarded": email_forwarded,
        "email forwarded change": calculate_percentage_change(email_forwarded, prev_email_forwarded),
        "email archived": email_archieved,
        "email archived change": calculate_percentage_change(email_archieved, prev_email_archieved),
        "New Sent": new_sent,
        "New Sent change": calculate_percentage_change(new_sent, prev_new_sent),
    }


@router.get("/email_overview")
async def get_email_overview(
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
    start_date, end_date = get_date_range(filter_type)
    total_processing_time_seconds = 0
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
        start_date_str = start_date.strftime("%d.%m.%Y")
        end_date_str = end_date.strftime("%d.%m.%Y")
        service_level_gross = db.query(
            func.avg(
                WorkflowReportGuru.service_level_gross
            )
        ).filter(
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
        ).scalar() or 0
        
        processing_times = db.query(WorkflowReportGuru.processing_time).filter(
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
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
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
        ).scalar() or 0
        
        new_cases = db.query(
            func.sum(
                WorkflowReportGuru.new_cases
            )
        ).filter(
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
        ).scalar() or 0
        
        # Query the latest 6 intervals (dates) and service level gross
        service_level_gross_data = db.query(
            WorkflowReportGuru.interval.label("interval"),
            func.avg(WorkflowReportGuru.service_level_gross).label("service_level_gross")
        ).filter(
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
        ).group_by(WorkflowReportGuru.interval).order_by(WorkflowReportGuru.interval.desc()).all()

        # Format the service level gross data
        service_level_gross_trend = [
            {"interval": row.interval, "service_level_gross": round(row.service_level_gross or 0, 2)}
            for row in service_level_gross_data
        ]
    
    return {
        "Total Processing Time (sec)": total_processing_time_seconds,
        "total emails recieved": total_emails,
        "total new cases": new_cases,
        "service_level_gross": round(service_level_gross, 2),
        "daily_service_level_gross": service_level_gross_trend
    }

@router.get("/email_overview_sub_kpis")
async def get_email_overview_sub_kpis(
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
    start_date, end_date = get_date_range("yesterday")
    prev_start_date, prev_end_date = get_date_range("last_week")
    total_processing_time_seconds = 0
    prev_total_processing_time_seconds = 0
    start_date_str, end_date_str = start_date.strftime("%d.%m.%Y"), end_date.strftime("%d.%m.%Y")
    prev_start_date_str, prev_end_date_str = prev_start_date.strftime("%d.%m.%Y"), prev_end_date.strftime("%d.%m.%Y")
    # Normal Kpis
    service_level_gross = db.query(
        func.avg(
            WorkflowReportGuru.service_level_gross
        )
    ).filter(
        WorkflowReportGuru.interval.between(start_date_str, end_date_str)
    ).scalar() or 0
    
    processing_times = db.query(WorkflowReportGuru.processing_time).filter(
        WorkflowReportGuru.interval.between(start_date_str, end_date_str)
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
        WorkflowReportGuru.interval.between(start_date_str, end_date_str)
    ).scalar() or 0
    
    new_cases = db.query(
        func.sum(
            WorkflowReportGuru.new_cases
        )
    ).filter(
        WorkflowReportGuru.interval.between(start_date_str, end_date_str)
    ).scalar() or 0
    
    # Previous Kpis to calculate the change
    prev_service_level_gross = db.query(
        func.avg(
            WorkflowReportGuru.service_level_gross
        )
    ).filter(
        WorkflowReportGuru.interval.between(prev_start_date_str, prev_end_date_str)
    ).scalar() or 0
    
    prev_processing_times = db.query(WorkflowReportGuru.processing_time).filter(
        WorkflowReportGuru.interval.between(prev_start_date_str, prev_end_date_str)
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
        WorkflowReportGuru.interval.between(prev_start_date_str, prev_end_date_str)
    ).scalar() or 0
    
    prev_new_cases = db.query(
        func.sum(
            WorkflowReportGuru.new_cases
        )
    ).filter(
        WorkflowReportGuru.interval.between(prev_start_date_str, prev_end_date_str)
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


@router.get("/email_performance_metrics")
async def get_mailbox_SL(filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
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
        start_date_str = start_date.strftime("%d.%m.%Y")
        end_date_str = end_date.strftime("%d.%m.%Y")
        
        service_level_gross_data = db.query(
            WorkflowReportGuru.mailbox.label("mailbox"),
            func.sum(WorkflowReportGuru.service_level_gross).label("service_level_gross")
        ).filter(
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
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
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
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
            WorkflowReportGuru.interval.between(start_date_str, end_date_str)
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