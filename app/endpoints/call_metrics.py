from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.models.models import (GuruCallReason, QueueStatistics, Permission, User)
from app.database.db.db_connection import SessionLocal,  get_db
from sqlalchemy import func, or_
from app.database.scehmas import schemas
from app.database.auth import oauth2
from app.src.utils import domains_checker, calculate_percentage_change, validate_user_and_date_permissions, get_date_rng_subkpis
from datetime import date
from typing import Optional
from datetime import timedelta

router = APIRouter(
    tags=["Call APIS"]
)

def get_sla_percentage(query, start_date, end_date):
    """Endpoint to retrieve sla% per queue."""
    if start_date is None:
        sla_data = query.with_entities(
            func.avg(QueueStatistics.sla_20_20)
        ).scalar() or 0
    else:
        sla_data = query.with_entities(
            func.avg(QueueStatistics.sla_20_20)
        ).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
    return sla_data


def get_average_wait_time(query, start_date, end_date):
    """Endpoint to retrieve average wait time for calls."""
    if start_date is None:
        avg_wait_time = query.with_entities(func.avg(
        QueueStatistics.avg_wait_time)).scalar() or 0
    else:
        avg_wait_time = query.with_entities(func.avg(
            QueueStatistics.avg_wait_time
        )).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
    return avg_wait_time

