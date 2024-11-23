from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.models.models import (GuruCallReason, GuruDailyCallData, WorkflowReportGuru, WorkflowReportGuruKF)
from app.database.db.db_connection import  get_db, SessionLocal
from datetime import datetime, timedelta
from sqlalchemy import func


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
    
    return {
        "email recieved": email_recieved,
        "email answered": email_answered,
        "email forwarded": email_forwarded,
        "email archived": email_archieved,
        "SL Gross": service_level_gross,
        "New Sent": new_sent,
        "Total Processing Time (sec)": total_processing_time_seconds
            }
