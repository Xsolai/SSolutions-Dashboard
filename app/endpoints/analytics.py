from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.models.models import WorkflowReportGuruKF, QueueStatistics, GuruCallReason, SoftBookingKF, User, Permission
from app.database.db.db_connection import  get_db, SessionLocal
from datetime import datetime, timedelta
from sqlalchemy import func, cast, Date
from collections import defaultdict
from app.database.scehmas import schemas
from app.database.auth import oauth2
from app.src.utils import get_date_range, calculate_percentage_change


router = APIRouter(
    tags=["Analytics"]
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


@router.get("/anaytics_email")
async def get_anaytics_email_data(
    filter_type: str = Query("all", description="Filter by date range: yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve graphs data from the database with date filtering."""
    
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    
    
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
    
    # Retrieve data from database
    if start_date is None:
        # Filter data based on the interval (date) column
        email_recieved = db.query(
            func.sum(WorkflowReportGuruKF.received)
        ).scalar() or 0

        email_answered = db.query(
            func.sum(WorkflowReportGuruKF.sent)
        ).scalar() or 0

        # email_forwarded = db.query(
        #     func.sum(WorkflowReportGuruKF.sent_forwarded)
        # ).scalar() or 0

        email_archieved = db.query(
            func.sum(WorkflowReportGuruKF.archived)
        ).scalar() or 0

        service_level_gross = db.query(
            func.avg(WorkflowReportGuruKF.service_level_gross)
        ).scalar() or 0

        # new_sent = db.query(
        #     func.sum(WorkflowReportGuruKF.sent_new_message)
        # ).scalar() or 0

        processing_times = db.query(WorkflowReportGuruKF.processing_time).all()
        

    else:
        # Filter data based on the interval (date) column
        email_recieved = db.query(
            func.sum(WorkflowReportGuruKF.received)
        ).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).scalar() or 0

        email_answered = db.query(
            func.sum(WorkflowReportGuruKF.sent)
        ).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).scalar() or 0

        # email_forwarded = db.query(
        #     func.sum(WorkflowReportGuruKF.sent_forwarded)
        # ).filter(
        #     WorkflowReportGuruKF.date.between(start_date, end_date)
        # ).scalar() or 0

        email_archieved = db.query(
            func.sum(WorkflowReportGuruKF.archived)
        ).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).scalar() or 0

        service_level_gross = db.query(
            func.avg(WorkflowReportGuruKF.service_level_gross)
        ).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).scalar() or 0

        # new_sent = db.query(
        #     func.sum(WorkflowReportGuruKF.sent_new_message)
        # ).filter(
        #     WorkflowReportGuruKF.date.between(start_date, end_date)
        # ).scalar() or 0

        processing_times = db.query(WorkflowReportGuruKF.processing_time).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).all()
    # Clean the data to extract values from tuples
    processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
    
    total_processing_time_seconds = 1
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
        # "email forwarded": email_forwarded,
        "email archived": email_archieved,
        "SL Gross": round(service_level_gross, 2),
        # "New Sent": new_sent,
        "Total Processing Time (sec)": round(total_processing_time_seconds, 2) if total_processing_time_seconds>1 else 0,
        "Processing Time Trend in seconds": processing_time_trend,
        "Processing Count Trend": processing_count_trend
    }
    
