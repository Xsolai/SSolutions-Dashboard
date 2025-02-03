from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.models.models import  EmailData, WorkflowReportGuruKF, QueueStatistics, GuruCallReason, SoftBookingKF, User, Permission, BookingData, OrderJoin
from app.database.db.db_connection import  get_db, SessionLocal
from datetime import datetime, timedelta, date
from sqlalchemy import func, or_
from collections import defaultdict
from app.database.scehmas import schemas
from app.database.auth import oauth2
from app.src.utils import domains_checker_booking, domains_checker_email, domains_checker, calculate_percentage_change, validate_user_and_date_permissions, time_formatter, get_date_rng_subkpis, time_format
from typing import Optional 
from app.src.utils_booking import validate_user_and_date_permissions_booking, calculate_percentage_change_booking, get_date_rng_subkpis_booking


router = APIRouter(
    tags=["Analytics"]
)

def format_revenue(num):
    if num >= 1_000_000:
        return f"{num / 1_000_000:.2f}M€"
    elif num >= 1_000:
        return f"{num / 1_000:.3f}€"
    else:
        return str(num)

def time_to_seconds(time_str):
    """Convert time in various formats to seconds."""
    try:
        if isinstance(time_str, tuple):
            pass
        
        if '.' in time_str[0]:
            # print("float ", time_str[0])
            return (float(time_str[0])*60)
        # print("Time str", time_str[0], time_str)

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
    
# def time_to_minutes(time):
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
#                 total_minutes = int(hours) * 60 + int(minutes)
#                 return (total_minutes, int(seconds))

#         return 0  # Return 0 if format is unrecognized
#     except Exception as e:
#         print(f"Error converting time '{time}': {e}")
#         return 0

def time_to_minutes(time):
    """Convert time in various formats to (minutes, seconds)."""
    try:
        if isinstance(time, tuple):
            return time  

        if '.' in time[0]:
            print("float ", time[0])
            minutes = int(float(time[0]))  # Convert to int minutes
            seconds = int((float(time[0]) - minutes) * 60)  # Convert fraction to seconds
            return (minutes, seconds) 

        if ':' in time[0]:
            parts = time[0].split(':')
            if len(parts) == 2:  # Format: 'mm:ss'
                dt = datetime.strptime(time[0], "%M:%S")
                return (dt.minute, dt.second)
            elif len(parts) == 3:  # Format: 'hh:mm:ss'
                hours, minutes, seconds = map(int, parts)
                total_minutes = hours * 60 + minutes
                return (total_minutes, seconds)

        return (0, 0) 
    except Exception as e:
        print(f"Error converting time '{time}': {e}")
        return (0, 0) 


