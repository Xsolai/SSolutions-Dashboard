from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.models.models import WorkflowReportGuru
from app.database.db.db_connection import  get_db
from datetime import datetime, timedelta
from sqlalchemy import func
from collections import defaultdict


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
async def get_graphs_data(db: Session = Depends(get_db)):
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
