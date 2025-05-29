from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.models.models import  EmailData, WorkflowReportGuruKF, QueueStatistics, AllQueueStatisticsData, GuruCallReason, SoftBookingKF, User, Permission, BookingData, GuruTask, BookingTracking
from app.database.db.db_connection import  get_db, SessionLocal
from datetime import datetime, timedelta, date
from sqlalchemy import func, or_, and_, case
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
        # elif "Urlaubsguru" in company:
        #     query = db.query(WorkflowReportGuruKF).filter(
        #     WorkflowReportGuruKF.customer.like(f"%Guru%") 
        #     )
        #     email_query = db.query(EmailData).filter(
        #     EmailData.customer.like(f"%Guru%")
        #     )
        elif company=="Urlaubsguru":
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%Guru %") 
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%Guru %")
            )
        elif "UrlaubsguruKF" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%GuruKF%") 
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%GuruKF%")
            )
        elif "Bild" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%Bild%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%Bild%")  
            )
        elif "ADAC" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%ADAC%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%ADAC%")  
            )
        elif "Galeria" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%Galeria%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%Galeria%")  
            )
        elif "Urlaub" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%Urlaub%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%Urlaub%")  
            )
        else:
            query = db.query(WorkflowReportGuruKF)
            email_query = db.query(EmailData)
    else:
        print("executing for client")
        accessible_companies, filters, email_filter = domains_checker_email(db, user.id, filter_5vf="5vorFlug", filter_bild="Bild")
        # # print("Filters: ", filters) 
        if filters:
            query = db.query(WorkflowReportGuruKF).filter(or_(*filters))
            email_query = db.query(EmailData).filter(or_(*email_filter))
        else:
            query = db.query(WorkflowReportGuruKF)
            email_query = db.query(EmailData)
            
        if company!="all":
            if "5vorflug" in company and "5vorflug" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like("%5vorFlug%")  
                )
                email_query = email_query.filter(
                EmailData.customer.like("%5vorFlug%")  
                )
            # elif "Urlaubsguru" in company and "guru" in accessible_companies:
            #     query = query.filter(
            #     WorkflowReportGuruKF.customer.like(f"%Guru%")  
            #     )
            #     email_query = email_query.filter(
            #     EmailData.customer.like(f"%Guru%")
            #     )
            elif company=="Urlaubsguru" and "guru" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like(f"%Guru %")  
                )
                email_query = email_query.filter(
                EmailData.customer.like(f"%Guru %")
                )
            elif company=="UrlaubsguruKF" and "guru_kf" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like(f"%GuruKF%")  
                )
                email_query = email_query.filter(
                EmailData.customer.like(f"%GuruKF%")
                )
            elif "Bild" in company and "bild" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like(f"%Bild%")  
                )
                email_query = email_query.filter(
                EmailData.customer.like(f"%Bild%")  
                )
            elif "ADAC" in company and "ADAC" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like(f"%ADAC%")  
                )
                email_query = email_query.filter(
                EmailData.customer.like(f"%ADAC%")  
                )
            elif "Galeria" in company and "Galeria" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like(f"%Galeria%")  
                )
                email_query = email_query.filter(
                EmailData.customer.like(f"%Galeria%")  
                )
            elif "Urlaub" in company and "Urlaub" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like(f"%Urlaub%")  
                )
                email_query = email_query.filter(
                EmailData.customer.like(f"%Urlaub%")  
                )
            else:
                return {
                    "email recieved": 0,
                    "email sent": 0,
                    "email new cases": 0,
                    "email archived": 0,
                    "SL Gross": 0,
                    "Total Dwell Time (sec)": time_formatter(0, 0, 0),
                    "Processing Time Trend in seconds": [],
                    "Processing Count Trend": [],
                }
    
    prev_query = query
    prev_email_query = email_query
    
    if domain != "all":
        if company in ["ADAC", "Galeria", "Urlaub"]:
            query = query
            email_query = email_query
            # email_query = email_query.filter(EmailData.customer.like(f"%{domain}%"))
        else:
            if domain=="Sales" :
                query = query.filter(WorkflowReportGuruKF.customer.notlike(f"%Service%"))
                email_query = email_query.filter(EmailData.customer.notlike(f"%Service%"))
                
            else:
                query = query.filter(WorkflowReportGuruKF.customer.like(f"%{domain}%"))
                email_query = email_query.filter(EmailData.customer.like(f"%{domain}%"))
    
    # if domain != "all":
    #     if domain=="Sales" :
    #         query = query.filter(WorkflowReportGuruKF.customer.notlike(f"%Service%"))
    #         email_query = email_query.filter(EmailData.customer.notlike(f"%Service%"))
            
    #     else:
    #         query = query.filter(WorkflowReportGuruKF.customer.like(f"%{domain}%"))
    #         email_query = email_query.filter(EmailData.customer.like(f"%{domain}%"))
    
    # Retrieve data from database
    if start_date is None:
        # Filter data based on the interval (date) column
        email_recieved = email_query.with_entities(
            func.sum(EmailData.received)
        ).scalar() or 0
        
        email_new_recieved = email_query.with_entities(
            func.sum(EmailData.new_received)
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
        min_date_result = email_query.with_entities(func.min(EmailData.date)).scalar() or 0

        max_date_result = email_query.with_entities(func.max(EmailData.date)).scalar() or 0
        print(min_date_result, max_date_result)
        # Calculate days in range if we have both dates
        if min_date_result and max_date_result:
            days_in_range = (max_date_result - min_date_result).days + 1
        else:
            days_in_range = 1
            
        print("days: ",days_in_range)
        

    else:
        # Filter data based on the interval (date) column
        email_recieved = email_query.with_entities(
            func.sum(EmailData.received)
        ).filter(
            EmailData.date.between(start_date, end_date)
        ).scalar() or 0
        
        email_new_recieved = email_query.with_entities(
            func.sum(EmailData.new_received)
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
        days_in_range = (end_date - start_date).days + 1
    # Clean the data to extract values from tuples
    # processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
    
    total_processing_time_seconds = 0.0001
    total_processing_time_min = 0.0001
    total_processing_time_sec = 0.0001
    total_processing_time_mins = 0.0001
    total_processing_time_hour = 0
    total_dwell_time_seconds = 0.0001
    total_dwell_min = 0.0001
    total_dwell_hours = 0
    interval_data = defaultdict(float)

    processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
    dwell_times = [pt[0] if isinstance(pt, tuple) else pt for pt in dwell_times]
    print("Dwell times: ", dwell_times)
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
    total_seconds_dwell = (total_dwell_hours * 3600) + (total_dwell_min * 60) + total_dwell_time_seconds
    print(total_seconds_dwell)
    # Determine divisor: if days_in_range > 1, use days_in_range, else use number of time entries
    if days_in_range > 1:
        print(days_in_range)
        divisor_dwell = days_in_range
    else:
        print(max(len(dwell_times), 1))
        # divisor_dwell = max(len(dwell_times), 1)  # Prevent division by zero
        divisor_dwell = 1

    # Compute average processing time
    avg_seconds_per_entry_dwell = total_seconds_dwell / divisor_dwell

    # Convert average seconds into HH:MM:SS format
    avg_hours_dwell, remainder_dwell = divmod(avg_seconds_per_entry_dwell, 3600)
    avg_minutes_dwell, avg_seconds_dwell = divmod(remainder_dwell, 60)

    # Ensure integer values for formatting
    avg_hours_dwell = int(avg_hours_dwell)
    avg_minutes_dwell = int(avg_minutes_dwell)
    avg_seconds_dwell = round(avg_seconds_dwell)  # Properly round seconds

    # Print or return the formatted result
    print("final", avg_hours_dwell, avg_minutes_dwell, avg_seconds_dwell)
    
    if domain == "all" and (company =="Urlaubsguru" or company=="5vorflug"):
        avg_hours_dwell = int(avg_hours_dwell/2)
        avg_minutes_dwell = int(avg_minutes_dwell/2)
        avg_seconds_dwell = round(avg_seconds_dwell/2)  # Properly round seconds
    
    for pt in processing_times:
        hours, minutes, seconds = time_format(pt)
        total_processing_time_sec += seconds
        total_processing_time_mins += minutes
        total_processing_time_hour += hours

    # Convert extra seconds into minutes
    total_processing_time_mins += total_processing_time_sec // 60
    total_processing_time_sec = total_processing_time_sec % 60

    # Convert extra minutes into hours
    total_processing_time_hour += total_processing_time_mins // 60
    total_processing_time_mins = total_processing_time_mins % 60 
    
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
    
    total_seconds = (total_processing_time_hour * 3600) + (total_processing_time_min * 60) + total_processing_time_seconds

    # Divide the total seconds by days_in_range to get average seconds per day
    avg_seconds_per_day = total_seconds / days_in_range

    # Now convert avg_seconds_per_day back to hours, minutes, seconds
    avg_hours = int(avg_seconds_per_day // 3600)
    avg_minutes = int((avg_seconds_per_day % 3600) // 60)
    avg_seconds = int(avg_seconds_per_day % 60)
    print(avg_hours,avg_minutes,avg_seconds)

    processing_time_trend = [
        {"interval_start": f"{interval}m", "total_processing_time_sec": total}
        for interval, total in sorted(interval_data.items())
    ]
    # Calculate processing time trend with interval ranges
    processing_time_trend = [
        {
            "interval_start": f"{interval}m",
            "interval_end": f"{interval + 10}m",
            # "total_processing_time_sec": f"{str(int(total/60)).zfill(2)}:{str(int(total % 60)).zfill(2)}"
            "total_processing_time_sec": f"{str(int(total // 3600)).zfill(2)}:{str(int((total % 3600) // 60)).zfill(2)}:{str(int(total % 60))}"
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
    
    if domain == "all":
        # Filter data based on the interval (date) column
        sales_email_recieved = prev_email_query.with_entities(
            func.sum(EmailData.received)
        ).filter(
            EmailData.date.between(start_date, end_date),
            EmailData.customer.notlike("%Service%")
        ).scalar() or 0
        
        service_email_recieved = prev_email_query.with_entities(
            func.sum(EmailData.received)
        ).filter(
            EmailData.date.between(start_date, end_date),
            EmailData.customer.like("%Service%")
        ).scalar() or 0
        
        sale_email_new_recieved = prev_email_query.with_entities(
            func.sum(EmailData.new_received)
        ).filter(
            EmailData.date.between(start_date, end_date),
            EmailData.customer.notlike("%Service%")
        ).scalar() or 0
        
        service_email_new_recieved = prev_email_query.with_entities(
            func.sum(EmailData.new_received)
        ).filter(
            EmailData.date.between(start_date, end_date),
            EmailData.customer.like("%Service%")
        ).scalar() or 0
        
        total_emails = sales_email_recieved+service_email_recieved+sale_email_new_recieved+service_email_new_recieved
        
        sales_service_level_gross = prev_email_query.with_entities(
            func.avg(EmailData.service_level_gross)
        ).filter(
            EmailData.date.between(start_date, end_date),
            EmailData.customer.notlike("%Service%")
        ).scalar() or 0
        
        service_service_level_gross = prev_email_query.with_entities(
            func.avg(EmailData.service_level_gross)
        ).filter(
            EmailData.date.between(start_date, end_date),
            EmailData.customer.like("%Service%")
        ).scalar() or 0
        all_sla = (sales_service_level_gross * (sales_email_recieved+sale_email_new_recieved))+(service_service_level_gross * (service_email_recieved+service_email_new_recieved))
        print(total_emails, sales_service_level_gross, service_service_level_gross)
        
        print(all_sla)
        
        service_level_gross = all_sla/total_emails
    

    return {
        "email recieved": email_recieved + email_new_recieved,
        "email sent": email_answered,
        "email new cases": new_cases,
        "email archived": email_archieved,
        "SL Gross": round(service_level_gross, 2),
        # "New Sent": new_sent,
        # "Total Dwell Time (sec)": f"{int(total_dwell_hours)}h{int(total_dwell_min)}m{int(total_dwell_time_seconds)}s" 
        # if total_processing_time_min > 1 else f"0m{int(total_processing_time_seconds)}s",
        "Total Dwell Time (sec)": time_formatter(avg_hours_dwell, avg_minutes_dwell, avg_seconds_dwell),
        "Total Processing Time (sec)": time_formatter(avg_hours, avg_minutes, avg_seconds),
        "Total Dwell Time (dec)": round((avg_hours_dwell*3600+avg_minutes_dwell*60+avg_seconds_dwell) / 60, 2),
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
        elif company=="Urlaubsguru":
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%Guru %") 
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%Guru %")
            )
        elif "UrlaubsguruKF" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%GuruKF%") 
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%GuruKF%")
            )
        elif "Bild" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%Bild%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%Bild%")  
            )
        elif "ADAC" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%ADAC%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%ADAC%")  
            )
        elif "Galeria" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%Galeria%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%Galeria%")  
            )
        elif "Urlaub" in company:
            query = db.query(WorkflowReportGuruKF).filter(
            WorkflowReportGuruKF.customer.like(f"%Urlaub%")  
            )
            email_query = db.query(EmailData).filter(
            EmailData.customer.like(f"%Urlaub%")  
            )
        else:
            query = db.query(WorkflowReportGuruKF)
            email_query = db.query(EmailData)
    else:
        accessible_companies, filters, email_filter = domains_checker_email(db, user.id, filter_5vf="5vorFlug", filter_bild="Bild")
        # # print("Filters: ", filters)
        if filters:
            query = db.query(WorkflowReportGuruKF).filter(or_(*filters))
            email_query = db.query(EmailData).filter(or_(*email_filter))
        else:
            query = db.query(WorkflowReportGuruKF)
            email_query = db.query(EmailData)
            
        if company!="all":
            if "5vorflug" in company and "5vorflug" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like("%5vorFlug%")  
                )
                email_query = email_query.filter(
                EmailData.customer.like("%5vorFlug%")  
                )
            elif company=="Urlaubsguru" and "guru" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like(f"%Guru %")  
                )
                email_query = email_query.filter(
                EmailData.customer.like(f"%Guru %")
                )
            elif company=="UrlaubsguruKF" and "guru_kf" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like(f"%GuruKF%")  
                )
                email_query = email_query.filter(
                EmailData.customer.like(f"%GuruKF%")
                )
            elif "Bild" in company and "bild" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like(f"%Bild%")  
                )
                email_query = email_query.filter(
                EmailData.customer.like(f"%Bild%")  
                )
            elif "ADAC" in company and "ADAC" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like(f"%ADAC%")  
                )
                email_query = email_query.filter(
                EmailData.customer.like(f"%ADAC%")  
                )
            elif "Galeria" in company and "Galeria" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like(f"%Galeria%")  
                )
                email_query = email_query.filter(
                EmailData.customer.like(f"%Galeria%")  
                )
            elif "Urlaub" in company and "Urlaub" in accessible_companies:
                query = query.filter(
                WorkflowReportGuruKF.customer.like(f"%Urlaub%")  
                )
                email_query = email_query.filter(
                EmailData.customer.like(f"%Urlaub%")  
                )
            else:
                return {
                    "email recieved": 0,
                    "prev email recieved": 0,
                    "email recieved change": 0,
                    "email answered": 0,
                    "prev email answered": 0, 
                    "email answered change": 0,
                    "email archived": 0,
                    "prev email archived": 0,
                    "email archived change": 0,
                }
                        
    if domain != "all":
        if company in ["ADAC", "Galeria", "Urlaub"]:
            query = query
            email_query = email_query
            # email_query = email_query.filter(EmailData.customer.like(f"%{domain}%"))
        else:
            if domain=="Sales" :
                query = query.filter(WorkflowReportGuruKF.customer.notlike(f"%Service%"))
                email_query = email_query.filter(EmailData.customer.notlike(f"%Service%"))
                
            else:
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
    if is_admin_or_employee :
        if "5vorflug" in company:
            query = db.query(AllQueueStatisticsData).filter(
            AllQueueStatisticsData.customer.like("%5vFlug%")  
        )
        elif company=="Urlaubsguru":
            query = db.query(AllQueueStatisticsData).filter(
            AllQueueStatisticsData.customer.like(f"%Guru%"),
            AllQueueStatisticsData.customer.notlike(f"%GuruKF%")
            )
        elif company=="UrlaubsguruKF":
            query = db.query(AllQueueStatisticsData).filter(
            AllQueueStatisticsData.customer.like(f"%GuruKF%")
            )
        elif "Bild" in company:
            query = db.query(AllQueueStatisticsData).filter(
            AllQueueStatisticsData.customer.like("%Bild%")  
        )
        elif "Galeria" in company:
            query = db.query(AllQueueStatisticsData).filter(
            AllQueueStatisticsData.customer.like(f"%Galeria%")  
        )
        elif "ADAC" in company:
            query = db.query(AllQueueStatisticsData).filter(
            AllQueueStatisticsData.customer.like(f"%ADAC%")  
        )
        elif "Urlaub" in company:
            query = db.query(AllQueueStatisticsData).filter(
            AllQueueStatisticsData.customer.like(f"%Urlaub%")  
        )
        else:
            query = db.query(AllQueueStatisticsData)
        total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
        print("excecuted for admin or guru")
    else:
        accessible_companies, filters, summe_filters = domains_checker(db, user.id, filter_5vf="5vorFlug", filter_bild="BILD")
        print("Accessible companies: ", accessible_companies)
        if summe_filters:
            query = db.query(AllQueueStatisticsData).filter(or_(*summe_filters))
            total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
        else:
            query = db.query(AllQueueStatisticsData)
            total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
        
        if company != "all":
            if "5vorflug" in company and "5vorflug" in accessible_companies:
                print("executing for 5vf")
                query = query.filter(AllQueueStatisticsData.customer.like(f"%5vFlug%"))
                total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
            elif company=="Urlaubsguru"  and "guru" in accessible_companies:
                print("executing for guru")
                query = query.filter(AllQueueStatisticsData.customer.like(f"%Guru%"),
            AllQueueStatisticsData.customer.notlike(f"%GuruKF%"))
                total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
            elif company=="UrlaubsguruKF"  and "guru_kf" in accessible_companies:
                print("executing for guru")
                query = query.filter(AllQueueStatisticsData.customer.like(f"%GuruKF%"))
                total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
            elif "Bild" in company and "bild" in accessible_companies:
                print("executing for bild")
                query = query.filter(AllQueueStatisticsData.customer.like("%Bild%"))
                total_call_reasons_query = db.query(func.sum(GuruCallReason.total_calls))
            elif "Galeria" in company and "Galeria" in accessible_companies:
                query = query.filter(
                AllQueueStatisticsData.customer.like(f"%Galeria%")  
                )
            elif "ADAC" in company and "ADAC" in accessible_companies:
                query = query.filter(
                AllQueueStatisticsData.customer.like(f"%ADAC%")  
                )
            elif "Urlaub" in company and "Urlaub" in accessible_companies:
                query = query.filter(
                AllQueueStatisticsData.customer.like(f"%Urlaub%")  
                )
            else:
                return {
                    "sales_metrics": {
                        "calls_offered": 0,
                        "calls_handled": 0,
                        "ACC": 0,
                        "SL": 0,
                        "AHT_sec": 0,
                        "longest_waiting_time_sec": 0,
                    },
                    "service_metrics": {
                        "calls_offered": 0,
                        "calls_handled": 0,
                        "ACC": 0,
                        "SL": 0,
                        "AHT_sec": 0,
                        "longest_waiting_time_sec": 0,
                    },
                    "average handling time": 0,
                    "Total outbound calls": 0,
                }
    if domain != "all":
        if company in ["ADAC", "Galeria", "Urlaub"]:
            query = query
            # email_query = email_query.filter(EmailData.customer.like(f"%{domain}%"))
        else:
            query = query.filter(AllQueueStatisticsData.customer.like(f"%{domain}%"))
    
    if start_date is None:
        avg_handling_time = query.with_entities(
        func.avg(
            AllQueueStatisticsData.avg_handling_time_inbound
        )
        ).scalar() or 0
        
        total_talk_time = query.with_entities(
            func.sum(
                AllQueueStatisticsData.total_outbound_talk_time_destination
            )
        ).scalar() or 0
        
        total_outbound_calls = query.with_entities(
            func.sum(
                AllQueueStatisticsData.outbound
            )
        ).scalar() or 0
        
        # Query for Sale Calls
        sale_metrics = query.with_entities(
            func.sum(AllQueueStatisticsData.offered).label("sale_calls_offered"),
            func.sum(AllQueueStatisticsData.accepted).label("sale_calls_handled"),
            func.avg(AllQueueStatisticsData.accepted / func.nullif(AllQueueStatisticsData.offered, 1) * 100).label("sale_ACC"),
            func.avg(AllQueueStatisticsData.sla_20_20).label("sale_SL"),
            func.avg(AllQueueStatisticsData.avg_handling_time_inbound ).label("sale_AHT_sec"),
            func.max(AllQueueStatisticsData.max_wait_time).label("sale_longest_waiting_time_sec"),
            func.sum(AllQueueStatisticsData.total_outbound_talk_time_destination).label("sale_total_talk_time_sec")
        ).filter(AllQueueStatisticsData.customer.like("%Sales%")).first()
        
        # Query for Service Calls
        service_metrics = query.with_entities(
            func.sum(AllQueueStatisticsData.offered).label("service_calls_offered"),
            func.sum(AllQueueStatisticsData.accepted).label("service_calls_handled"),
            func.avg(AllQueueStatisticsData.accepted / func.nullif(AllQueueStatisticsData.offered, 1) * 100).label("service_ACC"),
            func.avg(AllQueueStatisticsData.sla_20_20).label("service_SL"),
            func.avg(AllQueueStatisticsData.avg_handling_time_inbound).label("service_AHT_sec"),
            func.max(AllQueueStatisticsData.max_wait_time).label("service_longest_waiting_time_sec"),
            func.sum(AllQueueStatisticsData.total_outbound_talk_time_destination).label("service_total_talk_time_sec")
        ).filter(AllQueueStatisticsData.customer.like("%Service%")).first()
        
    else:
        avg_handling_time = query.with_entities(
            func.avg(
                AllQueueStatisticsData.avg_handling_time_inbound
            )
        ).filter(
            AllQueueStatisticsData.date.between(start_date, end_date)
        ).scalar() or 0
        
        total_talk_time = query.with_entities(
            func.sum(
                AllQueueStatisticsData.total_outbound_talk_time_destination
            )
        ).filter(
            AllQueueStatisticsData.date.between(start_date, end_date)
        ).scalar() or 0
        
        total_outbound_calls = query.with_entities(
            func.sum(
                AllQueueStatisticsData.outbound
            )
        ).filter(
            AllQueueStatisticsData.date.between(start_date, end_date)
        ).scalar() or 0
        
        # Query for Sale Calls
        sale_metrics = query.with_entities(
            func.sum(AllQueueStatisticsData.offered).label("sale_calls_offered"),
            func.sum(AllQueueStatisticsData.accepted).label("sale_calls_handled"),
            func.avg(AllQueueStatisticsData.accepted / func.nullif(AllQueueStatisticsData.offered, 0) * 100).label("sale_ACC"),
            func.avg(AllQueueStatisticsData.sla_20_20).label("sale_SL"),
            func.avg(AllQueueStatisticsData.avg_handling_time_inbound).label("sale_AHT_sec"),
            func.max(AllQueueStatisticsData.max_wait_time).label("sale_longest_waiting_time_sec"),
            func.sum(AllQueueStatisticsData.total_outbound_talk_time_destination).label("sale_total_talk_time_sec")
        ).filter(AllQueueStatisticsData.customer.notlike("%Service%"), AllQueueStatisticsData.date.between(start_date, end_date)).first()
        
        # Query for Service Calls
        service_metrics = query.with_entities(
            func.sum(AllQueueStatisticsData.offered).label("service_calls_offered"),
            func.sum(AllQueueStatisticsData.accepted).label("service_calls_handled"),
            func.avg(AllQueueStatisticsData.accepted / func.nullif(AllQueueStatisticsData.offered, 0) * 100).label("service_ACC"),
            func.avg(AllQueueStatisticsData.sla_20_20).label("service_SL"),
            func.avg(AllQueueStatisticsData.avg_handling_time_inbound).label("service_AHT_sec"),
            func.max(AllQueueStatisticsData.max_wait_time).label("service_longest_waiting_time_sec"),
            func.sum(AllQueueStatisticsData.total_outbound_talk_time_destination).label("service_total_talk_time_sec")
        ).filter(AllQueueStatisticsData.customer.like("%Service%"), AllQueueStatisticsData.date.between(start_date, end_date)).first()
        
        # “All” value = (Value1 × Calls1 + Value2 × Calls2) / Total Calls
        acc_calls = ((sale_metrics.sale_ACC or 0) * (sale_metrics.sale_calls_offered or 0))+((service_metrics.service_ACC or 0) * (service_metrics.service_calls_offered or 0))
        sla_calls = ((sale_metrics.sale_SL or 0) * (sale_metrics.sale_calls_offered or 0))+((service_metrics.service_SL or 0) * (service_metrics.service_calls_offered or 0))
        total_calls = (sale_metrics.sale_calls_offered or 0) + (service_metrics.service_calls_offered or 0)
        all_acc = round(acc_calls/(total_calls if total_calls > 0 else 1), 2)
        all_sla = round(sla_calls/(total_calls if total_calls > 0 else 1), 2)
        # print(all_sla, total_calls)
        # print("All acc: ", all_acc)
        # print("All sla: ", all_sla)
    return {
        "all_metrics": {
            "calls_offered": (sale_metrics.sale_calls_offered or 0) + (service_metrics.service_calls_offered or 0),
            "calls_handled": (sale_metrics.sale_calls_handled or 0) + (service_metrics.service_calls_handled or 0),
            "avg ACC": all_acc,
            "avg SL": all_sla,
            "avg AHT_sec": round(((sale_metrics.sale_AHT_sec/60 if sale_metrics.sale_AHT_sec else 0)+(service_metrics.service_AHT_sec/60 if service_metrics.service_AHT_sec else 0))/2 or 0, 2),
            "longest_waiting_time_sec": round(
                (
                    (sale_metrics.sale_longest_waiting_time_sec or 0) / 60 
                    if (sale_metrics.sale_longest_waiting_time_sec or 0) > (service_metrics.service_longest_waiting_time_sec or 0) 
                    else (service_metrics.service_longest_waiting_time_sec or 0) / 60
                ) or 0, 
)
            # "total_talk_time_sec": round((sale_metrics.sale_total_talk_time_sec/60 if sale_metrics.sale_total_talk_time_sec else 0) or 0, 2)
        },
        "sales_metrics": {
            "calls_offered": sale_metrics.sale_calls_offered or 0,
            "calls_handled": sale_metrics.sale_calls_handled or 0,
            "ACC": round(sale_metrics.sale_ACC or 0, 2),
            "SL": round(sale_metrics.sale_SL or 0, 2),
            "AHT_sec": round((sale_metrics.sale_AHT_sec/60 if sale_metrics.sale_AHT_sec else 0) or 0, 2),
            "longest_waiting_time_sec": round((sale_metrics.sale_longest_waiting_time_sec/60 if sale_metrics.sale_longest_waiting_time_sec else 0) or 0, 1 ),
            # "total_talk_time_sec": round((sale_metrics.sale_total_talk_time_sec/60 if sale_metrics.sale_total_talk_time_sec else 0) or 0, 2)
        },
        "service_metrics": {
            "calls_offered": service_metrics.service_calls_offered or 0,
            "calls_handled": service_metrics.service_calls_handled or 0,
            "ACC": round(service_metrics.service_ACC or 0, 2),
            "SL": round(service_metrics.service_SL or 0, 2),
            "AHT_sec": round((service_metrics.service_AHT_sec/60 if service_metrics.service_AHT_sec else 0) or 0, 2),
            "longest_waiting_time_sec": round(service_metrics.service_longest_waiting_time_sec/60 if service_metrics.service_longest_waiting_time_sec else 0, 2) or 0 or 0,
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
            order_query = db.query(GuruTask).filter(GuruTask.customer.like("%5VFL%"))
            
        elif company=="Urlaubsguru":
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like(f"%Guru%")
        )
            order_query = db.query(GuruTask).filter(GuruTask.customer.like(f"%Guru%"))
        elif "Bild" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like("%BILD%")  
        )
            order_query = db.query(GuruTask).filter(GuruTask.customer.like("%BILD%"))
        elif "ADAC" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like("%ADAC%")  
        )
            order_query = db.query(GuruTask).filter(GuruTask.customer.like("%ADAC%"))
        elif "Galeria" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like(f"%Galeria%")  
        )
            order_query = db.query(GuruTask).filter(GuruTask.customer.like(f"%Galeria%"))
        elif "Urlaub" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like("%Urlaub%")  
        )
            order_query = db.query(GuruTask).filter(GuruTask.customer.like("%Urlaub%"))
        else:
            query = db.query(SoftBookingKF)
            order_query = db.query(GuruTask)
    else:
        accessible_companies, filters, order_filters = domains_checker_booking(db, user.id, filter_5vf="5vF", filter_bild="BILD")
        # print("Filters: ", filters)
        if filters:
            query = db.query(SoftBookingKF).filter(or_(*filters))
            order_query = db.query(GuruTask).filter(or_(*order_filters))
        else:
            query = db.query(SoftBookingKF)
            order_query = db.query(GuruTask)
        if company!="all":
            if "5vorflug" in company and "5vorflug" in accessible_companies:
                query = query.filter(
                SoftBookingKF.customer.like("%5vF%")  
            )
                order_query = order_query.filter(GuruTask.customer.like("%5VFL%"))
                
            elif company=="Urlaubsguru" and "guru" in accessible_companies:
                query = query.filter(
                SoftBookingKF.customer.like(f"%Guru%")
            )
                order_query = order_query.filter(GuruTask.customer.like(f"%Guru%"))
            elif "Bild" in company and "bild" in accessible_companies:
                query = query.filter(
                SoftBookingKF.customer.like("%BILD%")  
            )
                order_query = order_query.filter(GuruTask.customer.like("%BILD%"))
            elif "ADAC" in company and "ADAC" in accessible_companies:
                query = query.filter(
                SoftBookingKF.customer.like("%ADAC%")  
            )
                order_query = order_query.filter(GuruTask.customer.like("%ADAC%"))
            elif "Galeria" in company and "Galeria" in accessible_companies:
                query = query.filter(
                SoftBookingKF.customer.like(f"%Galeria%")  
            )
                order_query = order_query.filter(GuruTask.customer.like(f"%Galeria%"))
            elif "Urlaub" in company and "Urlaub" in accessible_companies:
                query = query.filter(
                SoftBookingKF.customer.like("%Urlaub%")  
            )
                order_query = order_query.filter(GuruTask.customer.like("%Urlaub%"))
            
            else:
                return {
                    "Total Bookings": 0,
                    "Booked": 0,
                    "Cancelled count": 0,
                    "Pending": 0,
                    "OP": 0,
                    "RQ": 0,
                    "SB": 0,
                    "SB Booking Rate (%)": 0,
                    "Processing time": 0,
                    "Booking status": {
                        "Booked": 0,
                        "Cancelled": 0,
                        "Pending": 0,
                        "OP/RQ": 0,
                        "SB": 0
                    }
                }
            
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
        booked_count = query.with_entities(func.count(SoftBookingKF.status)).filter((SoftBookingKF.status == booked) | (SoftBookingKF.status == "RF")).scalar() or 0
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
        # avg_duration = order_query.with_entities(func.avg(OrderJoin.duration)).filter(
        #     OrderJoin.task_created.isnot(None), 
        #     OrderJoin.task_type.isnot(None), 
        #     OrderJoin.date.between(start_date_order, end_date_order),
        #     func.strftime('%H:%M', OrderJoin.time_modified).between('08:00', '21:30')).scalar() or 0
    else:
        total_bookings = query.with_entities(func.count(SoftBookingKF.original_status)).filter(SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        booked_count = query.with_entities(func.count(SoftBookingKF.status)).filter((SoftBookingKF.status == booked) | (SoftBookingKF.status == "RF"), SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
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
        # avg_duration = order_query.with_entities(func.avg(OrderJoin.duration)).filter(
        #     OrderJoin.task_created.isnot(None), 
        #     OrderJoin.task_type.isnot(None), 
        #     OrderJoin.date.between(start_date_order, end_date_order),
        #     func.strftime('%H:%M', OrderJoin.time_modified).between('08:00', '21:30')).scalar() or 0
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
        # "avg_duration in minutes": round(avg_duration, 2) if avg_duration else 0,
        "SB Booking Rate (%)": 100 if sb_booking_rate > 100 else round(sb_booking_rate,2),
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
            order_query = db.query(GuruTask).filter(GuruTask.customer.like("%5VFL%"))
            
        elif company=="Urlaubsguru":
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like(f"%Guru%")
        )
            order_query = db.query(GuruTask).filter(GuruTask.customer.like(f"%Guru%"))
        elif "Bild" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like("%BILD%")  
        )
            order_query = db.query(GuruTask).filter(GuruTask.customer.like("%BILD%"))
        elif "ADAC" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like("%ADAC%")  
        )
            order_query = db.query(GuruTask).filter(GuruTask.customer.like("%ADAC%"))
        elif "Galeria" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like(f"%Galeria%")  
        )
            order_query = db.query(GuruTask).filter(GuruTask.customer.like(f"%Galeria%"))
        elif "Urlaub" in company:
            query = db.query(SoftBookingKF).filter(
            SoftBookingKF.customer.like("%Urlaub%")  
        )
            order_query = db.query(GuruTask).filter(GuruTask.customer.like("%Urlaub%"))
        else:
            query = db.query(SoftBookingKF)
            order_query = db.query(GuruTask)
    else:
        accessible_companies, filters, order_filters = domains_checker_booking(db, user.id, filter_5vf="5vF", filter_bild="BILD")
        # print("Filters: ", filters)
        if filters:
            query = db.query(SoftBookingKF).filter(or_(*filters))
            order_query = db.query(GuruTask).filter(or_(*order_filters))
        else:
            query = db.query(SoftBookingKF)
            order_query = db.query(GuruTask)
        if company!="all":
            if "5vorflug" in company and "5vorflug" in accessible_companies:
                query = query.filter(
                SoftBookingKF.customer.like("%5vF%")  
            )
                order_query = order_query.filter(GuruTask.customer.like("%5VFL%"))
                
            elif company=="Urlaubsguru" and "guru" in accessible_companies:
                query = query.filter(
                SoftBookingKF.customer.like(f"%Guru%")
            )
                order_query = order_query.filter(GuruTask.customer.like(f"%Guru%"))
            elif "Bild" in company and "bild" in accessible_companies:
                query = query.filter(
                SoftBookingKF.customer.like("%BILD%")  
            )
                order_query = order_query.filter(GuruTask.customer.like("%BILD%"))
            elif "ADAC" in company and "ADAC" in accessible_companies:
                query = query.filter(
                SoftBookingKF.customer.like("%ADAC%")  
            )
                order_query = order_query.filter(GuruTask.customer.like("%ADAC%"))
            elif "Galeria" in company and "Galeria" in accessible_companies:
                query = query.filter(
                SoftBookingKF.customer.like(f"%Galeria%")  
            )
                order_query = order_query.filter(GuruTask.customer.like(f"%Galeria%"))
            elif "Urlaub" in company and "Urlaub" in accessible_companies:
                query = query.filter(
                SoftBookingKF.customer.like("%Urlaub%")  
            )
                order_query = order_query.filter(GuruTask.customer.like("%Urlaub%"))
            
            else:
                return {
                    "Total Bookings change": 0,
                    "Pending change": 0,
                    "SB Booking Rate (%) change": 0
                }
            
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
        booked_count = query.with_entities(func.count(SoftBookingKF.status)).filter((SoftBookingKF.status == booked) | (SoftBookingKF.status == "RF"), SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
        cancelled_count = query.with_entities(func.count(SoftBookingKF.status)).filter(SoftBookingKF.status == cancelled, SoftBookingKF.service_creation_time.between(start_date, end_date)).scalar() or 0
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
    
    # Check if company is Urlaubsguru - return zeros if not
    if company != "Urlaubsguru":
        return {
            "organisch_conversion": "0%",
            "cb_conversion": "0%",
            "Conversion Performance":{
                    "total_calls": 0,
                    "organisch_wrong_call": 0,
                    "organisch_accepted_call": 0,
                    "organisch_bookings": 0,
                    "cb_wrong_call": 0,
                    "cb_accepted_call": 0,
                    "cb_bookings": 0,
                }
        }
    
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
    if user_domains=="urlaubsguru":
        accessible_companies.append("guru")
    if "urlaubsguru" in user_domains:
        accessible_companies.append("guru")
    if "gurukf" in user_domains:
        # print("gurukf found")
        accessible_companies.append("guru_kf")
    if "5vorflug" in user_domains:
        accessible_companies.append("5vorflug")
    if "bild" in user_domains:
        accessible_companies.append("bild")
    if "adac" in user_domains:
        accessible_companies.append("ADAC")
    if "galeria" in user_domains:
        accessible_companies.append("Galeria")
    if "urlaub" in user_domains:
        accessible_companies.append("Urlaub")
    # Determine user access level
    email_filter = current_user.get("email")
    # email_contains_5vflug = "5vorflug" in email_filter
    # email_contains_bild = "bild" in email_filter
    is_guru_email = "urlaubsguru" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        # Only process Urlaubsguru since we already checked company == "Urlaubsguru"
        # Use broader query to match original behavior
        query = db.query(BookingData)
        sale_query = db.query(QueueStatistics).filter(
            or_(
                QueueStatistics.queue_name.like("%Urlaubsguru%"),
                QueueStatistics.queue_name.like("%Holidayguru%"),
            ),
            QueueStatistics.queue_name.notlike("%Service%")
        )
    else:
        # Check if user has permission for Urlaubsguru
        print(accessible_companies)
        if (any(domain=="guru" for domain in accessible_companies) and (company=="Urlaubsguru")):
            print("Permission granted for 'guru'. Skipping restricted company checks.")
            query = db.query(BookingData)
            sale_query = db.query(QueueStatistics).filter(
                or_(
                    QueueStatistics.queue_name.like("%Urlaubsguru%"),
                    QueueStatistics.queue_name.like("%Holidayguru%"),
                ),
                QueueStatistics.queue_name.notlike("%Service%"))
        else:
            print("executing else")
            return {
                "organisch_conversion": "0%",
                "cb_conversion": "0%",
                "Conversion Performance":{
                    "total_calls": 0,
                    "organisch_wrong_call": 0,
                    "organisch_accepted_call": 0,
                    "organisch_bookings": 0,
                    "cb_wrong_call": 0,
                    "cb_accepted_call": 0,
                    "cb_bookings": 0,
                }
            }

    if start_date is None:
        # new conversion
        cb_accepted_calls = sale_query.with_entities(func.sum(QueueStatistics.accepted)).scalar() or 0
        og_accepted_calls = sale_query.with_entities(func.sum(QueueStatistics.accepted)).scalar() or 0
        
        cb_call_reason_booking = db.query(func.sum(GuruCallReason.cb_wrong_call)).scalar() or 0
        
        cb_wrong_call = db.query(func.sum(GuruCallReason.guru_cb_booking)).scalar() or 0
        og_wrong_call = db.query(func.sum(GuruCallReason.guru_wrong)).scalar() or 0
        
        cb_booking = query.with_entities(func.count(BookingData.order_agent)).scalar() or 0
        og_booking = 0
        
        print((cb_accepted_calls+cb_call_reason_booking), cb_call_reason_booking)
        
        cb_effective_calls = (cb_accepted_calls+cb_call_reason_booking) - cb_wrong_call
        og_effective_calls = og_accepted_calls - og_wrong_call
        
        # Handle division by zero with proper exception handling
        try:
            organisch_conversion = round(og_booking/og_effective_calls, 4) if og_effective_calls > 0 else 0
        except ZeroDivisionError:
            organisch_conversion = 0
            
        try:
            cb_conversion = round(cb_booking/cb_effective_calls, 4) if cb_effective_calls > 0 else 0
        except ZeroDivisionError:
            cb_conversion = 0
        
        print("accepted_calls: ", cb_accepted_calls, og_accepted_calls)
        print("wrong_calls: ", cb_wrong_call, og_wrong_call)
        print("effective_calls: ", cb_effective_calls, og_effective_calls)
        print("bookings: ", cb_booking, og_booking)
        print("Conversion: ", cb_conversion, organisch_conversion)
    else:
        # new conversion
        cb_accepted_calls = sale_query.with_entities(func.sum(QueueStatistics.accepted)).filter(QueueStatistics.queue_name.like("%CB%"), QueueStatistics.date.between(start_date, end_date)).scalar() or 0
        og_accepted_calls = sale_query.with_entities(func.sum(QueueStatistics.accepted)).filter(QueueStatistics.queue_name.notlike("%CB%"), QueueStatistics.date.between(start_date, end_date)).scalar() or 0
        
        cb_call_reason_booking = db.query(func.sum(GuruCallReason.cb_wrong_call)).filter(GuruCallReason.date.between(start_date, end_date)).scalar() or 0
        
        cb_wrong_call = db.query(func.sum(GuruCallReason.guru_cb_booking)).filter(GuruCallReason.date.between(start_date, end_date)).scalar() or 0
        og_wrong_call = db.query(func.sum(GuruCallReason.guru_wrong)).filter(GuruCallReason.date.between(start_date, end_date)).scalar() or 0
        
        cb_booking = query.with_entities(func.count(BookingData.order_agent)).filter(BookingData.date.between(start_date, end_date)).scalar() or 0
        og_booking = 0
        
        print((cb_accepted_calls+cb_call_reason_booking), cb_call_reason_booking)
        
        cb_effective_calls = (cb_accepted_calls+cb_call_reason_booking) - cb_wrong_call
        og_effective_calls = og_accepted_calls - og_wrong_call
        
        # Handle division by zero with proper exception handling
        try:
            organisch_conversion = round(og_booking/og_effective_calls, 4) if og_effective_calls > 0 else 0
        except ZeroDivisionError:
            organisch_conversion = 0
            
        try:
            cb_conversion = round(cb_booking/cb_effective_calls, 4) if cb_effective_calls > 0 else 0
        except ZeroDivisionError:
            cb_conversion = 0
        
        print("accepted_calls: ", cb_accepted_calls, og_accepted_calls)
        print("wrong_calls: ", cb_wrong_call, og_wrong_call)
        print("effective_calls: ", cb_effective_calls, og_effective_calls)
        print("bookings: ", cb_booking, og_booking)
        print("Conversion: ", cb_conversion, organisch_conversion)
    
    return {
        "organisch_conversion": "100%" if organisch_conversion > 1 else f"{round(organisch_conversion*100, 3)}%",
        "cb_conversion": "100%" if cb_conversion > 1 else f"{round(cb_conversion*100, 3)}%",
        "Conversion Performance":{
                    "total_calls": cb_effective_calls+ og_effective_calls,
                    "organisch_wrong_call": og_wrong_call,
                    "organisch_accepted_call": og_accepted_calls,
                    "organisch_bookings": og_booking,
                    "cb_wrong_call": cb_wrong_call,
                    "cb_accepted_call": cb_accepted_calls,
                    "cb_bookings": cb_booking,
                }
    }
        

@router.get("/track_op_bookings")
async def track_op_bookings(
    start_date: Optional[date] = Query(None, description="Start date for tracking OP bookings."),
    end_date: Optional[date] = Query(None, description="End date for tracking OP bookings."),
    current_status: Optional[str] = Query(None, description="Current status for tracking OP bookings."),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)
):
    """
    Tracks OP bookings that have been updated to OK, RF, or XX and logs changes.
    Returns booking number, new status, and change date.
    """
    current_user = db.query(User).filter(User.email == current_user.get("email")).first()
    if not current_user or current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this resource.")

    op_bookings = db.query(SoftBookingKF.booking_number, SoftBookingKF.status) \
        .filter(SoftBookingKF.status == "OP").all()

    op_bookings_data = db.query(BookingData.crs_original_booking_number, BookingData.crs_status) \
        .filter(BookingData.crs_status == "OP").all()

    all_op_bookings = {b[0]: b[1] for b in op_bookings + op_bookings_data}  

    # Step 2: Check for Updates
    updated_bookings = []
    for booking_number, old_status in all_op_bookings.items():
        latest_status_entry = (
            db.query(SoftBookingKF.status, SoftBookingKF.service_creation_time)
            .filter(
                and_(
                    SoftBookingKF.booking_number == booking_number,
                    SoftBookingKF.status.in_(["OK", "RF", "XX", "OP"])
                )
            )
            .order_by(SoftBookingKF.service_creation_time.desc())  # Get the latest update
            .first()
        )

        if not latest_status_entry:
            latest_status_entry = (
                db.query(BookingData.crs_status, BookingData.order_creation_time)
                .filter(
                    and_(
                        BookingData.crs_original_booking_number == booking_number,
                        BookingData.crs_status.in_(["OK", "RF", "XX"])
                    )
                )
                .order_by(BookingData.order_creation_time.desc())
                .first()
            )

        if latest_status_entry:
            new_status, change_date = latest_status_entry 
            # Check if this change is already recorded
            existing_entry = db.query(BookingTracking).filter(
                BookingTracking.booking_number == booking_number,
                BookingTracking.current_status == new_status
            ).first()

            if not existing_entry:
                # Step 3: Log the change in BookingTracking with the correct change date
                tracking_entry = BookingTracking(
                    booking_number=booking_number,
                    previous_status="OP",
                    current_status=new_status,
                    change_date=change_date  
                )
                db.add(tracking_entry)
                db.commit()
                updated_bookings.append({
                    "booking_number": booking_number,
                    "current_status": new_status,
                    "change_date": change_date 
                }) 
    status_order = {"OK": 1, "RF": 2, "XX": 3}
    if start_date is None:
        tracked_records = db.query(
            BookingTracking.booking_number, 
            BookingTracking.previous_status, 
            BookingTracking.current_status, 
            BookingTracking.change_date
        ).order_by(case(
            {status: order for status, order in status_order.items()},
            value=BookingTracking.current_status
        ).desc(), BookingTracking.change_date.desc()).all()
    else:
        start_date_booking = datetime.combine(start_date, datetime.min.time())
        end_date_booking = datetime.combine(end_date, datetime.max.time())
        if current_status is None:
            tracked_records = db.query(
                BookingTracking.booking_number, 
                BookingTracking.previous_status, 
                BookingTracking.current_status, 
                BookingTracking.change_date
            ).filter(
                BookingTracking.change_date.between(start_date_booking, end_date_booking)
                ).order_by(case(
                {status: order for status, order in status_order.items()},
                value=BookingTracking.current_status
            ).desc(), BookingTracking.change_date.desc()).all()
        else:
            tracked_records = db.query(
                BookingTracking.booking_number, 
                BookingTracking.previous_status, 
                BookingTracking.current_status, 
                BookingTracking.change_date
            ).filter(
                BookingTracking.change_date.between(start_date_booking, end_date_booking),
                BookingTracking.current_status.like(f"{current_status}")
                ).order_by(case(
                {status: order for status, order in status_order.items()},
                value=BookingTracking.current_status
            ).desc(), BookingTracking.change_date.desc()).all()
            

    response_data = [
        {
            "booking_number": record[0],
            "previous_status": record[1],
            "current_status": record[2],
            "change_date": record[3]
        }
        for record in tracked_records
    ]

    return {
        "tracked_op_bookings": response_data
    }