def get_max_wait_time(query, start_date, end_date):
    """Endpoint to retrieve max wait time for calls."""
    if start_date is None:
        
        max_wait_time = query.with_entities(func.max(QueueStatistics.max_wait_time)).scalar() or 0
    else:
        max_wait_time = query.with_entities(func.max(QueueStatistics.max_wait_time)).filter(
        QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
    return max_wait_time


def get_talk_time(query, start_date, end_date):
    """Endpoint to retrieve average wait time for calls."""
    if start_date is None:
        avg_talk_time = query.with_entities(func.avg(
            QueueStatistics.total_outbound_talk_time_destination
        )).scalar() or 0
    else:
        avg_talk_time = query.with_entities(func.avg(
            QueueStatistics.total_outbound_talk_time_destination
        )).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
    return avg_talk_time

def get_inbound_after_call(query, start_date, end_date):
    """Endpoint to retrieve average wait time for calls."""
    if start_date is None:
        after_call = query.with_entities(func.avg(
        QueueStatistics.avg_handling_time_inbound
        )).scalar() or 0
    else:
        after_call = query.with_entities(func.avg(
            QueueStatistics.avg_handling_time_inbound
        )).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
    return after_call


@router.get("/call_overview")
async def get_calls(
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
    company: str = "all",
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    
    """Endpoint to retrieve calls data from the database."""
    # User info
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    # Calculate the allowed date range based on the user's permissions
    start_date, end_date = validate_user_and_date_permissions(db=db, current_user=current_user, start_date=start_date, end_date=end_date, include_all=include_all)
    
    # Determine user access level
    email_filter = current_user.get("email")
    # email_contains_5vflug = "5vorflug" in email_filter
    # email_contains_bild = "bild" in email_filter
    is_guru_email = "urlaubsguru" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    filters = []
    # Filtering Logic
    if is_admin_or_employee or is_guru_email:
        if "5vorflug" in company:
            query = db.query(QueueStatistics).filter(
            QueueStatistics.queue_name.like("%5vorFlug%")  
        )
        elif "Urlaubsguru" in company:
            query = db.query(QueueStatistics).filter(
            QueueStatistics.queue_name.notlike("%5vorFlug%"),
            QueueStatistics.queue_name.notlike("%BILD%")
            )
        elif "Bild" in company:
            query = db.query(QueueStatistics).filter(
            QueueStatistics.queue_name.like("%BILD%")  
        )
        else:
            query = db.query(QueueStatistics)
        total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
        print("excecuted for admin or guru")
    else:
        filters = domains_checker(db, user.id, filter_5vf="5vorFlug", filter_bild="BILD")
        # print("Filters: ", filters)
        if filters:
            query = db.query(QueueStatistics).filter(or_(*filters))
            total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
        else:
            query = db.query(QueueStatistics)
            total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
    
    if start_date is None:
        # calls = db.query(QueueStatistics).filter(
        #     QueueStatistics.date.between(start_date, end_date)
        # ).all()
        calls = query.with_entities(func.sum(QueueStatistics.calls)).scalar() or 0
        # total_answered_calls = db.query(func.sum(QueueStatistics.answered_calls)).scalar() or 0
        asr = query.with_entities(
            func.avg(QueueStatistics.asr)
        ).scalar() or 0
        total_call_reasons = total_call_reasons_query.scalar() or 0 if total_call_reasons_query else 0
        # asr = (total_answered_calls / total_calls) * 100 if total_calls > 0 else 0
        avg_handling_time = query.with_entities(func.avg(
            QueueStatistics.avg_handling_time_inbound
        )).scalar()
        dropped_calls = query.with_entities(func.sum(
            QueueStatistics.abandoned_before_answer
        )).scalar()
        
        
        # Graph
        weekday_data = query.with_entities(
        QueueStatistics.weekday.label("weekday"),  # Group by weekday
        func.sum(QueueStatistics.calls).label("total_calls"),
        func.sum(QueueStatistics.accepted).label("answered_calls"),
        func.avg(QueueStatistics.avg_wait_time).label("avg_wait_time"),
        func.max(QueueStatistics.max_wait_time).label("max_wait_time"),
        func.avg(QueueStatistics.avg_handling_time_inbound).label("avg_handling_time"),
        func.avg(QueueStatistics.sla_20_20).label("sla"),
        func.sum(QueueStatistics.abandoned_before_answer).label("dropped_calls")
        ).group_by(
            QueueStatistics.weekday
        ).all()
    else:
        # calls = db.query(QueueStatistics).filter(
        # QueueStatistics.date.between(start_date, end_date)
        # ).all()
        calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
        # total_answered_calls = db.query(func.sum(QueueStatistics.accepted)).filter(
        #     QueueStatistics.date.between(start_date, end_date)
        # ).scalar() or 0
        asr = query.with_entities(
            func.avg(QueueStatistics.asr)).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
        total_call_reasons = total_call_reasons_query.filter(
            GuruCallReason.date.between(start_date, end_date)
        ).scalar() or 0 if total_call_reasons_query else 0
        # asr = (total_answered_calls / total_calls) * 100 if total_calls > 0 else 0
        avg_handling_time = query.with_entities(func.avg(
            QueueStatistics.avg_handling_time_inbound
        )).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar()
        dropped_calls = query.with_entities(func.sum(
            QueueStatistics.abandoned_before_answer
        )).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar()
        
        #Graph data
        weekday_data = query.with_entities(
        QueueStatistics.weekday.label("weekday"),  # Group by weekday
            func.sum(QueueStatistics.calls).label("total_calls"),
            func.sum(QueueStatistics.accepted).label("answered_calls"),
            func.avg(QueueStatistics.avg_wait_time).label("avg_wait_time"),
            func.max(QueueStatistics.max_wait_time).label("max_wait_time"),
            func.avg(QueueStatistics.avg_handling_time_inbound).label("avg_handling_time"),
            func.avg(QueueStatistics.sla_20_20).label("sla"),
            func.sum(QueueStatistics.abandoned_before_answer).label("dropped_calls")
        ).filter(
                QueueStatistics.date.between(start_date, end_date)  # Filter by date range
            ).group_by(
                QueueStatistics.weekday
            ).all()
            
    # Format the result
    result = []
    
    for row in weekday_data:
        if row.weekday is not None:  # Ensure weekday is not None
            total_calls = int(row.total_calls or 0)
            # print("Total calls: ", total_calls)
            answered_calls = int(row.answered_calls or 0)
            # print("Answered calls: ", answered_calls)
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
                    "avg_wait_time_sec": round((row.avg_wait_time)/60 or 0, 2),
                    "max_wait_time_sec": round((row.max_wait_time)/60 or 0, 2),
                    "avg_handling_time": round((row.avg_handling_time)/60 or 0, 2),
                },
                "% metrics":{
                    "weekday": row.weekday,
                    "sla_percent": round(row.sla or 0, 2),
                    "asr": round(asr, 2)},
            })
    
    return {
        "total_calls": calls, 
        "total_call_reasons": total_call_reasons, 
        "asr": round(asr, 2),
        "SLA":round(get_sla_percentage(query, start_date=start_date, end_date=end_date), 2),
        "avg wait time (min)": round(get_average_wait_time(query, start_date=start_date, end_date=end_date) / 60, 2),
        "max. wait time (min)": round(get_max_wait_time(query, start_date=start_date, end_date=end_date) / 60, 2),
        "After call work time (min)": round(get_inbound_after_call(query, start_date=start_date, end_date=end_date) / 60, 2),
        "avg handling time (min)": round((avg_handling_time or 0) / 60, 2),
        "Dropped calls": int(dropped_calls or 0),
        "Daily Call Volume": result  
    }