@router.get("/anaytics_email_subkpis")
async def get_anaytics_email_data_sub_kpis(
    filter_type: str = Query("all", description="Filter by date range: yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve graphs data from the database with date filtering."""
    start_date, end_date = get_date_range("yesterday")
    prev_start_date, prev_end_date = get_date_range("last_week")
    total_processing_time_seconds = 1
    prev_total_processing_time_seconds = 1
    start_date_str, end_date_str = start_date.strftime("%d.%m.%Y"), end_date.strftime("%d.%m.%Y")
    prev_start_date_str, prev_end_date_str = prev_start_date.strftime("%d.%m.%Y"), prev_end_date.strftime("%d.%m.%Y")
    # Filter data based on the interval (date) column
    email_recieved = db.query(
        func.sum(WorkflowReportGuruKF.received)
    ).filter(
        WorkflowReportGuruKF.interval.between(start_date_str, end_date_str)
    ).scalar() or 0

    email_answered = db.query(
        func.sum(WorkflowReportGuruKF.sent)
    ).filter(
        WorkflowReportGuruKF.interval.between(start_date_str, end_date_str)
    ).scalar() or 0

    # email_forwarded = db.query(
    #     func.sum(WorkflowReportGuruKF.sent_forwarded)
    # ).filter(
    #     WorkflowReportGuruKF.interval.between(start_date_str, end_date_str)
    # ).scalar() or 0

    email_archieved = db.query(
        func.sum(WorkflowReportGuruKF.archived)
    ).filter(
        WorkflowReportGuruKF.interval.between(start_date_str, end_date_str)
    ).scalar() or 0

    # new_sent = db.query(
    #     func.sum(WorkflowReportGuruKF.sent_new_message)
    # ).filter(
    #     WorkflowReportGuruKF.interval.between(start_date_str, end_date_str)
    # ).scalar() or 0
    
    # Previous values to calculate the change
    prev_email_recieved = db.query(
        func.sum(WorkflowReportGuruKF.received)
    ).filter(
        WorkflowReportGuruKF.interval.between(prev_start_date_str, prev_end_date_str)
    ).scalar() or 0

    prev_email_answered = db.query(
        func.sum(WorkflowReportGuruKF.sent)
    ).filter(
        WorkflowReportGuruKF.interval.between(prev_start_date_str, prev_end_date_str)
    ).scalar() or 0

    # prev_email_forwarded = db.query(
    #     func.sum(WorkflowReportGuruKF.sent_forwarded)
    # ).filter(
    #     WorkflowReportGuruKF.interval.between(prev_start_date_str, prev_end_date_str)
    # ).scalar() or 0

    prev_email_archieved = db.query(
        func.sum(WorkflowReportGuruKF.archived)
    ).filter(
        WorkflowReportGuruKF.interval.between(prev_start_date_str, prev_end_date_str)
    ).scalar() or 0

    # prev_new_sent = db.query(
    #     func.sum(WorkflowReportGuruKF.sent_new_message)
    # ).filter(
    #     WorkflowReportGuruKF.interval.between(prev_start_date_str, prev_end_date_str)
    # ).scalar() or 0
        
    return {
        "email recieved": email_recieved,
        "email recieved change": calculate_percentage_change(email_answered, prev_email_recieved),
        "email answered": email_answered,
        "email answered change": calculate_percentage_change(email_answered, prev_email_answered),
        # "email forwarded": email_forwarded,
        # "email forwarded change": calculate_percentage_change(email_forwarded, prev_email_forwarded),
        "email archived": email_archieved,
        "email archived change": calculate_percentage_change(email_archieved, prev_email_archieved),
        # "New Sent": new_sent,
        # "New Sent change": calculate_percentage_change(new_sent, prev_new_sent),
    }


@router.get("/analytics_sales_service")
async def get_sales_and_service(filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve graphs data from the database."""
    
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    
    
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
    
    db = SessionLocal()
    start_date, end_date = get_date_range(filter_type)
    sale_queue_name = "5vorFlugSales"
    service_queue_name = "5vorFlugService"
    if start_date is None:
        avg_handling_time = db.query(
        func.avg(
            QueueStatistics.avg_handling_time_inbound
        )
        ).scalar()*60 or 0
        
        total_talk_time = db.query(
            func.sum(
                QueueStatistics.total_outbound_talk_time_destination
            )
        ).scalar()*60 or 0
        
        total_outbound_calls = db.query(
            func.sum(
                QueueStatistics.outbound
            )
        ).scalar()*60 or 0
        
        # Query for Sale Calls
        sale_metrics = db.query(
            func.sum(QueueStatistics.offered).label("sale_calls_offered"),
            func.sum(QueueStatistics.accepted).label("sale_calls_handled"),
            func.avg(QueueStatistics.accepted / func.nullif(QueueStatistics.offered, 0) * 100).label("sale_ACC"),
            func.avg(QueueStatistics.sla_20_20).label("sale_SL"),
            func.avg(QueueStatistics.avg_handling_time_inbound * 60).label("sale_AHT_sec"),
            func.max(QueueStatistics.max_wait_time * 60).label("sale_longest_waiting_time_sec"),
            func.sum(QueueStatistics.total_outbound_talk_time_destination * 60).label("sale_total_talk_time_sec")
        ).filter(QueueStatistics.queue_name == sale_queue_name).first()
        
        # Query for Service Calls
        service_metrics = db.query(
            func.sum(QueueStatistics.offered).label("service_calls_offered"),
            func.sum(QueueStatistics.accepted).label("service_calls_handled"),
            func.avg(QueueStatistics.accepted / func.nullif(QueueStatistics.offered, 0) * 100).label("service_ACC"),
            func.avg(QueueStatistics.sla_20_20).label("service_SL"),
            func.avg(QueueStatistics.avg_handling_time_inbound * 60).label("service_AHT_sec"),
            func.max(QueueStatistics.max_wait_time * 60).label("service_longest_waiting_time_sec"),
            func.sum(QueueStatistics.total_outbound_talk_time_destination * 60).label("service_total_talk_time_sec")
        ).filter(QueueStatistics.queue_name == service_queue_name).first()
        
    else:
        avg_handling_time = db.query(
            func.avg(
                QueueStatistics.avg_handling_time_inbound
            )
        ).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
        
        total_talk_time = db.query(
            func.sum(
                QueueStatistics.total_outbound_talk_time_destination
            )
        ).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
        
        total_outbound_calls = db.query(
            func.sum(
                QueueStatistics.outbound
            )
        ).filter(
            QueueStatistics.date.between(start_date, end_date)
        ).scalar() or 0
        
        # Query for Sale Calls
        sale_metrics = db.query(
            func.sum(QueueStatistics.offered).label("sale_calls_offered"),
            func.sum(QueueStatistics.accepted).label("sale_calls_handled"),
            func.avg(QueueStatistics.accepted / func.nullif(QueueStatistics.offered, 0) * 100).label("sale_ACC"),
            func.avg(QueueStatistics.sla_20_20).label("sale_SL"),
            func.avg(QueueStatistics.avg_handling_time_inbound * 60).label("sale_AHT_sec"),
            func.max(QueueStatistics.max_wait_time * 60).label("sale_longest_waiting_time_sec"),
            func.sum(QueueStatistics.total_outbound_talk_time_destination * 60).label("sale_total_talk_time_sec")
        ).filter(QueueStatistics.queue_name == sale_queue_name, QueueStatistics.date.between(start_date, end_date)).first()
        
        # Query for Service Calls
        service_metrics = db.query(
            func.sum(QueueStatistics.offered).label("service_calls_offered"),
            func.sum(QueueStatistics.accepted).label("service_calls_handled"),
            func.avg(QueueStatistics.accepted / func.nullif(QueueStatistics.offered, 0) * 100).label("service_ACC"),
            func.avg(QueueStatistics.sla_20_20).label("service_SL"),
            func.avg(QueueStatistics.avg_handling_time_inbound * 60).label("service_AHT_sec"),
            func.max(QueueStatistics.max_wait_time * 60).label("service_longest_waiting_time_sec"),
            func.sum(QueueStatistics.total_outbound_talk_time_destination * 60).label("service_total_talk_time_sec")
        ).filter(QueueStatistics.queue_name == service_queue_name, QueueStatistics.date.between(start_date, end_date)).first()
    
    return {
        "sales_metrics": {
            "calls_offered": sale_metrics.sale_calls_offered or 0,
            "calls_handled": sale_metrics.sale_calls_handled or 0,
            "ACC": round(sale_metrics.sale_ACC or 0, 2),
            "SL": round(sale_metrics.sale_SL or 0, 2),
            "AHT_sec": round(sale_metrics.sale_AHT_sec or 0, 2),
            "longest_waiting_time_sec": sale_metrics.sale_longest_waiting_time_sec or 0,
            "total_talk_time_sec": round(sale_metrics.sale_total_talk_time_sec or 0, 2)
        },
        "service_metrics": {
            "calls_offered": service_metrics.service_calls_offered or 0,
            "calls_handled": service_metrics.service_calls_handled or 0,
            "ACC": round(service_metrics.service_ACC or 0, 2),
            "SL": round(service_metrics.service_SL or 0, 2),
            "AHT_sec": round(service_metrics.service_AHT_sec or 0, 2),
            "longest_waiting_time_sec": service_metrics.service_longest_waiting_time_sec or 0,
            "total_talk_time_sec": round(service_metrics.service_total_talk_time_sec or 0, 2)
        },
        "average handling time": round(avg_handling_time*60 if avg_handling_time else 0,2),
        "Total Talk Time": round(total_talk_time*60 if total_talk_time else 0, 2),
        "Total outbound calls": total_outbound_calls
        }


@router.get("/analytics_booking")
async def get_booking_data(time_input: float = 6*60, filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user),
    # access_control: bool = Depends(role_based_access_control),
    ):
    """Endpoint to retrieve graphs data from the database."""
    
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    
    
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
    # print(start_date)
    # print(end_date)
    booked = "OK"
    cancelled = "XX"
    pending = "PE"
    op = "OP"
    rq = "RQ"
    pe = "PE"
    sb_booked = "SB"
    
    try:
        if start_date is None:
            # Count records for each status
            total_bookings = db.query(func.count(SoftBookingKF.original_status)).scalar() or 0
            booked_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == booked).scalar() or 0
            cancelled_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status != cancelled).scalar() or 0
            pending_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == pending).scalar() or 0
            op_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == op).scalar() or 0
            rq_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == rq).scalar() or 0
            pe_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == pe).scalar() or 0
            sb_booked_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == sb_booked).scalar() or 0
            # Calculate SB Booking Rate
            total_sb_booked_and_cancelled = booked_count + sb_booked_count + cancelled_count
            sb_booking_rate = (sb_booked_count + booked_count / total_sb_booked_and_cancelled * 100) if total_sb_booked_and_cancelled > 0 else 0
            sb_input = db.query(
                func.count(SoftBookingKF.original_status)
            ).scalar() or 0
        else:
            # start_date_str = start_date.strftime("%Y-%m-%d")
            # end_date_str = end_date.strftime("%Y-%m-%d")
            print(start_date, end_date)
            total_bookings = db.query(func.count(SoftBookingKF.original_status)).filter(SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
            booked_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == booked, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
            cancelled_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == cancelled, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
            pending_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == pending, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
            op_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == op, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
            rq_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == rq, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
            pe_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == pe, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
            sb_booked_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == sb_booked, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
            # Calculate SB Booking Rate
            total_sb_booked_and_cancelled = booked_count + sb_booked_count + cancelled_count
            sb_booking_rate = (sb_booked_count + booked_count / total_sb_booked_and_cancelled * 100) if total_sb_booked_and_cancelled > 0 else 0
            sb_input = db.query(
                func.count(SoftBookingKF.original_status)
            ).filter(SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        
        # Return metrics as a dictionary
        return {
            "Total Bookings": total_bookings,
            "Booked": booked_count,
            "Cancelled count": cancelled_count,
            "Pending": pending_count,
            "OP": op_count,
            "RQ": rq_count,
            "PE": pe_count,
            "SB": sb_booked_count,
            "SB Booking Rate (%)": round(sb_booking_rate, 2),
            "Processing time" : sb_input * time_input,
            "Booking status": {
                "Booked": booked_count,
                "Cancelled": cancelled_count,
                "Pending": pending_count,
                "OP/RQ/PE": op_count+rq_count+pe_count,
                "SB": sb_booked_count
            }
        }

    except Exception as e:
        print(f"Error retrieving booking status metrics: {e}")
        return None

@router.get("/analytics_booking_subkpis")
async def get_booking_data_sub_kpis(db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve graphs data from the database."""
    
    start_date, end_date = get_date_range("yesterday")
    prev_start_date, prev_end_date = get_date_range("last_week")
    start_date_str, end_date_str = start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d")
    prev_start_date_str, prev_end_date_str = prev_start_date.strftime("%Y-%m-%d"), prev_end_date.strftime("%Y-%m-%d")
    # print(start_date)
    # print(end_date)
    booked = "OK"
    cancelled = "XX"
    pending = "PE"
    sb_booked = "SB"
    
    try:
        total_bookings = db.query(func.count(SoftBookingKF.original_status)).filter(SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        booked_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == booked, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        cancelled_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status != cancelled, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        pending_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == pending, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        sb_booked_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == sb_booked, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        # Calculate SB Booking Rate
        total_sb_booked_and_cancelled = booked_count + sb_booked_count + cancelled_count
        sb_booking_rate = (sb_booked_count + booked_count / total_sb_booked_and_cancelled * 100) if total_sb_booked_and_cancelled > 0 else 0
        
        # Previous week metrics to calculate change
        prev_total_bookings = db.query(func.count(SoftBookingKF.original_status)).filter(SoftBookingKF.service_creation_time.between(prev_start_date_str, prev_end_date_str)).scalar() or 0
        prev_booked_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == booked, SoftBookingKF.service_creation_time.between(prev_start_date_str, prev_end_date_str)).scalar() or 0
        prev_cancelled_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status != cancelled, SoftBookingKF.service_creation_time.between(prev_start_date_str, prev_end_date_str)).scalar() or 0
        prev_pending_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == pending, SoftBookingKF.service_creation_time.between(prev_start_date_str, prev_end_date_str)).scalar() or 0
        prev_sb_booked_count = db.query(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == sb_booked, SoftBookingKF.service_creation_time.between(prev_start_date_str, prev_end_date_str)).scalar() or 0
        # Calculate SB Booking Rate
        prev_total_sb_booked_and_cancelled = prev_booked_count + prev_sb_booked_count + prev_cancelled_count
        prev_sb_booking_rate = (prev_sb_booked_count + prev_booked_count / prev_total_sb_booked_and_cancelled * 100) if prev_total_sb_booked_and_cancelled > 0 else 0
        
        # Return metrics as a dictionary
        return {
            "Total Bookings change": calculate_percentage_change(total_bookings, prev_total_bookings),
            "Pending change": calculate_percentage_change(pending_count, prev_pending_count),
            "SB Booking Rate (%) change": calculate_percentage_change(round(sb_booking_rate, 2), round(prev_sb_booking_rate, 2))
        }

    except Exception as e:
        print(f"Error retrieving booking status metrics: {e}")
        return None


@router.get("/analytics_conversion")
async def get_conversion_data(filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve graphs data from the database."""
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    
    
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

    db = SessionLocal()    
    start_date, end_date = get_date_range(filter_type=filter_type)
    if start_date is None:
        calls_cb_handled = db.query(func.sum(GuruCallReason.cb_sales)).scalar() or 0
        calls_sales_handled = db.query(func.sum(GuruCallReason.guru_sales)).scalar() or 0
        wrong_calls = db.query(func.sum(GuruCallReason.cb_wrong_call)).scalar() or 0
        sales_wrong_calls = db.query(func.sum(GuruCallReason.guru_wrong)).scalar() or 0
        # calls = db.query(func.sum(GuruDailyCallData.total_calls)).scalar() or 0
        bookings_cb = db.query(func.sum(GuruCallReason.guru_cb_booking)).scalar() or 0
        turnover_cb = round(db.query(func.sum(SoftBookingKF.service_element_price)).scalar() or 0,2)
        sales_volume = db.query(func.sum(GuruCallReason.guru_sales)).scalar() or 0
    
    else:
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
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
        # calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
        # GuruDailyCallData.date.between(start_date, end_date)
        # ).scalar() or 0
        bookings_cb = db.query(func.sum(GuruCallReason.guru_cb_booking)).filter(
        GuruCallReason.date.between(start_date, end_date)
        ).scalar() or 1
        turnover_cb = round(db.query(func.sum(SoftBookingKF.service_element_price)).filter(
        SoftBookingKF.service_creation_time.between(start_date_str, end_date_str)
        ).scalar() or 0,2)
        sales_volume = db.query(func.sum(GuruCallReason.guru_sales)).filter(
        GuruCallReason.date.between(start_date, end_date)
        ).scalar() or 0
        
    cb_conversion = round(calls_cb_handled - wrong_calls / bookings_cb, 2)
    sales_conversion = round(calls_sales_handled - sales_wrong_calls / bookings_cb, 2)
    
    # Return metrics as a dictionary
    return {
        "CB":{
            "CB Conversion": cb_conversion
            },
        "Sales":{
            "Sales Conversion": sales_conversion
            },
        "Conversion Performance":{
            "CB":{
            "CB calls handled": calls_cb_handled,
            "Wrong calls": wrong_calls,
            "Bookings CB": bookings_cb if bookings_cb>1 else 0,
            "Turnover": turnover_cb,
            "CB Conversion": cb_conversion
            },
            "Sales":{
            "Sales handles": calls_sales_handled,
            "Wrong calls": sales_wrong_calls,
            "Bookings Sales": bookings_cb if bookings_cb>1 else 0,
            "Sales volume": sales_volume,
            "Sales Conversion": sales_conversion
            }
        }
        
        }