@router.get("/analytics_email")
async def get_anaytics_email_data(
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
    domain:str = "all",
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve graphs data from the database with date filtering."""
    
    # User info
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    # Calculate the allowed date range based on the user's permissions
    start_date, end_date = validate_user_and_date_permissions(db=db, current_user=current_user, start_date=start_date, end_date=end_date, include_all=include_all)
    
    # Determine user access level
    email_filter = current_user.get("email")
    # email_contains_5vflug = "5vorflug" in email_filter
    # email_contains_bild = "bild" in email_filter
    # is_guru_email = "urlaubsguru" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        if "5vorflug" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like("%5vorFlug%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like("%5vorFlug%")  
            )
        elif "Urlaubsguru" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.notlike("%5vorFlug%"),
            WorkflowReportGuruKF.customer.notlike("%Bild%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.notlike("%5vorFlug%"),
            EmailData.customer.notlike("%Bild%")  
            )
        elif "Bild" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%Bild%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%Bild%")  
            )
        else:
            query = db.query(WorkflowReportGuruKF)
            email_query = db.query(EmailData)
    else:
        filters, email_filter = domains_checker_email(db, user.id, filter_5vf="5vorFlug", filter_bild="Bild")
        # print("Filters: ", filters)
        if filters:
            query = db.query(WorkflowReportGuruKF).filter(or_(*filters))
            email_query = db.query(EmailData).filter(or_(*email_filter))
        else:
            query = db.query(WorkflowReportGuruKF)
            email_query = db.query(EmailData)
            
    if domain != "all":
        query = query.filter(WorkflowReportGuruKF.customer.like(f"%{domain}%"))
        email_query = email_query.filter(EmailData.customer.like(f"%{domain}%"))
    
    # Retrieve data from database
    if start_date is None:
        # Filter data based on the interval (date) column
        email_recieved = email_query.with_entities(
            func.sum(EmailData.received)
        ).scalar() or 0

        email_answered = email_query.with_entities(
            func.sum(EmailData.sent)
        ).scalar() or 0

        new_cases = email_query.with_entities(
            func.sum(EmailData.new_cases)
        ).scalar() or 0

        email_archieved = email_query.with_entities(
            func.sum(EmailData.archived)
        ).scalar() or 0

        service_level_gross = email_query.with_entities(
            func.avg(EmailData.service_level_gross)
        ).scalar() or 0

        # new_sent = db.query(
        #     func.sum(WorkflowReportGuruKF.sent_new_message)
        # ).scalar() or 0

        processing_times = email_query.with_entities(EmailData.processing_time).all()
        dwell_times = email_query.with_entities(EmailData.dwell_time_net).all()
        

    else:
        # Filter data based on the interval (date) column
        email_recieved = email_query.with_entities(
            func.sum(EmailData.received)
        ).filter(
            EmailData.date.between(start_date, end_date)
        ).scalar() or 0

        email_answered = email_query.with_entities(
            func.sum(EmailData.sent)
        ).filter(
            EmailData.date.between(start_date, end_date)
        ).scalar() or 0

        new_cases = email_query.with_entities(
            func.sum(EmailData.new_cases)
        ).filter(
            EmailData.date.between(start_date, end_date)
        ).scalar() or 0

        email_archieved = email_query.with_entities(
            func.sum(EmailData.archived)
        ).filter(
            EmailData.date.between(start_date, end_date)
        ).scalar() or 0

        service_level_gross = email_query.with_entities(
            func.avg(EmailData.service_level_gross)
        ).filter(
            EmailData.date.between(start_date, end_date)
        ).scalar() or 0

        # new_sent = db.query(
        #     func.sum(WorkflowReportGuruKF.sent_new_message)
        # ).filter(
        #     WorkflowReportGuruKF.date.between(start_date, end_date)
        # ).scalar() or 0

        processing_times = email_query.with_entities(EmailData.processing_time).filter(
            EmailData.date.between(start_date, end_date)
        ).all()
        dwell_times = email_query.with_entities(EmailData.dwell_time_net).filter(
            EmailData.date.between(start_date, end_date)
        ).all()
    # Clean the data to extract values from tuples
    # processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
    
    total_processing_time_seconds = 0.0001
    total_processing_time_min = 0.0001
    total_dwell_time_seconds = 0.0001
    total_dwell_min = 0.0001
    total_dwell_hours = 0
    interval_data = defaultdict(float)

    processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
    dwell_times = [pt[0] if isinstance(pt, tuple) else pt for pt in dwell_times]
    # for pt in dwell_times:
    #     hours,minutes,seconds = time_format(pt)
    #     total_dwell_time_seconds += seconds
    #     total_dwell_min += minutes
    #     total_dwell_hours += hours
    # total_dwell_min += total_dwell_time_seconds // 60
    for pt in dwell_times:
        hours, minutes, seconds = time_format(pt)
        total_dwell_time_seconds += seconds
        total_dwell_min += minutes
        total_dwell_hours += hours

    # Convert extra seconds into minutes
    total_dwell_min += total_dwell_time_seconds // 60
    total_dwell_time_seconds = total_dwell_time_seconds % 60  # Keep remaining seconds

    # Convert extra minutes into hours
    total_dwell_hours += total_dwell_min // 60
    total_dwell_min = total_dwell_min % 60  # Keep remaining minutes

    for pt in processing_times:
        minutes,seconds = time_to_minutes(pt)
        total_processing_time_seconds += seconds
        total_processing_time_min += minutes
        
        # Calculating interval data
        seconds = time_to_seconds(pt)
        # print("Converted Seconds:", seconds)  # Debug print
        interval = (seconds // 600) * 10
        interval_data[interval] += seconds
    
    total_processing_time_min += total_processing_time_seconds // 60
    
    # print("Dwell min: ", total_dwell_min)

    processing_time_trend = [
        {"interval_start": f"{interval}m", "total_processing_time_sec": total}
        for interval, total in sorted(interval_data.items())
    ]
    # Calculate processing time trend with interval ranges
    processing_time_trend = [
        {
            "interval_start": f"{interval}m",
            "interval_end": f"{interval + 10}m",
            "total_processing_time_sec": f"00:{str(int(total/60)).zfill(2)}:{str(int(total % 60)).zfill(2)}"
        }
        for interval, total in sorted(interval_data.items())
    ]

    # calculating for counts 
    interval_count_data = defaultdict(int)  # Default value is int for counting occurrences

    for pt in processing_times:
        seconds = time_to_seconds(pt)
        if seconds > 0:  # Exclude 0.0 values
            interval_count = (seconds // 600) * 10  # Group into 10-minute intervals
            interval_count_data[interval_count] += 1  # Increment the count for this interval

    # processing_count_trend = [
    #     {"interval_start": f"{interval}m", "count": count}
    #     for interval, count in sorted(interval_count_data.items())
    # ]
    # Calculate processing count trend with interval ranges
    processing_count_trend = [
        {
            "interval_start": f"{interval}m",
            "interval_end": f"{interval + 10}m",
            "count": count
        }
        for interval, count in sorted(interval_count_data.items())
    ]

    return {
        "email recieved": email_recieved,
        "email sent": email_answered,
        "email new cases": new_cases,
        "email archived": email_archieved,
        "SL Gross": round(service_level_gross, 2),
        # "New Sent": new_sent,
        # "Total Dwell Time (sec)": f"{int(total_dwell_hours)}h{int(total_dwell_min)}m{int(total_dwell_time_seconds)}s" 
        # if total_processing_time_min > 1 else f"0m{int(total_processing_time_seconds)}s",
        "Total Dwell Time (sec)": time_formatter(int(total_dwell_hours/3), int(total_dwell_min/3), int(total_dwell_time_seconds/3)) if company == "all" else time_formatter(int(total_dwell_hours), int(total_dwell_min), int(total_dwell_time_seconds)),
        "Processing Time Trend in seconds": processing_time_trend,
        "Processing Count Trend": processing_count_trend
    }
    
@router.get("/analytics_email_subkpis")
async def get_anaytics_email_data_sub_kpis(
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
    domain:str = "all",
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve graphs data from the database with date filtering."""
    # User and Permission Validation
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    # Determine user access level
    email_filter = current_user.get("email")
    # email_contains_5vflug = "5vorflug" in email_filter
    # email_contains_bild = "bild" in email_filter
    is_guru_email = "urlaubsguru" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        if "5vorflug" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like("%5vorFlug%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like("%5vorFlug%")  
            )
        elif "Urlaubsguru" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.notlike("%5vorFlug%"),
            WorkflowReportGuruKF.customer.notlike("%Bild%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.notlike("%5vorFlug%"),
            EmailData.customer.notlike("%Bild%")  
            )
        elif "Bild" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%Bild%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%Bild%")  
            )
        else:
            query = db.query(WorkflowReportGuruKF)
            email_query = db.query(EmailData)
    else:
        filters, email_filter = domains_checker_email(db, user.id, filter_5vf="5vorFlug", filter_bild="Bild")
        # print("Filters: ", filters)
        if filters:
            query = db.query(WorkflowReportGuruKF).filter(or_(*filters))
            email_query = db.query(EmailData).filter(or_(*email_filter))
        else:
            query = db.query(WorkflowReportGuruKF)
            email_query = db.query(EmailData)
            
    if domain != "all":
        query = query.filter(WorkflowReportGuruKF.customer.like(f"%{domain}%"))
        email_query = email_query.filter(EmailData.customer.like(f"%{domain}%"))
    # start_date, end_date = get_date_subkpis("yesterday")
    # prev_start_date, prev_end_date = get_date_subkpis("last_week")
    start_date, end_date, prev_start_date, prev_end_date = get_date_rng_subkpis(db=db, current_user=current_user, start_date=start_date, end_date=end_date)
    print("dates:", start_date, end_date, prev_start_date, prev_end_date)
    
    # Filter data based on the interval (date) column
    email_recieved = email_query.with_entities(
        func.sum(EmailData.received)
    ).filter(
        EmailData.date.between(start_date, end_date)
    ).scalar() or 0

    email_answered = email_query.with_entities(
        func.sum(EmailData.sent)
    ).filter(
        EmailData.date.between(start_date, end_date)
    ).scalar() or 0

    email_archieved = email_query.with_entities(
        func.sum(EmailData.archived)
    ).filter(
        EmailData.date.between(start_date, end_date)
    ).scalar() or 0
    
    # Previous values to calculate the change
    prev_email_recieved = email_query.with_entities(
        func.sum(EmailData.received)
    ).filter(
        EmailData.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0

    prev_email_answered = email_query.with_entities(
        func.sum(EmailData.sent)
    ).filter(
        EmailData.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0

    prev_email_archieved = email_query.with_entities(
        func.sum(EmailData.archived)
    ).filter(
        EmailData.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
        
    return {
        "email recieved": email_recieved,
        "prev email recieved": prev_email_recieved,
        "email recieved change": calculate_percentage_change(email_answered, prev_email_recieved),
        "email answered": email_answered,
        "prev email answered": prev_email_answered, 
        "email answered change": calculate_percentage_change(email_answered, prev_email_answered),
        "email archived": email_archieved,
        "prev email archived": prev_email_archieved,
        "email archived change": calculate_percentage_change(email_archieved, prev_email_archieved),
    }


@router.get("/analytics_sales_service")
async def get_sales_and_service(
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
    domain:str = "all",
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve graphs data from the database."""
    
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
    
    db = SessionLocal()
    
    # Apply filtering logic
    if is_admin_or_employee:
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
    else:
        filters = domains_checker(db, user.id, filter_5vf="5vorFlug", filter_bild="BILD")
        # print("Filters: ", filters)
        if filters:
            query = db.query(QueueStatistics).filter(or_(*filters))
            total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
        else:
            query = db.query(QueueStatistics)
            total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))

    if domain != "all":
        query = query.filter(QueueStatistics.queue_name.like(f"%{domain}%"))
        email_query = email_query.filter(EmailData.customer.like(f"%{domain}%"))
    
    if start_date is None:
        avg_handling_time = query.with_entities(
        func.avg(
            QueueStatistics.avg_handling_time_inbound
        )
        ).scalar() or 0
        
        total_talk_time = query.with_entities(
            func.sum(
                QueueStatistics.total_outbound_talk_time_destination
            )
        ).scalar() or 0
        
        total_outbound_calls = query.with_entities(
            func.sum(
                QueueStatistics.outbound
            )
        ).scalar() or 0
        
        # Query for Sale Calls
        sale_metrics = query.with_entities(
            func.sum(QueueStatistics.offered).label("sale_calls_offered"),
            func.sum(QueueStatistics.accepted).label("sale_calls_handled"),
            func.avg(QueueStatistics.accepted / func.nullif(QueueStatistics.offered, 1) * 100).label("sale_ACC"),
            func.avg(QueueStatistics.sla_20_20).label("sale_SL"),
            func.avg(QueueStatistics.avg_handling_time_inbound ).label("sale_AHT_sec"),
            func.max(QueueStatistics.max_wait_time).label("sale_longest_waiting_time_sec"),
            func.sum(QueueStatistics.total_outbound_talk_time_destination).label("sale_total_talk_time_sec")
        ).filter(QueueStatistics.queue_name.notlike("%Service%")).first()
        
        # Query for Service Calls
        service_metrics = query.with_entities(
            func.sum(QueueStatistics.offered).label("service_calls_offered"),
            func.sum(QueueStatistics.accepted).label("service_calls_handled"),
            func.avg(QueueStatistics.accepted / func.nullif(QueueStatistics.offered, 1) * 100).label("service_ACC"),
            func.avg(QueueStatistics.sla_20_20).label("service_SL"),
            func.avg(QueueStatistics.avg_handling_time_inbound).label("service_AHT_sec"),
            func.max(QueueStatistics.max_wait_time).label("service_longest_waiting_time_sec"),
            func.sum(QueueStatistics.total_outbound_talk_time_destination).label("service_total_talk_time_sec")
        ).filter(QueueStatistics.queue_name.like("%Service%")).first()
        
    else:
        avg_handling_time = query.with_entities(
            func.avg(
                QueueStatistics.avg_handling_time_inbound
            )
        ).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
        
        total_talk_time = query.with_entities(
            func.sum(
                QueueStatistics.total_outbound_talk_time_destination
            )
        ).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
        
        total_outbound_calls = query.with_entities(
            func.sum(
                QueueStatistics.outbound
            )
        ).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
        
        # Query for Sale Calls
        sale_metrics = query.with_entities(
            func.sum(QueueStatistics.offered).label("sale_calls_offered"),
            func.sum(QueueStatistics.accepted).label("sale_calls_handled"),
            func.avg(QueueStatistics.accepted / func.nullif(QueueStatistics.offered, 0) * 100).label("sale_ACC"),
            func.avg(QueueStatistics.sla_20_20).label("sale_SL"),
            func.avg(QueueStatistics.avg_handling_time_inbound).label("sale_AHT_sec"),
            func.max(QueueStatistics.max_wait_time).label("sale_longest_waiting_time_sec"),
            func.sum(QueueStatistics.total_outbound_talk_time_destination).label("sale_total_talk_time_sec")
        ).filter(QueueStatistics.queue_name.notlike("%Service%"), QueueStatistics.date.between(start_date, end_date)).first()
        
        # Query for Service Calls
        service_metrics = query.with_entities(
            func.sum(QueueStatistics.offered).label("service_calls_offered"),
            func.sum(QueueStatistics.accepted).label("service_calls_handled"),
            func.avg(QueueStatistics.accepted / func.nullif(QueueStatistics.offered, 0) * 100).label("service_ACC"),
            func.avg(QueueStatistics.sla_20_20).label("service_SL"),
            func.avg(QueueStatistics.avg_handling_time_inbound).label("service_AHT_sec"),
            func.max(QueueStatistics.max_wait_time).label("service_longest_waiting_time_sec"),
            func.sum(QueueStatistics.total_outbound_talk_time_destination).label("service_total_talk_time_sec")
        ).filter(QueueStatistics.queue_name.like("%Service%"), QueueStatistics.date.between(start_date, end_date)).first()
    
    return {
        "sales_metrics": {
            "calls_offered": sale_metrics.sale_calls_offered or 0,
            "calls_handled": sale_metrics.sale_calls_handled or 0,
            "ACC": round(sale_metrics.sale_ACC or 0, 2),
            "SL": round(sale_metrics.sale_SL or 0, 2),
            "AHT_sec": round((sale_metrics.sale_AHT_sec/60 if sale_metrics.sale_AHT_sec else 0) or 0, 2),
            "longest_waiting_time_sec": (sale_metrics.sale_longest_waiting_time_sec/60 if sale_metrics.sale_longest_waiting_time_sec else 0) or 0 or 0,
            # "total_talk_time_sec": round((sale_metrics.sale_total_talk_time_sec/60 if sale_metrics.sale_total_talk_time_sec else 0) or 0, 2)
        },
        "service_metrics": {
            "calls_offered": service_metrics.service_calls_offered or 0,
            "calls_handled": service_metrics.service_calls_handled or 0,
            "ACC": round(service_metrics.service_ACC or 0, 2),
            "SL": round(service_metrics.service_SL or 0, 2),
            "AHT_sec": round((service_metrics.service_AHT_sec/60 if service_metrics.service_AHT_sec else 0) or 0, 2),
            "longest_waiting_time_sec": (service_metrics.service_longest_waiting_time_sec/60 if service_metrics.service_longest_waiting_time_sec else 0) or 0 or 0,
            # "total_talk_time_sec": round((service_metrics.service_total_talk_time_sec/60 if service_metrics.service_total_talk_time_sec else 0) or 0, 2)
        },
        "average handling time": round(avg_handling_time/60 if avg_handling_time else 0,2),
        # "Total Talk Time": round(total_talk_time if total_talk_time else 0, 2),
        "Total outbound calls": total_outbound_calls
        }


@router.get("/analytics_booking")
async def get_booking_data(time_input: float = 6*60, 
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
    current_user: schemas.User = Depends(oauth2.get_current_user),
    # access_control: bool = Depends(role_based_access_control),
    ):
    """Endpoint to retrieve graphs data from the database."""
    
    # User info
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    start_date_order, end_date_order = validate_user_and_date_permissions(db=db, current_user=current_user, start_date=start_date, end_date=end_date, include_all=include_all)
    # print(start_date_order, end_date_order)
    # Calculate the allowed date range based on the user's permissions
    start_date, end_date = validate_user_and_date_permissions_booking(db=db, current_user=current_user, start_date=start_date, end_date=end_date, include_all=include_all)
    # print("API: ", start_date, end_date)
    # Determine user access level
    email_filter = current_user.get("email")
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        if "5vorflug" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like("%5vF%")  
        )
            order_query = db.query(OrderJoin).filter(OrderJoin.customer.like("%5vF%"), 
                                                     OrderJoin.task_created.isnot(None))
            
        elif "Urlaubsguru" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.notlike("%5vF%"),
            SoftBookingKF.customer.notlike("%BILD%")
        )
            order_query = db.query(OrderJoin).filter(OrderJoin.task_created.isnot(None), 
                                                     OrderJoin.customer.notlike("%5vF%"), 
                                                     OrderJoin.customer.notlike("%BILD%"))
        elif "Bild" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like("%BILD%")  
        )
            order_query = db.query(OrderJoin).filter(OrderJoin.customer.like("%BILD%"), 
                                                     OrderJoin.task_created.isnot(None))
        else:
            query = db.query(SoftBookingKF)
            order_query = db.query(OrderJoin).filter(OrderJoin.task_created.isnot(None))
    else:
        filters = domains_checker_booking(db, user.id, filter_5vf="5vF", filter_bild="BILD")
        # print("Filters: ", filters)
        if filters:
            query = db.query(SoftBookingKF).filter(or_(*filters))
            order_query = db.query(OrderJoin).filter(or_(*filters), OrderJoin.task_created.isnot(None))
        else:
            query = db.query(SoftBookingKF)
            order_query = db.query(OrderJoin).filter(OrderJoin.task_created.isnot(None))
            
    booked = "OK"
    cancelled = "XX"
    pending = "PE"
    op = "OP"
    rq = "RQ"
    pe = "PE"
    sb_booked = "SB"
    
    if start_date is None:
        # Count records for each status
        total_bookings = query.with_entities(func.count(SoftBookingKF.original_status)).scalar() or 0
        booked_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == booked).scalar() or 0
        cancelled_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == cancelled).scalar() or 0
        pending_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == pending).scalar() or 0
        op_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == op).scalar() or 0
        rq_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == rq).scalar() or 0
        pe_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == pe).scalar() or 0
        sb_booked_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == sb_booked).scalar() or 0
        # Calculate SB Booking Rate
        total_sb_booked_and_cancelled = booked_count + sb_booked_count + cancelled_count
        sb_booking_rate = (sb_booked_count + booked_count / total_sb_booked_and_cancelled * 100) if total_sb_booked_and_cancelled > 0 else 0
        sb_input = query.with_entities(
            func.count(SoftBookingKF.original_status)
        ).scalar() or 0
        avg_duration = order_query.with_entities(func.avg(OrderJoin.duration)).filter(
            OrderJoin.task_created.isnot(None), 
            OrderJoin.task_type.isnot(None), 
            OrderJoin.date.between(start_date_order, end_date_order),
            func.strftime('%H:%M', OrderJoin.time_modified).between('08:00', '21:30')).scalar() or 0
    else:
        total_bookings = query.with_entities(func.count(SoftBookingKF.original_status)).filter(SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        booked_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == booked, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        cancelled_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == cancelled, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        pending_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == pending, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        op_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == op, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        rq_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == rq, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        pe_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == pe, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        sb_booked_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == sb_booked, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        # Calculate SB Booking Rate
        total_sb_booked_and_cancelled = booked_count + sb_booked_count + cancelled_count
        sb_booking_rate = (sb_booked_count + booked_count / total_sb_booked_and_cancelled * 100) if total_sb_booked_and_cancelled > 0 else 0
        sb_input = query.with_entities(
            func.count(SoftBookingKF.original_status)
        ).filter(SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        # total_tasks = order_query.with_entities(func.count(func.distinct(OrderJoin.task_type)).label("distinct_task_types")).filter(OrderJoin.task_created.isnot(None), OrderJoin.date.between(start_date, end_date)).scalar() or 0
        avg_duration = order_query.with_entities(func.avg(OrderJoin.duration)).filter(
            OrderJoin.task_created.isnot(None), 
            OrderJoin.task_type.isnot(None), 
            OrderJoin.date.between(start_date_order, end_date_order),
            func.strftime('%H:%M', OrderJoin.time_modified).between('08:00', '21:30')).scalar() or 0
    #     print(avg_duration)
    # print(avg_duration)
    # Return metrics as a dictionary
    return {
        "Total Bookings": total_bookings,
        "Booked": booked_count,
        "Cancelled count": cancelled_count,
        "Pending": pending_count,
        "OP": op_count,
        "RQ": rq_count,
        # "PE": pe_count,
        "SB": sb_booked_count,
        "avg_duration in minutes": round(avg_duration, 2) if avg_duration else 0,
        "SB Booking Rate (%)": 100 if sb_booking_rate > 100 else sb_booking_rate,
        "Processing time" : sb_input * time_input,
        "Booking status": {
            "Booked": booked_count,
            "Cancelled": cancelled_count,
            "Pending": pending_count,
            "OP/RQ": op_count+rq_count,
            "SB": sb_booked_count
        }
    }

@router.get("/analytics_booking_subkpis")
async def get_booking_data_sub_kpis(
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
    """Endpoint to retrieve graphs data from the database."""
    # User and Permission Validation
    user = db.query(User).filter(User.email == current_user.get("email")).first()
    
    # Determine user access level
    email_filter = current_user.get("email")
    # email_contains_5vflug = "5vorflug" in email_filter
    # email_contains_bild = "bild" in email_filter
    is_guru_email = "urlaubsguru" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        if "5vorflug" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like("%5vF%")  
        )
        elif "Urlaubsguru" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.notlike("%5vF%"),
            SoftBookingKF.customer.notlike("%BILD%")
        )
        elif "Bild" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like("%BILD%")  
        )
        else:
            query = db.query(SoftBookingKF)
    else:
        filters = domains_checker_booking(db, user.id, filter_5vf="5vF", filter_bild="BILD")
        # print("Filters: ", filters)
        if filters:
            query = db.query(SoftBookingKF).filter(or_(*filters))
        else:
            query = db.query(SoftBookingKF)
    
    # start_date, end_date = get_date_subkpis_booking("yesterday")
    # prev_start_date, prev_end_date = get_date_subkpis_booking("last_week")
    start_date, end_date, prev_start_date, prev_end_date = get_date_rng_subkpis_booking(db=db, current_user=current_user, start_date=start_date, end_date=end_date)
    print("dates:", start_date, end_date, prev_start_date, prev_end_date)
    
    booked = "OK"
    cancelled = "XX"
    pending = "PE"
    sb_booked = "SB"
    
    try:
        total_bookings = query.with_entities(func.count(SoftBookingKF.original_status)).filter(SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        booked_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == booked, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        cancelled_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status != cancelled, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        pending_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == pending, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        sb_booked_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == sb_booked, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        # Calculate SB Booking Rate
        total_sb_booked_and_cancelled = booked_count + sb_booked_count + cancelled_count
        sb_booking_rate = (sb_booked_count + booked_count / total_sb_booked_and_cancelled * 100) if total_sb_booked_and_cancelled > 0 else 0
        
        # Previous week metrics to calculate change
        prev_total_bookings = query.with_entities(func.count(SoftBookingKF.original_status)).filter(SoftBookingKF.service_creation_time.between(prev_start_date, prev_end_date)).scalar() or 0
        prev_booked_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == booked, SoftBookingKF.service_creation_time.between(prev_start_date, prev_end_date)).scalar() or 0
        prev_cancelled_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status != cancelled, SoftBookingKF.service_creation_time.between(prev_start_date, prev_end_date)).scalar() or 0
        prev_pending_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == pending, SoftBookingKF.service_creation_time.between(prev_start_date, prev_end_date)).scalar() or 0
        prev_sb_booked_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == sb_booked, SoftBookingKF.service_creation_time.between(prev_start_date, prev_end_date)).scalar() or 0
        # Calculate SB Booking Rate
        prev_total_sb_booked_and_cancelled = prev_booked_count + prev_sb_booked_count + prev_cancelled_count
        prev_sb_booking_rate = (prev_sb_booked_count + prev_booked_count / prev_total_sb_booked_and_cancelled * 100) if prev_total_sb_booked_and_cancelled > 0 else 0
        
        # Return metrics as a dictionary
        return {
            # "Total Bookings": total_bookings,
            # "preb total bookings": prev_total_bookings,
            "Total Bookings change": calculate_percentage_change(total_bookings, prev_total_bookings),
            # "pending count": pending_count,
            # "prev_pending_count": prev_pending_count,
            "Pending change": calculate_percentage_change(pending_count, prev_pending_count),
            "SB Booking Rate (%) change": calculate_percentage_change(round(sb_booking_rate, 2), round(prev_sb_booking_rate, 2))
        }

    except Exception as e:
        print(f"Error retrieving booking status metrics: {e}")
        return None


@router.get("/analytics_conversion")
async def get_conversion_data(
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
    domain:str = "all",
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve graphs data from the database."""
    # User info
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    # Calculate the allowed date range based on the user's permissions
    start_date, end_date = validate_user_and_date_permissions(db=db, current_user=current_user, start_date=start_date, end_date=end_date, include_all=include_all)
    start_date_booking, end_date_booking = validate_user_and_date_permissions_booking(db=db, current_user=current_user, start_date=start_date, end_date=end_date, include_all=include_all)
    user_permission = db.query(Permission).filter(Permission.user_id == user.id).first()
    user_domains = [
        domain.strip().lower()
        for domain in user_permission.domains.split(",")
        if domain.strip()
    ]
    # print("Domains: ", user_domains)
     # Determine accessible companies based on permissions
    accessible_companies = []
    if "urlaubsguru" in user_domains:
        accessible_companies.append("guru")
    if "5vorflug" in user_domains:
        accessible_companies.append("5vorflug")
    if "bild" in user_domains:
        accessible_companies.append("bild")
    
    # print("accessible_companies: ", accessible_companies)
    # if "5vorflug" in accessible_companies:
    #     print("containss")
    #     filters.append(SoftBookingKF.customer.like(f"%{filter_5vf}%"))
    #     # total_call_reasons = 0
    # if "bild" in accessible_companies:
    #     print("containss bild")
    #     filters.append(SoftBookingKF.customer.like(f"%{filter_bild}%"))
    #     # total_call_reasons = 0
    # if "guru" in accessible_companies:
    #     print("contains guru")
    #     filters.append(SoftBookingKF.customer.notlike(f"%{filter_5vf}%").notlike(f"%{filter_bild}%"))
        # total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
    # Determine user access level
    email_filter = current_user.get("email")
    # email_contains_5vflug = "5vorflug" in email_filter
    # email_contains_bild = "bild" in email_filter
    is_guru_email = "urlaubsguru" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        if "5vorflug" in company:
            query = db.query(BookingData).filter(
            BookingData.order_agent.like("%5VF%")  
            )
            sale_query = db.query(QueueStatistics).filter(
                QueueStatistics.queue_name.notlike("%Service%"),
                QueueStatistics.queue_name.like("%5vorFlug%")
            )
        elif "Urlaubsguru" in company:
            query = db.query(BookingData).filter(BookingData.order_agent.like(f"%GURU%"))
            sale_query = db.query(QueueStatistics).filter(
                QueueStatistics.queue_name.notlike("%Service%"),
                QueueStatistics.queue_name.notlike("%5vorFlug%"),
                QueueStatistics.queue_name.notlike("%BILD%")
            )
        elif "Bild" in company:
            query = db.query(BookingData).filter(
            BookingData.order_agent.like("%BILD%")  
        )
            sale_query = db.query(QueueStatistics).filter(
                QueueStatistics.queue_name.notlike("%Service%"),
                QueueStatistics.queue_name.like("%BILD%")
            )
        else:
            query = db.query(BookingData)
            sale_query = db.query(QueueStatistics).filter(
                QueueStatistics.queue_name.notlike("%Service%")
            )
    # if "5vorflug" in accessible_companies:
    #     print("containss")
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail={
    #             "error": "Permission Denied",
    #             "message": f"You don't have a permission.",
    #         }
    #     )
    # if "bild" in accessible_companies:
    #     print("containss bild")
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail={
    #             "error": "Permission Denied",
    #             "message": f"You don't have a permission.",
    #         }
    #     )

    # if "urlaubsguru" in accessible_companies:
    #     print("executing else containss")
    #     query = db.query(SoftBookingKF).filter(
    #         SoftBookingKF.customer.notlike("%5vF%"),
    #         SoftBookingKF.customer.notlike("%BILD%")
    #     )

    # List of companies to check for raising exceptions
    else:
        restricted_companies = ["5vorflug", "bild"]

        # Check if all three companies are in accessible_companies
        if "5vorflug" in accessible_companies and "bild" in accessible_companies and "urlaubsguru" in accessible_companies:
            print("All companies found, prioritizing 'urlaubsguru'")
            query = db.query(SoftBookingKF)
        else:
            # Iterate through the restricted companies
            for company in restricted_companies:
                if company in accessible_companies:
                    print(f"contains {company}")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail={
                            "error": "Permission Denied",
                            "message": f"You don't have permission to access {company}.",
                        }
                    )

    # Handle "urlaubsguru" separately if present and not already handled
    if "guru" in accessible_companies:
        print("executing else containss")
        query = db.query(BookingData)
        sale_query = db.query(QueueStatistics).filter(
                QueueStatistics.queue_name.notlike("%Service%")
            )

    db = SessionLocal()
    if start_date is None:
        calls_cb_handled = db.query(func.sum(GuruCallReason.cb_sales)).scalar() or 0
        calls_sales_handled = db.query(func.sum(GuruCallReason.guru_sales)).scalar() or 0
        wrong_calls = db.query(func.sum(GuruCallReason.cb_wrong_call)).scalar() or 0
        sales_wrong_calls = db.query(func.sum(GuruCallReason.guru_wrong)).scalar() or 0
        bookings_cb = db.query(func.sum(GuruCallReason.guru_cb_booking)).scalar() or 0
        # turnover_cb = round(query.with_entities(func.sum(BookingData.id)).scalar() or 0,2)
        sales_volume = db.query(func.sum(GuruCallReason.guru_sales)).scalar() or 0
        
        total_calls = sale_query.with_entities(func.sum(QueueStatistics.calls)).scalar() or 0
        accepted_calls = sale_query.with_entities(func.sum(QueueStatistics.accepted)).scalar() or 0
        abondened_before_ans = sale_query.with_entities(func.sum(QueueStatistics.abandoned_before_answer)).scalar() or 0
        cb_wrong_calls = db.query(func.sum(GuruCallReason.cb_wrong_call)).scalar() or 0
        sucess_bookings = query.with_entities(func.count(BookingData.id)).filter(
        BookingData.crs_status == "OK"
        ).scalar() or 0
    
    else:
        calls_cb_handled = db.query(func.sum(GuruCallReason.cb_sales)).filter(
        GuruCallReason.date.between(start_date, end_date)
        ).scalar() or 0
        calls_sales_handled = db.query(func.sum(GuruCallReason.guru_sales)).filter(
        GuruCallReason.date.between(start_date, end_date)
        ).scalar() or 0
        wrong_calls = db.query(func.sum(GuruCallReason.cb_wrong_call)).filter(
        GuruCallReason.date.between(start_date, end_date)
        ).scalar() or 0
        sales_wrong_calls = db.query(func.sum(GuruCallReason.guru_wrong)).filter(
        GuruCallReason.date.between(start_date, end_date)
        ).scalar() or 0
        bookings_cb = db.query(func.sum(GuruCallReason.guru_cb_booking)).filter(
        GuruCallReason.date.between(start_date, end_date)
        ).scalar() or 1 
        # turnover_cb = round(query.with_entities(func.sum(SoftBookingKF.service_element_price)).filter(
        # SoftBookingKF.service_creation_time.between(start_date_booking, end_date_booking)
        # ).scalar() or 0,2)
        sales_volume = db.query(func.sum(GuruCallReason.guru_sales)).filter(
        GuruCallReason.date.between(start_date, end_date)
        ).scalar() or 0
        
        # calculations for conversion and effective calls
        total_calls = sale_query.with_entities(func.sum(QueueStatistics.calls)).filter(
        QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
        accepted_calls = sale_query.with_entities(func.sum(QueueStatistics.accepted)).filter(
        QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
        abondened_before_ans = sale_query.with_entities(func.sum(QueueStatistics.abandoned_before_answer)).filter(
        QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
        cb_wrong_calls = db.query(func.sum(GuruCallReason.cb_wrong_call)).filter(
        GuruCallReason.date.between(start_date, end_date)
        ).scalar() or 0
        sucess_bookings = query.with_entities(func.count(BookingData.id)).filter(
        BookingData.date.between(start_date, end_date),
        BookingData.crs_status == "OK"
        ).scalar() or 0
        
        print(total_calls)
        print(accepted_calls)
        print(abondened_before_ans)
        print(cb_wrong_calls)
        print(sucess_bookings)
        
        
    cb_conversion = round(calls_cb_handled - wrong_calls / bookings_cb if bookings_cb>0 else 1, 2)
    # sales_conversion = round(calls_sales_handled - sales_wrong_calls / bookings_cb if bookings_cb>0 else 1, 2)
    sales_effective_calls = accepted_calls - (abondened_before_ans + cb_wrong_calls)
    sales_conversion = round((sucess_bookings/sales_effective_calls)*100, 2) 
    # Return metrics as a dictionary
    return {
        "sales_effective_calls": sales_effective_calls,
        "CB":{
            "CB Conversion": 100 if cb_conversion > 100 else cb_conversion
            },
        "Sales":{
            "Sales Conversion": 100 if sales_conversion > 100 else sales_conversion
            },
        "Conversion Performance":{
            "CB":{
            "CB calls handled": calls_cb_handled,
            "Wrong calls": wrong_calls,
            "Bookings CB": bookings_cb if bookings_cb>1 else 0,
            # "Turnover": format_revenue(turnover_cb),
            # "turnover": turnover_cb,
            "CB Conversion": 100 if cb_conversion > 100 else cb_conversion
            },
            "Sales":{
            "Sales handles": calls_sales_handled,
            "Wrong calls": sales_wrong_calls,
            "Bookings Sales": bookings_cb if bookings_cb>1 else 0,
            "Sales volume": sales_volume,
            "Sales Conversion": 100 if sales_conversion > 100 else sales_conversion
            }
        }
        
        }