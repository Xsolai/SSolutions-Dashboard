from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.models.models import (GuruCallReason, GuruDailyCallData, 
                                        QueueStatistics, Permission, User)
from app.database.db.db_connection import SessionLocal,  get_db
from sqlalchemy import func
from app.database.scehmas import schemas
from app.database.auth import oauth2
from app.src.utils import get_date_range, calculate_percentage_change


router = APIRouter(
    tags=["Call APIS"]
)

def get_sla_percentage(db: Session, start_date, end_date):
    """Endpoint to retrieve sla% per queue."""
    if start_date is None:
        sla_data = db.query(
            func.avg(GuruDailyCallData.sla)
        ).scalar() or 0
    else:
        sla_data = db.query(
            func.avg(GuruDailyCallData.sla)
        ).filter(
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0
    return sla_data


def get_average_wait_time(db: Session, start_date, end_date):
    """Endpoint to retrieve average wait time for calls."""
    if start_date is None:
        avg_wait_time = db.query(func.avg(
        GuruDailyCallData.avg_wait_time)).scalar() or 0
    else:
        avg_wait_time = db.query(func.avg(
            GuruDailyCallData.avg_wait_time
        )).filter(
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0
    return avg_wait_time

def get_max_wait_time(db: Session, start_date, end_date):
    """Endpoint to retrieve max wait time for calls."""
    if start_date is None:
        
        max_wait_time = db.query(func.max(GuruDailyCallData.max_wait_time)).scalar() or 0
    else:
        max_wait_time = db.query(func.max(GuruDailyCallData.max_wait_time)).filter(
        GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0
    return max_wait_time


def get_talk_time(db: Session, start_date, end_date):
    """Endpoint to retrieve average wait time for calls."""
    if start_date is None:
        avg_talk_time = db.query(func.avg(
            GuruDailyCallData.total_talk_time
        )).scalar() or 0
    else:
        avg_talk_time = db.query(func.avg(
            GuruDailyCallData.total_talk_time
        )).filter(
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0
    return avg_talk_time

def get_inbound_after_call(db: Session, start_date, end_date):
    """Endpoint to retrieve average wait time for calls."""
    if start_date is None:
        after_call = db.query(func.sum(
        GuruDailyCallData.inbound_after_call
        )).scalar() or 0
    else:
        after_call = db.query(func.sum(
            GuruDailyCallData.inbound_after_call
        )).filter(
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0
    return after_call


@router.get("/call_overview")
async def get_calls(
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve calls data from the database."""
    
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
    
    if start_date is None:
        
        calls = db.query(GuruDailyCallData).filter(
            GuruDailyCallData.date.between(start_date, end_date)
        ).all()
        total_calls = db.query(func.sum(GuruDailyCallData.total_calls)).scalar() or 0
        total_answered_calls = db.query(func.sum(GuruDailyCallData.answered_calls)).scalar() or 0
        asr = db.query(
            func.avg(GuruDailyCallData.asr)
        ).scalar() or 0
        total_call_reasons = db.query(func.sum(GuruCallReason.total_calls)).scalar() or 0
        # asr = (total_answered_calls / total_calls) * 100 if total_calls > 0 else 0
        avg_handling_time = db.query(func.avg(
            GuruDailyCallData.avg_handling_time
        )).scalar()
        dropped_calls = db.query(func.sum(
            GuruDailyCallData.dropped_calls
        )).scalar()
        
        
        # Graph
        weekday_data = db.query(
        GuruDailyCallData.weekday.label("weekday"),  # Group by weekday
        func.sum(GuruDailyCallData.total_calls).label("total_calls"),
        func.sum(GuruDailyCallData.answered_calls).label("answered_calls"),
        func.avg(GuruDailyCallData.avg_wait_time).label("avg_wait_time"),
        func.max(GuruDailyCallData.max_wait_time).label("max_wait_time"),
        func.avg(GuruDailyCallData.avg_handling_time).label("avg_handling_time"),
        func.avg(GuruDailyCallData.sla).label("sla"),
        func.sum(GuruDailyCallData.dropped_calls).label("dropped_calls")
        ).group_by(
            GuruDailyCallData.weekday
        ).all()
    else:
        calls = db.query(GuruDailyCallData).filter(
        GuruDailyCallData.date.between(start_date, end_date)
        ).all()
        total_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0
        total_answered_calls = db.query(func.sum(GuruDailyCallData.answered_calls)).filter(
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0
        asr = db.query(
            func.avg(GuruDailyCallData.asr)).filter(
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0
        total_call_reasons = db.query(func.sum(GuruCallReason.total_calls)).filter(
            GuruCallReason.date.between(start_date, end_date)
        ).scalar() or 0
        # asr = (total_answered_calls / total_calls) * 100 if total_calls > 0 else 0
        avg_handling_time = db.query(func.avg(
            GuruDailyCallData.avg_handling_time
        )).filter(
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar()
        dropped_calls = db.query(func.sum(
            GuruDailyCallData.dropped_calls
        )).filter(
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar()
        
        #Graph data
        weekday_data = db.query(
            GuruDailyCallData.weekday.label("weekday"),  # Group by weekday
            func.sum(GuruDailyCallData.total_calls).label("total_calls"),
            func.sum(GuruDailyCallData.answered_calls).label("answered_calls"),
            func.avg(GuruDailyCallData.avg_wait_time).label("avg_wait_time"),
            func.max(GuruDailyCallData.max_wait_time).label("max_wait_time"),
            func.avg(GuruDailyCallData.avg_handling_time).label("avg_handling_time"),
            func.avg(GuruDailyCallData.sla).label("sla"),
            func.sum(GuruDailyCallData.dropped_calls).label("dropped_calls")
            ).filter(
                GuruDailyCallData.date.between(start_date, end_date)  # Filter by date range
            ).group_by(
                GuruDailyCallData.weekday
            ).all()
            
    # Format the result
    result = []
    for row in weekday_data:
        if row.weekday is not None:  # Ensure weekday is not None
            total_calls = int(row.total_calls or 0)
            print("Total calls: ", total_calls)
            answered_calls = int(row.answered_calls or 0)
            print("Answered calls: ", answered_calls)
            asr = (answered_calls / total_calls) * 100 if total_calls > 0 else 0
            result.append({
                "call metrics":{
                    "weekday": row.weekday,  # Convert weekday number to name
                    "total_calls": total_calls,
                    "answered_calls": answered_calls,
                    "dropped_calls": int(row.dropped_calls or 0),
                },
                "Time metrics":{
                    "weekday": row.weekday,
                    "avg_wait_time_sec": round(row.avg_wait_time or 0, 2),
                    "max_wait_time_sec": round(row.max_wait_time or 0, 2),
                    "avg_handling_time": round(row.avg_handling_time or 0, 2),
                },
                "% metrics":{
                    "weekday": row.weekday,
                    "sla_percent": round(row.sla or 0, 2),
                    "asr": round(asr, 2)},
            })
    
    return {
        "total_calls": total_calls, 
        "total_call_reasons": total_call_reasons, 
        "asr": round(asr, 2),
        "SLA":round(get_sla_percentage(db, start_date=start_date, end_date=end_date), 2),
        "avg wait time": round(get_average_wait_time(db, start_date=start_date, end_date=end_date), 2),
        "max. wait time": round(get_max_wait_time(db, start_date=start_date, end_date=end_date), 2),
        "After call work time": round(get_inbound_after_call(db, start_date=start_date, end_date=end_date), 2),
        "avg handling time": round(avg_handling_time or 0, 2),
        "Dropped calls": int(dropped_calls or 0),
        "Daily Call Volume": result
        
    }

@router.get("/calls_sub_kpis")
async def get_calls_sub_kpis(
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    start_date, end_date = get_date_range("yesterday")
    prev_start_date, prev_end_date = get_date_range("last_week")
    
    # Current KPIs
    total_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.date.between(start_date, end_date)
    ).scalar() or 0
    total_answered_calls = db.query(func.sum(GuruDailyCallData.answered_calls)).filter(
        GuruDailyCallData.date.between(start_date, end_date)
    ).scalar() or 0
    asr = db.query(
        func.avg(GuruDailyCallData.asr)).filter(
        GuruDailyCallData.date.between(start_date, end_date)
    ).scalar() or 0
    total_call_reasons = db.query(func.sum(GuruCallReason.total_calls)).filter(
        GuruCallReason.date.between(start_date, end_date)
    ).scalar() or 0
    # asr = (total_answered_calls / total_calls) * 100 if total_calls > 0 else 0
    avg_handling_time = db.query(func.avg(
        GuruDailyCallData.avg_handling_time
    )).filter(
        GuruDailyCallData.date.between(start_date, end_date)
    ).scalar()
    dropped_calls = db.query(func.sum(
        GuruDailyCallData.dropped_calls
    )).filter(
        GuruDailyCallData.date.between(start_date, end_date)
    ).scalar()
    
    # Previous Week KPIs
    prev_total_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
        GuruDailyCallData.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    prev_total_answered_calls = db.query(func.sum(GuruDailyCallData.answered_calls)).filter(
        GuruDailyCallData.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    prev_asr = db.query(
        func.avg(GuruDailyCallData.asr)).filter(
        GuruDailyCallData.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    prev_total_call_reasons = db.query(func.sum(GuruCallReason.total_calls)).filter(
        GuruCallReason.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    prev_avg_handling_time = db.query(func.avg(
        GuruDailyCallData.avg_handling_time
    )).filter(
        GuruDailyCallData.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    prev_dropped_calls = db.query(func.sum(
        GuruDailyCallData.dropped_calls
    )).filter(
        GuruDailyCallData.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    return {
        "total_calls": total_calls, 
        "total_calls_change": calculate_percentage_change(total_calls, prev_total_calls),
        "total_call_reasons": total_call_reasons, 
        "total_call_reasons_change": calculate_percentage_change(total_call_reasons, prev_total_call_reasons), 
        "asr": round(asr, 2),
        "asr_change": calculate_percentage_change(asr, prev_asr),
        "SLA":round(get_sla_percentage(db, start_date=start_date, end_date=end_date), 2),
        "SLA_change":calculate_percentage_change(get_sla_percentage(db, start_date=start_date, end_date=end_date), get_sla_percentage(db, start_date=prev_start_date, end_date=prev_end_date)),
        "avg wait time": round(get_average_wait_time(db, start_date=start_date, end_date=end_date), 2),
        "avg wait time_change":calculate_percentage_change(get_average_wait_time(db, start_date=start_date, end_date=end_date), get_average_wait_time(db, start_date=prev_start_date, end_date=prev_end_date)),
        "max. wait time": round(get_max_wait_time(db, start_date=start_date, end_date=end_date), 2),
        "max. wait time_change":calculate_percentage_change(get_max_wait_time(db, start_date=start_date, end_date=end_date), get_max_wait_time(db, start_date=prev_start_date, end_date=prev_end_date)),
        "After call work time": round(get_inbound_after_call(db, start_date=start_date, end_date=end_date), 2),
        "After call work time_change":calculate_percentage_change(get_inbound_after_call(db, start_date=start_date, end_date=end_date), get_inbound_after_call(db, start_date=prev_start_date, end_date=prev_end_date)),
        "avg handling time": round(avg_handling_time or 0, 2),
        "avg_handling_time_change": calculate_percentage_change(avg_handling_time or 0, prev_avg_handling_time or 1),
        "Dropped calls": int(dropped_calls or 0),
        "Dropped calls_change": calculate_percentage_change(dropped_calls or 0, prev_dropped_calls or 1),
        }
    
@router.get("/call_performance")
async def get_call_performance(
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve queue-wise calls KPIs from the database with date filtering."""
    
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

    # Get date range based on filter_type
    start_date, end_date = get_date_range(filter_type)

    # Query total calls by queue with date filtering
    if start_date is None:
        # Calls breakdown
        guru_sales_data = db.query(
        func.sum(GuruCallReason.guru_sales)
        ).scalar() or 0

        cb_sales = db.query(
            func.sum(GuruCallReason.cb_sales)
        ).scalar() or 0

        guru_service = db.query(
            func.sum(GuruCallReason.guru_service)
        ).scalar() or 0

        guru_wrong_calls = db.query(
            func.sum(GuruCallReason.guru_wrong)
        ).scalar() or 0

        cb_wrong_calls = db.query(
            func.sum(GuruCallReason.cb_wrong_call)
        ).scalar() or 0

        others = db.query(
            func.sum(GuruCallReason.other_guru)
        ).scalar() or 0
        
        # Calls by queue
        guru_service_at_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
        GuruDailyCallData.queue_name == "Guru_ServiceAT"
        ).scalar() or 0

        guru_service_de_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceDE"
        ).scalar() or 0

        guru_service_decb_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceDE_CB"
        ).scalar() or 0
        
        guru_service_ch_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Guru Service_CH"
        ).scalar() or 0
        
        guru_serviceat_cb_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceAT_CB"
        ).scalar() or 0

        urlaubsguru_at_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru AT"
        ).scalar() or 0

        urlaubsguru_de_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru DE"
        ).scalar() or 0

        urlaubsguru_cbat_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru_CB_AT"
        ).scalar() or 0

        urlaubsguru_cbde_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru_CB_DE"
        ).scalar() or 0


        # Query average handling times by queue with date filtering
        guru_service_at_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceAT"
        ).scalar() or 0

        guru_service_de_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceDE"
        ).scalar() or 0

        guru_service_decb_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceDE_CB"
        ).scalar() or 0

        urlaubsguru_at_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru AT"
        ).scalar() or 0

        urlaubsguru_de_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru DE"
        ).scalar() or 0

        urlaubsguru_cbat_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru_CB_AT"
        ).scalar() or 0

        urlaubsguru_cbde_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru_CB_DE"
        ).scalar() or 0

        guru_service_ch_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Guru Service_CH"
        ).scalar() or 0
        
        guru_serviceat_cb_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceAT_CB"
        ).scalar() or 0

    else:
        # Calls breakdown
        guru_sales_data = db.query(
            func.sum(GuruCallReason.guru_sales)
        ).filter(
            GuruCallReason.date.between(start_date, end_date)  # Apply date filter
        ).scalar() or 0

        cb_sales = db.query(
            func.sum(GuruCallReason.cb_sales)
        ).filter(
            GuruCallReason.date.between(start_date, end_date)  # Apply date filter
        ).scalar() or 0

        guru_service = db.query(
            func.sum(GuruCallReason.guru_service)
        ).filter(
            GuruCallReason.date.between(start_date, end_date)  # Apply date filter
        ).scalar() or 0

        guru_wrong_calls = db.query(
            func.sum(GuruCallReason.guru_wrong)
        ).filter(
            GuruCallReason.date.between(start_date, end_date)  # Apply date filter
        ).scalar() or 0

        cb_wrong_calls = db.query(
            func.sum(GuruCallReason.cb_wrong_call)
        ).filter(
            GuruCallReason.date.between(start_date, end_date)  # Apply date filter
        ).scalar() or 0

        others = db.query(
            func.sum(GuruCallReason.other_guru)
        ).filter(
            GuruCallReason.date.between(start_date, end_date)  # Apply date filter
        ).scalar() or 0
        
        # Calls by queue
        guru_service_at_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceAT",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        guru_service_de_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceDE",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        guru_service_decb_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceDE_CB",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0
        
        guru_service_ch_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Guru Service_CH",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0
        
        guru_serviceat_cb_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceAT_CB",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        urlaubsguru_at_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru AT",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        urlaubsguru_de_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru DE",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        urlaubsguru_cbat_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru_CB_AT",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        urlaubsguru_cbde_calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru_CB_DE",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0


        # Query average handling times by queue with date filtering
        guru_service_at_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceAT",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        guru_service_de_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceDE",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        guru_service_decb_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceDE_CB",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        urlaubsguru_at_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru AT",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        urlaubsguru_de_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru DE",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        urlaubsguru_cbat_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru_CB_AT",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        urlaubsguru_cbde_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Urlaubsguru_CB_DE",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

        guru_service_ch_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Guru Service_CH",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0
        
        guru_serviceat_cb_aht = db.query(func.avg(GuruDailyCallData.avg_handling_time)).filter(
            GuruDailyCallData.queue_name == "Guru_ServiceAT_CB",
            GuruDailyCallData.date.between(start_date, end_date)
        ).scalar() or 0

    return {
        "Call Reasons Breakdown": {
            "cb_sales": cb_sales,
            "guru_sales": guru_sales_data,
            "guru_service": guru_service,
            "wrong_calls": int(guru_wrong_calls + cb_wrong_calls),
            "others": others
        }, 
        "Call By queue":{
            "Guru ServiceAT Calls": guru_service_at_calls,
            "Guru ServiceDE Calls": guru_service_de_calls,
            "Guru ServiceAT_CB Calls": guru_serviceat_cb_calls,
            "Guru ServiceDECB Calls": guru_service_decb_calls,
            "Guru ServiceCH Calls": guru_service_ch_calls,
            "Urlaubsguru AT Calls": urlaubsguru_at_calls,
            "Urlaubsguru DE Calls": urlaubsguru_de_calls,
            "Urlaubsguru CB AT Calls": urlaubsguru_cbat_calls,
            "Urlaubsguru CB DE Calls": urlaubsguru_cbde_calls,
            "Guru ServiceAT AHT": round(guru_service_at_aht, 2),
            "Guru ServiceDE AHT": round(guru_service_de_aht, 2),
            "Guru ServiceAT_CB AHT": round(guru_serviceat_cb_aht),
            "Guru ServiceDECB AHT": round(guru_service_decb_aht, 2),
            "Guru ServiceCH AHT": round(guru_service_ch_aht, 2),
            "Urlaubsguru AT AHT": round(urlaubsguru_at_aht, 2),
            "Urlaubsguru DE AHT": round(urlaubsguru_de_aht, 2),
            "Urlaubsguru CB AT AHT": round(urlaubsguru_cbat_aht, 2),
            "Urlaubsguru CB DE AHT": round(urlaubsguru_cbde_aht, 2)
            }
    }
    