@router.get("/calls_sub_kpis")
async def get_calls_sub_kpis(
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
    company: str = "all",
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    # User and Permission Validation
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    # Determine user access level
    email_filter = current_user.get("email")
    # email_contains_5vflug = "5vorflug" in email_filter
    # email_contains_bild = "bild" in email_filter
    is_guru_email = "urlaubsguru" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    filters = []
    # Filtering Logic
    if is_admin_or_employee or is_guru_email:
        if "5vorflug" in company:
            query = db.query(QueueStatistics).filter(
            QueueStatistics.queue_name.like("%5vorFlug%")  
        )
        elif "Urlaubsguru" in company:
            query = db.query(QueueStatistics).filter(
            QueueStatistics.queue_name.notlike("%5vorFlug%"),
            QueueStatistics.queue_name.notlike("%BILD%")
            )
        elif "Bild" in company:
            query = db.query(QueueStatistics).filter(
            QueueStatistics.queue_name.like("%BILD%")  
        )
        else:
            query = db.query(QueueStatistics)
        total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
        print("excecuted for admin or guru")
    else:
        filters = domains_checker(db, user.id, filter_5vf="5vorFlug", filter_bild="BILD")
        # print("Filters: ", filters)
        if filters:
            query = db.query(QueueStatistics).filter(or_(*filters))
            total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
        else:
            query = db.query(QueueStatistics)
            total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))

    # start_date, end_date = get_date_subkpis("yesterday")
    # prev_start_date, prev_end_date = get_date_subkpis("last_week")
    start_date, end_date, prev_start_date, prev_end_date = get_date_rng_subkpis(db=db, current_user=current_user, start_date=start_date, end_date=end_date)
    # print("dates:", start_date, end_date, prev_start_date, prev_end_date)
    # prev_start_date, prev_end_date = get_date_subkpis("last_week")
    
    # Current KPIs
    total_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
        QueueStatistics.date.between(start_date, end_date)
    ).scalar() or 0
    total_answered_calls = query.with_entities(func.sum(QueueStatistics.accepted)).filter(
        QueueStatistics.date.between(start_date, end_date)
    ).scalar() or 0
    asr = query.with_entities(
        func.avg(QueueStatistics.asr)).filter(
        QueueStatistics.date.between(start_date, end_date)
    ).scalar() or 0
    # total_call_reasons = query.with_entities(func.sum(GuruCallReason.total_calls)).filter(
    #     GuruCallReason.date.between(start_date, end_date)
    # ).scalar() or 0
    # asr = (total_answered_calls / total_calls) * 100 if total_calls > 0 else 0
    avg_handling_time = query.with_entities(func.avg(
        QueueStatistics.avg_handling_time_inbound
    )).filter(
        QueueStatistics.date.between(start_date, end_date)
    ).scalar()
    dropped_calls = query.with_entities(func.sum(
        QueueStatistics.abandoned_before_answer
    )).filter(
        QueueStatistics.date.between(start_date, end_date)
    ).scalar()
    
    # Previous Week KPIs
    prev_total_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
        QueueStatistics.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    prev_total_answered_calls = query.with_entities(func.sum(QueueStatistics.accepted)).filter(
        QueueStatistics.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    prev_asr = query.with_entities(
        func.avg(QueueStatistics.asr)).filter(
        QueueStatistics.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    # prev_total_call_reasons = query.with_entities(func.sum(GuruCallReason.total_calls)).filter(
    #     GuruCallReason.date.between(prev_start_date, prev_end_date)
    # ).scalar() or 0
    prev_avg_handling_time = query.with_entities(func.avg(
        QueueStatistics.avg_handling_time_inbound
    )).filter(
        QueueStatistics.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    prev_dropped_calls = query.with_entities(func.sum(
        QueueStatistics.abandoned_before_answer
    )).filter(
        QueueStatistics.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    return {
        "total_calls": total_calls, 
        # "pre_total_calls": prev_total_calls, 
        "total_calls_change": calculate_percentage_change(total_calls, prev_total_calls),
        # "total_call_reasons": total_call_reasons, 
        # "total_call_reasons_change": calculate_percentage_change(total_call_reasons, prev_total_call_reasons), 
        "asr": round(asr, 2),
        # "prev_asr": round(prev_asr, 2),
        "asr_change": calculate_percentage_change(asr, prev_asr),
        "SLA":round(get_sla_percentage(query, start_date=start_date, end_date=end_date), 2),
        # "Prev SLA":round(get_sla_percentage(query, start_date=prev_start_date, end_date=prev_end_date), 2),
        "SLA_change":calculate_percentage_change(get_sla_percentage(query, start_date=start_date, end_date=end_date), get_sla_percentage(query, start_date=prev_start_date, end_date=prev_end_date)),
        "avg wait time": round(get_average_wait_time(query, start_date=start_date, end_date=end_date), 2),
        "avg wait time_change":calculate_percentage_change(get_average_wait_time(query, start_date=start_date, end_date=end_date), get_average_wait_time(query, start_date=prev_start_date, end_date=prev_end_date)),
        "max. wait time": round(get_max_wait_time(query, start_date=start_date, end_date=end_date), 2),
        "max. wait time_change":calculate_percentage_change(get_max_wait_time(query, start_date=start_date, end_date=end_date), get_max_wait_time(query, start_date=prev_start_date, end_date=prev_end_date)),
        "After call work time": round(get_inbound_after_call(query, start_date=start_date, end_date=end_date), 2),
        "After call work time_change":calculate_percentage_change(get_inbound_after_call(query, start_date=start_date, end_date=end_date), get_inbound_after_call(query, start_date=prev_start_date, end_date=prev_end_date)),
        "avg handling time": round(avg_handling_time or 0, 2),
        "avg_handling_time_change": calculate_percentage_change(avg_handling_time or 0, prev_avg_handling_time or 1),
        "Dropped calls": int(dropped_calls or 0),
        "Dropped calls_change": calculate_percentage_change(dropped_calls or 0, prev_dropped_calls or 1),
        }

@router.get("/call_performance")
async def get_call_performance(
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
    company: str = "all",
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)
):
    """Endpoint to retrieve queue-wise calls KPIs from the database with date filtering."""
    # User info
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    # Calculate the allowed date range based on the user's permissions
    start_date, end_date = validate_user_and_date_permissions(db=db, current_user=current_user, start_date=start_date, end_date=end_date, include_all=include_all)
    # Determine user access level
    email_filter = current_user.get("email")
    # email_contains_5vflug = "5vorflug" in email_filter
    # email_contains_bild = "bild" in email_filter
    is_guru_email = "urlaubsguru" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    filters=[]        
    def safe_sum_query(query, column=QueueStatistics.calls):
        """Safely execute sum query with fallback to 0"""
        try:
            return query.with_entities(func.sum(column)).scalar() or 0
        except Exception:
            return 0
    
    def safe_avg_query(query, column=QueueStatistics.avg_handling_time_inbound):
        """Safely execute average query with fallback to 0"""
        try:
            return query.with_entities(func.avg(column)).scalar() or 0
        except Exception:
            return 0
    
    def get_call_reason_sum(column_name,start_date, end_date):
        """Safely get sum of call reasons"""
        query = db.query(func.sum(getattr(GuruCallReason, column_name)))
        if start_date is None:
            # print(start_date, end_date)
            query = query
        else:
            query = query.filter(GuruCallReason.date.between(start_date, end_date))
        return query.scalar() or 0
    
    def filter_query_by_date(query, date_filter=True):
        """Apply date filtering to a query if required"""
        return query.filter(QueueStatistics.date.between(start_date, end_date)) if date_filter and start_date and end_date else query
    
    # Base query setup
    if is_admin_or_employee or is_guru_email:
        if "5vorflug" in company:
            query = db.query(QueueStatistics).filter(
            QueueStatistics.queue_name.like("%5vorFlug%")  
        )
        elif "Urlaubsguru" in company:
            query = db.query(QueueStatistics).filter(
            QueueStatistics.queue_name.notlike("%5vorFlug%"),
            QueueStatistics.queue_name.notlike("%BILD%")
            )
        elif "Bild" in company:
            query = db.query(QueueStatistics).filter(
            QueueStatistics.queue_name.like("%BILD%")  
        )
        else:
            query = db.query(QueueStatistics)
        
        # Call Reasons Breakdown
        call_reasons = {
            "cb_sales": get_call_reason_sum('cb_sales', start_date=start_date, end_date=end_date),
            "guru_sales": get_call_reason_sum('guru_sales', start_date=start_date, end_date=end_date),
            "guru_service": get_call_reason_sum('guru_service', start_date=start_date, end_date=end_date),
            "wrong_calls": get_call_reason_sum('guru_wrong', start_date=start_date, end_date=end_date) + get_call_reason_sum('cb_wrong_call', start_date=start_date, end_date=end_date),
            "others": get_call_reason_sum('other_guru', start_date=start_date, end_date=end_date)
        }
        
        # Prepare queue-specific queries
        # queues = [
        #     ("Guru_ServiceAT", "Guru ServiceAT"),
        #     ("Guru_ServiceDE", "Guru ServiceDE"),
        #     ("Guru_ServiceAT_CB", "Guru ServiceAT_CB"),
        #     ("Guru_ServiceDE_CB", "Guru ServiceDECB"),
        #     ("Guru Service_CH", "Guru ServiceCH"),
        #     ("Urlaubsguru AT", "Urlaubsguru AT"),
        #     ("Urlaubsguru DE", "Urlaubsguru DE"),
        #     ("Urlaubsguru_CB_AT", "Urlaubsguru CB AT"),
        #     ("Urlaubsguru_CB_DE", "Urlaubsguru CB DE"),
        #     ("5vorFlugService", "5vorFlugService"),
        #     ("5vorFlugSales", "5vorFlugSales"),
        #     ("GuruBILD_Sales", "GuruBILD_Sales"),
        #     ("GuruBILD_Service", "GuruBILD_Service")
        # ]
        queues = [
            ("5vorFlug Service", "5vorFlug Service"),
            ("5vorFlug Sales", "5vorFlug Sales"),
            ("BILD Reisen Service", "BILD Reisen Service"),
            ("BILD Reisen Sales", "BILD Reisen Sales"),
            ("Holidayguru_CB_CH", "Holidayguru CB CH"),
            ("Urlaubsguru AT", "Urlaubsguru AT"),
            ("Urlaubsguru DE", "Urlaubsguru DE"),
            ("Urlaubsguru_CB_AT", "Urlaubsguru CB AT"),
            ("Urlaubsguru_CB_DE", "Urlaubsguru CB DE"),
            ("UGT Notfall", "UGT Notfall"),
            ("Urlaubsguru Service AT", "Urlaubsguru Service AT"),
            ("Urlaubsguru Service AT CB", "Urlaubsguru Service AT CB"),
            ("Urlaubsguru Service CH", "Urlaubsguru Service CH"),
            ("Urlaubsguru Service DE", "Urlaubsguru Service DE"),
            ("Urlaubsguru Service DE CB", "Urlaubsguru Service DE CB"),
            ("Holidayguru CB CH", "Holidayguru CB CH"),
            ("Urlaubsguru Service CB CH", "Urlaubsguru Service CB CH")
        ]
        
        queue_stats = {}
        for queue_name, display_name in queues:
            print(queue_name)
            queue_filter = query.filter(QueueStatistics.queue_name.like(queue_name))
            filtered_query = filter_query_by_date(queue_filter)
            
            queue_stats[f"{display_name} Calls"] = safe_sum_query(filtered_query)
            queue_stats[f"{display_name} AHT"] = round(safe_avg_query(filtered_query) / 60, 2)
            # if "5vorFlug Service" in queue_name:
            #     queue_stats[f"{display_name} Calls"] = safe_sum_query(filter_query_by_date(query.filter(QueueStatistics.queue_name == "5vorFlug Service")))
            #     queue_stats[f"{display_name} AHT"] = round(safe_avg_query(filter_query_by_date(query.filter(QueueStatistics.queue_name == "5vorFlug Service"))) / 60, 2)
                
            # elif "5vorFlug Sales" in queue_name:
            #     queue_stats[f"{display_name} Calls"] = safe_sum_query(filter_query_by_date(query.filter(QueueStatistics.queue_name == "5vorFlug Sales")))
            #     queue_stats[f"{display_name} AHT"] = round(safe_avg_query(filter_query_by_date(query.filter(QueueStatistics.queue_name == "5vorFlug Sales"))) / 60, 2)
        print("Executed admin...")
    else:
        filters = domains_checker(db, user.id, filter_5vf="5vorFlug", filter_bild="BILD")
        # print("Filters: ", filters)
        if filters:
            query = db.query(QueueStatistics).filter(or_(*filters))
            total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
        else:
            query = db.query(QueueStatistics)
            total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
            # total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
        # Call Reasons Breakdown
        call_reasons = {
            "cb_sales": get_call_reason_sum('cb_sales', start_date=start_date, end_date=end_date),
            "guru_sales": get_call_reason_sum('guru_sales', start_date=start_date, end_date=end_date),
            "guru_service": get_call_reason_sum('guru_service', start_date=start_date, end_date=end_date),
            "wrong_calls": get_call_reason_sum('guru_wrong', start_date=start_date, end_date=end_date) + get_call_reason_sum('cb_wrong_call', start_date=start_date, end_date=end_date),
            "others": get_call_reason_sum('other_guru', start_date=start_date, end_date=end_date)
        }
        
        # Prepare queue-specific queries
        # queues = [
        #     ("Urlaubsguru AT", "Guru ServiceAT"),
        #     ("Urlaubsguru DE", "Guru ServiceDE"),
        #     ("Guru_ServiceAT_CB", "Guru ServiceAT_CB"),
        #     ("Guru_ServiceDE_CB", "Guru ServiceDECB"),
        #     ("Urlaubsguru Service CH", "Urlaubsguru Service CH"),
        #     ("Urlaubsguru Service AT", "Urlaubsguru Service AT"),
        #     ("Urlaubsguru Service DE", "Urlaubsguru Service DE"),
        #     ("Urlaubsguru_CB_AT", "Urlaubsguru CB AT"),
        #     ("Urlaubsguru_CB_DE", "Urlaubsguru CB DE"),
        #     ("UGT Notfall","UGT Notfall"),
        #     ("5vorFlugService", "5vorFlugService"),
        #     ("5vorFlugSales", "5vorFlugSales"),
        #     ("BILD Reisen Sales", "BILD Reisen Sales"),
        #     ("GuruBILD_Service", "GuruBILD_Service")
        # ]
        queues = [
            ("5vorFlugService", "5vorFlug Service"),
            ("5vorFlugSales", "5vorFlug Sales"),
            ("Holidayguru_CB_CH", "Holidayguru CB CH"),
            ("Urlaubsguru AT", "Urlaubsguru AT"),
            ("Urlaubsguru DE", "Urlaubsguru DE"),
            ("Urlaubsguru_CB_AT", "Urlaubsguru CB AT"),
            ("Urlaubsguru_CB_DE", "Urlaubsguru CB DE"),
            ("UGT Notfall", "UGT Notfall"),
            ("Urlaubsguru Service AT", "Urlaubsguru Service AT"),
            ("Urlaubsguru Service AT CB", "Urlaubsguru Service AT CB"),
            ("Urlaubsguru Service CH", "Urlaubsguru Service CH"),
            ("Urlaubsguru Service DE", "Urlaubsguru Service DE"),
            ("Urlaubsguru Service DE CB", "Urlaubsguru Service DE CB"),
            ("5vorFlug Service", "5vorFlug Service"),
            ("5vorFlug Sales", "5vorFlug Sales"),
            ("BILD Reisen Service", "BILD Reisen Service"),
            ("BILD Reisen Sales", "BILD Reisen Sales"),
            ("Holidayguru CB CH", "Holidayguru CB CH"),
            ("Urlaubsguru Service CB CH", "Urlaubsguru Service CB CH")
        ]
        
        queue_stats = {}
        for queue_name, display_name in queues:
            queue_filter = query.filter(QueueStatistics.queue_name == queue_name)
            filtered_query = filter_query_by_date(queue_filter)
            
            queue_stats[f"{display_name} Calls"] = safe_sum_query(filtered_query)
            queue_stats[f"{display_name} AHT"] = round(safe_avg_query(filtered_query) / 60, 2)
            if "5vorFlugService" in queue_name:
                queue_stats[f"{display_name} Calls"] = safe_sum_query(filter_query_by_date(query.filter(QueueStatistics.queue_name == "5vorFlugService")))
                queue_stats[f"{display_name} AHT"] = round(safe_avg_query(filter_query_by_date(query.filter(QueueStatistics.queue_name == "5vorFlugService"))), 2)
                
            elif "5vorFlugSales" in queue_name:
                queue_stats[f"{display_name} Calls"] = safe_sum_query(filter_query_by_date(query.filter(QueueStatistics.queue_name == "5vorFlugSales")))
                queue_stats[f"{display_name} AHT"] = round(safe_avg_query(filter_query_by_date(query.filter(QueueStatistics.queue_name == "5vorFlugSales"))), 2)
        
    return {
        "Call Reasons Breakdown": call_reasons,
        "Call By queue": queue_stats
    }

# @router.get("/call_performance")
# async def get_call_performance(
#     filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
#     db: Session = Depends(get_db),
#     current_user: schemas.User = Depends(oauth2.get_current_user)):
#     """Endpoint to retrieve queue-wise calls KPIs from the database with date filtering."""
    
#     user = db.query(User).filter(User.email == current_user.get("email")).first() 
#     user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    
    
#     # Parse allowed filters from the permissions table
#     if user_permissions and user_permissions.date_filter:
#         # Convert the `date_filter` column (assumed to be a comma-separated string) into a set
#         allowed_filters = set(user_permissions.date_filter.split(","))
#     else:
#         # If `date_filter` is empty or no record exists, allow all filters
#         allowed_filters = {"all", "yesterday", "last_week", "last_month", "last_year"}
    
#     # Validate the requested filter
#     if filter_type not in allowed_filters:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail={
#                 "error": "Permission Denied",
#                 "message": f"The filter type '{filter_type}' is not allowed for this user.",
#                 "allowed_filters": list(allowed_filters)  # Return allowed filters to the client
#             }
#         )
        
#     # Check email for 5vFlug and apply email-based filtering
#     email_filter = current_user.get("email")
#     email_contains_5vflug = "5vorFlug" in email_filter
#     # print(email_contains_5vflug)
#     # Check if the user is an admin or employee
#     is_admin_or_employee = user.role in ["admin", "employee"]
#     # Default values for 5vorFlug calls and AHT
#     flug_service_calls_query = 0
#     flug_sales_calls_query = 0
#     flug_service_aht_query = 0
#     flug_sales_aht_query = 0
#     guru_sales_data_query = 0
#     cb_sales_query = 0
#     guru_service_query = 0
#     guru_wrong_calls_query = 0
#     cb_wrong_calls_query = 0
#     others_query = 0
#     # print("admin or employee ", is_admin_or_employee, user.role)

#     # Date range for filtering
#     start_date, end_date = get_date_subkpis(filter_type)
    
#     # Apply filtering logic
#     if is_admin_or_employee:
#         query = db.query(QueueStatistics)
#         # Calls breakdown
#         guru_sales_data_query = db.query(
#         func.sum(GuruCallReason.guru_sales)
#         ).scalar() or 0

#         cb_sales_query = db.query(
#             func.sum(GuruCallReason.cb_sales)
#         ).scalar() or 0

#         guru_service_query = db.query(
#             func.sum(GuruCallReason.guru_service)
#         ).scalar() or 0

#         guru_wrong_calls_query = db.query(
#             func.sum(GuruCallReason.guru_wrong)
#         ).scalar() or 0

#         cb_wrong_calls_query = db.query(
#             func.sum(GuruCallReason.cb_wrong_call)
#         ).scalar() or 0

#         others_query = db.query(
#             func.sum(GuruCallReason.other_guru)
#         ).scalar() or 0
#         flug_service_calls_query = db.query(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "5vorFlugService",
#         ).scalar() or 0
        
#         flug_sales_calls_query = db.query(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "5vorFlugSales",
#         ).scalar() or 0
        
#         flug_service_aht_query = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "5vorFlugService",
#         ).scalar() or 0
#         flug_sales_aht_query = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "5vorFlugSales",
#         ).scalar() or 0

#     elif email_contains_5vflug:
#         print("containss")
#         query = db.query(QueueStatistics).filter(
#             QueueStatistics.queue_name.like("%5vorFlug%")
#         )
#         # Calls breakdown
#         guru_sales_data = 0
#         cb_sales = 0
#         guru_service = 0
#         guru_wrong_calls = 0
#         cb_wrong_calls = 0
#         others = 0
        
#         flug_service_calls_query = db.query(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "5vorFlugService",
#         ).scalar() or 0
        
#         flug_sales_calls_query = db.query(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "5vorFlugSales",
#         ).scalar() or 0
        
#         flug_service_aht_query = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "5vorFlugService",
#         )
#         flug_sales_aht_query = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "5vorFlugSales",
#         )
        
#     else:
#         query = db.query(QueueStatistics).filter(QueueStatistics.queue_name.notlike("%5vorFlug%"))
#         # Calls breakdown
#         guru_sales_data_query = db.query(
#         func.sum(GuruCallReason.guru_sales)
#         ).scalar() or 0

#         cb_sales_query = db.query(
#             func.sum(GuruCallReason.cb_sales)
#         ).scalar() or 0

#         guru_service_query = db.query(
#             func.sum(GuruCallReason.guru_service)
#         ).scalar() or 0

#         guru_wrong_calls_query = db.query(
#             func.sum(GuruCallReason.guru_wrong)
#         ).scalar() or 0

#         cb_wrong_calls_query = db.query(
#             func.sum(GuruCallReason.cb_wrong_call)
#         ).scalar() or 0

#         others_query = db.query(
#             func.sum(GuruCallReason.other_guru)
#         ).scalar() or 0
        


#     # Query total calls by queue with date filtering
#     if start_date is None:
#         # Calls breakdown
#         guru_sales_data = guru_sales_data_query  if guru_sales_data_query else 0

#         cb_sales = cb_sales_query if cb_sales_query else 0
 
#         guru_service = guru_service_query if guru_service_query else 0

#         guru_wrong_calls = guru_wrong_calls_query or 0 if guru_wrong_calls_query else 0

#         cb_wrong_calls = cb_wrong_calls_query if cb_wrong_calls_query else 0

#         others = others_query if others_query else 0
#         # Calls by queue
#         guru_service_at_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#         QueueStatistics.queue_name == "Guru_ServiceAT"
#         ).scalar() or 0

#         guru_service_de_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceDE"
#         ).scalar() or 0

#         guru_service_decb_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceDE_CB"
#         ).scalar() or 0
        
#         guru_service_ch_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Guru Service_CH"
#         ).scalar() or 0
        
#         guru_serviceat_cb_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceAT_CB"
#         ).scalar() or 0

#         urlaubsguru_at_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru AT"
#         ).scalar() or 0

#         urlaubsguru_de_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru DE"
#         ).scalar() or 0

#         urlaubsguru_cbat_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru_CB_AT"
#         ).scalar() or 0

#         urlaubsguru_cbde_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru_CB_DE"
#         ).scalar() or 0

#         # Query average handling times by queue with date filtering
#         guru_service_at_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceAT"
#         ).scalar() or 0

#         guru_service_de_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceDE"
#         ).scalar() or 0

#         guru_service_decb_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceDE_CB"
#         ).scalar() or 0

#         urlaubsguru_at_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru AT"
#         ).scalar() or 0

#         urlaubsguru_de_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru DE"
#         ).scalar() or 0

#         urlaubsguru_cbat_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru_CB_AT"
#         ).scalar() or 0

#         urlaubsguru_cbde_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru_CB_DE"
#         ).scalar() or 0

#         guru_service_ch_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Guru Service_CH"
#         ).scalar() or 0
        
#         guru_serviceat_cb_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceAT_CB"
#         ).scalar() or 0
        
#         flug_service_calls = flug_service_calls_query.scalar() or 0 if flug_service_calls_query else 0
#         flug_sales_calls = flug_sales_calls_query.scalar() or 0 if flug_sales_calls_query else 0
#         flug_service_aht = flug_service_aht_query.scalar() or 0 if flug_service_aht_query else 0
#         flug_sales_aht = flug_sales_aht_query.scalar() or 0 if flug_sales_aht_query else 0

#     else:
#         # # Calls breakdown
#         # guru_sales_data = db.query(
#         #     func.sum(GuruCallReason.guru_sales)
#         # ).filter(
#         #     GuruCallReason.date.between(start_date, end_date)  # Apply date filter
#         # ).scalar() or 0

#         # Calls breakdown
#         guru_sales_data = guru_sales_data_query.filter(
#             GuruCallReason.date.between(start_date, end_date)  # Apply date filter
#         ).scalar() or 0

#         cb_sales = cb_sales_query.filter(
#             GuruCallReason.date.between(start_date, end_date)  # Apply date filter
#         ).scalar() or 0

#         guru_service = guru_service_query.filter(
#             GuruCallReason.date.between(start_date, end_date)  # Apply date filter
#         ).scalar() or 0

#         guru_wrong_calls = guru_wrong_calls_query.filter(
#             GuruCallReason.date.between(start_date, end_date)  # Apply date filter
#         ).scalar() or 0

#         cb_wrong_calls = cb_wrong_calls_query.filter(
#             GuruCallReason.date.between(start_date, end_date)  # Apply date filter
#         ).scalar() or 0

#         others = others_query.filter(
#             GuruCallReason.date.between(start_date, end_date)  # Apply date filter
#         ).scalar() or 0
        
#         # Calls by queue
#         guru_service_at_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceAT",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         guru_service_de_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceDE",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         guru_service_decb_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceDE_CB",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0
        
#         guru_service_ch_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Guru Service_CH",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0
        
#         guru_serviceat_cb_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceAT_CB",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         urlaubsguru_at_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru AT",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         urlaubsguru_de_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru DE",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         urlaubsguru_cbat_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru_CB_AT",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         urlaubsguru_cbde_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru_CB_DE",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0
        
#         flug_service_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "5vorFlugService",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0
        
#         flug_sales_calls = query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.queue_name == "5vorFlugSales",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0


#         # Query average handling times by queue with date filtering
#         guru_service_at_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceAT",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         guru_service_de_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceDE",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         guru_service_decb_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceDE_CB",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         urlaubsguru_at_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru AT",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         urlaubsguru_de_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru DE",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         urlaubsguru_cbat_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru_CB_AT",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         urlaubsguru_cbde_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Urlaubsguru_CB_DE",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#         guru_service_ch_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Guru Service_CH",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0
        
#         guru_serviceat_cb_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "Guru_ServiceAT_CB",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0
        
#         flug_service_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "5vorFlugService",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0
#         flug_sales_aht = query.with_entities(func.avg(QueueStatistics.avg_handling_time_inbound)).filter(
#             QueueStatistics.queue_name == "5vorFlugSales",
#             QueueStatistics.date.between(start_date, end_date)
#         ).scalar() or 0

#     return {
#         "Call Reasons Breakdown": {
#             "cb_sales": cb_sales,
#             "guru_sales": guru_sales_data,
#             "guru_service": guru_service,
#             "wrong_calls": int(guru_wrong_calls + cb_wrong_calls),
#             "others": others
#         }, 
#         "Call By queue":{
#             "5vorFlugService calls": flug_service_calls,
#             "5vorFlugSales calls": flug_sales_calls,
#             "Guru ServiceAT Calls": guru_service_at_calls,
#             "Guru ServiceDE Calls": guru_service_de_calls,
#             "Guru ServiceAT_CB Calls": guru_serviceat_cb_calls,
#             "Guru ServiceDECB Calls": guru_service_decb_calls,
#             "Guru ServiceCH Calls": guru_service_ch_calls,
#             "Urlaubsguru AT Calls": urlaubsguru_at_calls,
#             "Urlaubsguru DE Calls": urlaubsguru_de_calls,
#             "Urlaubsguru CB AT Calls": urlaubsguru_cbat_calls,
#             "Urlaubsguru CB DE Calls": urlaubsguru_cbde_calls,
#             "5vorFlugService AHT": flug_service_aht,
#             "5vorFlugSales AHT": flug_sales_aht,
#             "Guru ServiceAT AHT": round(guru_service_at_aht, 2),
#             "Guru ServiceDE AHT": round(guru_service_de_aht, 2),
#             "Guru ServiceAT_CB AHT": round(guru_serviceat_cb_aht),
#             "Guru ServiceDECB AHT": round(guru_service_decb_aht, 2),
#             "Guru ServiceCH AHT": round(guru_service_ch_aht, 2),
#             "Urlaubsguru AT AHT": round(urlaubsguru_at_aht, 2),
#             "Urlaubsguru DE AHT": round(urlaubsguru_de_aht, 2),
#             "Urlaubsguru CB AT AHT": round(urlaubsguru_cbat_aht, 2),
#             "Urlaubsguru CB DE AHT": round(urlaubsguru_cbde_aht, 2)
#             }
#     }
