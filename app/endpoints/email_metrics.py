from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.models.models import WorkflowReportGuru
from app.database.db.db_connection import  get_db
from datetime import datetime, timedelta
from sqlalchemy import func
from collections import defaultdict
from app.database.scehmas import schemas
from app.database.auth import oauth2


router = APIRouter()

def time_to_seconds(time_str):
    """Convert time in 'hh:mm:ss' or 'mm:ss' format to seconds."""
    try:
        if len(time_str.split(':')) == 2:
            # Format: 'mm:ss'
            dt = datetime.strptime(time_str, "%M:%S")
            return timedelta(minutes=dt.minute, seconds=dt.second).total_seconds()
        elif len(time_str.split(':')) == 3:
            # Format: 'hh:mm:ss'
            dt = datetime.strptime(time_str, "%H:%M:%S")
            return timedelta(hours=dt.hour, minutes=dt.minute, seconds=dt.second).total_seconds()
        return 0
    except Exception as e:
        print(f"Error converting time '{time_str}': {e}")
        return 0


@router.get("/email-data")
async def get_graphs_data(db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve graphs data from the database."""
    email_recieved = db.query(
        func.sum(
            WorkflowReportGuru.received
        )
    ).scalar() or 0
    
    email_answered = db.query(
        func.sum(
            WorkflowReportGuru.sent_reply
        )
    ).scalar() or 0
    
    email_forwarded = db.query(
        func.sum(
            WorkflowReportGuru.sent_forwarded
        )
    ).scalar() or 0
    
    email_archieved = db.query(
        func.sum(
            WorkflowReportGuru.archived
        )
    ).scalar() or 0
    
    service_level_gross = db.query(
        func.sum(
            WorkflowReportGuru.service_level_gross
        )
    ).scalar() or 0
    
    new_sent = db.query(
        func.sum(
            WorkflowReportGuru.sent_new_message
        )
    ).scalar() or 0
    
    processing_times = db.query(WorkflowReportGuru.processing_time).all()
    total_processing_time_seconds = sum(
        time_to_seconds(pt.processing_time) for pt in processing_times if pt.processing_time
    )
    
    interval_data = defaultdict(float)  # Default value of float for summing
    
    for pt in processing_times:
        if pt.processing_time:
            # Convert time to seconds
            seconds = time_to_seconds(pt.processing_time)
            # Determine the 5-minute interval (e.g., 0-299 seconds = 0-5 minutes)
            interval = (seconds // 300) * 5  # Integer division, then multiply by 5 minutes
            interval_data[interval] += seconds
    
    # Format the interval data for frontend use
    processing_time_trend = [
        {"interval_start": f"{interval}m", "total_processing_time_sec": total}
        for interval, total in sorted(interval_data.items())
    ]
    
    return {
        "email recieved": email_recieved,
        "email answered": email_answered,
        "email forwarded": email_forwarded,
        "email archived": email_archieved,
        "SL Gross": service_level_gross,
        "New Sent": new_sent,
        "Total Processing Time (sec)": total_processing_time_seconds,
        "Processing Time Trend": processing_time_trend
            }


@router.get("/email_overview")
async def get_daily_SL(db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
    service_level_gross = db.query(
        func.sum(
            WorkflowReportGuru.service_level_gross
        )
    ).scalar() or 0
    
    
    processing_times = db.query(WorkflowReportGuru.processing_time).all()
    total_processing_time_seconds = sum(
        time_to_seconds(pt.processing_time) for pt in processing_times if pt.processing_time
    )
    
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
        func.sum(WorkflowReportGuru.service_level_gross).label("service_level_gross")
    ).group_by(WorkflowReportGuru.interval).order_by(WorkflowReportGuru.interval.desc()).limit(6).all()

    # Format the service level gross data
    service_level_gross = [
        {"interval": row.interval, "service_level_gross": round(row.service_level_gross or 0, 2)}
        for row in service_level_gross_data
    ]
    
    return {
        "Total Processing Time (sec)": total_processing_time_seconds,
        "total emails recieved": total_emails,
        "total new cases": new_cases,
        "daily_service_level_gross": service_level_gross
    }


@router.get("/email_performance_metrics")
async def get_mailbox_SL(db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
    
    # Query the latest 6 intervals (dates) and service level gross
    service_level_gross_data = db.query(
        WorkflowReportGuru.mailbox.label("mailbox"),
        func.sum(WorkflowReportGuru.service_level_gross).label("service_level_gross")
    ).group_by(WorkflowReportGuru.mailbox).order_by(WorkflowReportGuru.service_level_gross.desc()).limit(10).all()

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
        processing_time_by_mailbox[row.mailbox] += time_to_seconds(row.processing_time or "0:00:00")

    # Format the results
    pt_mailbox = [
        {"mailbox": mailbox, "processing_time_sec": round(total_time, 2)}
        for mailbox, total_time in processing_time_by_mailbox.items()
    ]

    # Sort by processing time in descending order
    pt_mailbox = sorted(pt_mailbox, key=lambda x: x["processing_time_sec"], reverse=True)
    
     # Query total new sent emails
    replies_data = db.query(
        WorkflowReportGuru.interval.label("mailbox"),
        func.sum(WorkflowReportGuru.sent_reply).label("sent"),
        func.sum(WorkflowReportGuru.sent_forwarded).label("forwarded")
    ).group_by(WorkflowReportGuru.mailbox).order_by(WorkflowReportGuru.sent_reply.desc()).limit(6).all()

    replies = [
    {"mailbox": row.mailbox, "sent": round(row.sent or 0, 2), "forwarded": round(row.forwarded or 0, 2)}
    for row in replies_data
    ]

    return {
        "service_level_by_mailbox": service_level_gross,
        "Processing_time_by_mailbox": pt_mailbox,
        "respone_by_mailbox": replies
    }
