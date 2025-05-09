from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.models.models import WorkflowReportGuruKF, User, EmailData
from app.database.db.db_connection import  get_db
from datetime import datetime, timedelta, date
from sqlalchemy import func, or_
from app.database.scehmas import schemas
from app.database.auth import oauth2
from app.src.utils import get_date_rng_subkpis, calculate_percentage_change, validate_user_and_date_permissions, domains_checker_email, time_format, time_formatter
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
    """Convert time in various formats to minutes and seconds."""
    try:
        # If the input is a float or int, treat it as minutes
        if isinstance(time, (float, int)):
            minutes = int(time)
            seconds = int((time - minutes) * 60)
            return (minutes, seconds)

        # If time is a tuple, extract the first element
        if isinstance(time, tuple):
            time = time[0]

        # Ensure it's a string before processing
        if isinstance(time, str):
            # If it's already in decimal format (e.g., "12.5"), convert to minutes
            if '.' in time:
                return (int(float(time)), int((float(time) % 1) * 60))

            # Handle time formats like 'mm:ss' or 'hh:mm:ss'
            if ':' in time:
                parts = time.split(':')
                if len(parts) == 2:
                    dt = datetime.strptime(time, "%M:%S")
                    return (dt.minute, dt.second)
                elif len(parts) == 3:
                    dt = datetime.strptime(time, "%H:%M:%S")
                    total_minutes = dt.hour * 60 + dt.minute
                    return (total_minutes, dt.second)

        # If input doesn't match any format, return (0, 0)
        return (0, 0)
    
    except Exception as e:
        print(f"Error converting time '{time}': {e}")
        return (0, 0)


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
    company: str = "all",
    domain:str = "all",
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
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
                    "Total Processing Time (min)": 0,
                    "total emails received": 0,
                    "archived emails": 0,
                    "service_level_gross": 0,
                    "daily_service_level_gross": []
                }
    
    if domain != "all":
        if domain=="Sales" :
            query = query.filter(WorkflowReportGuruKF.customer.notlike(f"%Service%"))
            email_query = email_query.filter(EmailData.customer.notlike(f"%Service%"))
            
        else:
            query = query.filter(WorkflowReportGuruKF.customer.like(f"%{domain}%"))
            email_query = email_query.filter(EmailData.customer.like(f"%{domain}%"))
            
        
    total_processing_time_seconds = 0.00001
    total_processing_time_min = 0
    total_processing_time_hour = 0
    avg_hours = 0
    avg_minutes = 0
    avg_seconds = 0
    if start_date is None:
        min_date_result = email_query.with_entities(func.min(EmailData.date)).scalar() or 0

        max_date_result = email_query.with_entities(func.max(EmailData.date)).scalar() or 0
        print(min_date_result, max_date_result)
        # Calculate days in range if we have both dates
        if min_date_result and max_date_result:
            days_in_range = (max_date_result - min_date_result).days + 1
        else:
            days_in_range = 1
            
        # print("days: ",days_in_range)
        service_level_gross = email_query.with_entities(
            func.avg(
                EmailData.service_level_gross
            )
        ).scalar() or 0
        
        processing_times = email_query.with_entities(EmailData.processing_time).all()
        # Clean the data to extract values from tuples
        processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
        # for pt in processing_times:
        #     minutes,seconds = time_to_minutes(pt)
        #     total_processing_time_seconds += seconds
        #     total_processing_time_min += minutes
        
        # total_processing_time_min += total_processing_time_seconds // 60
        for pt in processing_times:
            hours, minutes, seconds = time_format(pt)
            total_processing_time_seconds += seconds
            total_processing_time_min += minutes
            total_processing_time_hour += hours
        total_seconds = (total_processing_time_hour * 3600) + (total_processing_time_min * 60) + total_processing_time_seconds
        print(total_seconds)
        # Determine divisor: if days_in_range > 1, use days_in_range, else use number of time entries
        if days_in_range > 1:
            print("executing")
            print(days_in_range)
            divisor = days_in_range
        else:
            print("length: ",len(processing_times))
            print(max(len(processing_times), 1))
            divisor = max(len(processing_times), 1)  # Prevent division by zero

        # Compute average processing time
        avg_seconds_per_entry = total_seconds / divisor

        # Convert average seconds into HH:MM:SS format
        avg_hours, remainder = divmod(avg_seconds_per_entry, 3600)
        avg_minutes, avg_seconds = divmod(remainder, 60)

        # Ensure integer values for formatting
        avg_hours = int(avg_hours)
        avg_minutes = int(avg_minutes)
        avg_seconds = round(avg_seconds)  # Properly round seconds

        # Print or return the formatted result
        print(avg_hours, avg_minutes, avg_seconds)
            
        total_emails = query.with_entities(
            func.count(
                WorkflowReportGuruKF.id
            )
        ).scalar() or 0
        
        total_emails_recieved = email_query.with_entities(
            func.sum(
                EmailData.received
            )
        ).scalar() or 0
        
        archived = email_query.with_entities(
            func.sum(
                EmailData.archived
            )
        ).scalar() or 0
        
        # Query the latest 6 intervals (dates) and service level gross
        service_level_gross_data = email_query.with_entities(
            EmailData.date.label("interval"),
            func.avg(EmailData.service_level_gross).label("service_level_gross")
        ).group_by(EmailData.date).order_by(EmailData.interval.desc()).limit(10).all()

        # Format the service level gross data
        service_level_gross_trend = [
            {"date": row.interval, "service_level_gross": round(row.service_level_gross or 0, 2)}
            for row in service_level_gross_data
        ]
    else:
        days_in_range = (end_date - start_date).days + 1
        # print("days in range = ", days_in_range)
        service_level_gross = email_query.with_entities(
            func.avg(
                EmailData.service_level_gross
            )
        ).filter(
            EmailData.date.between(start_date, end_date)
        ).scalar() or 0
        
        processing_times = email_query.with_entities(EmailData.processing_time).filter(
            EmailData.date.between(start_date, end_date)
        ).all()
        processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
        # for pt in processing_times:
        #     minutes,seconds = time_to_minutes(pt)
        #     total_processing_time_seconds += seconds
        #     total_processing_time_min += minutes
        
        # total_processing_time_min += total_processing_time_seconds // 60
        for pt in processing_times:
            hours, minutes, seconds = time_format(pt)
            total_processing_time_seconds += seconds
            total_processing_time_min += minutes
            total_processing_time_hour += hours
        # print("total sec: ", total_processing_time_seconds)
        # total_processing_time_seconds = total_processing_time_seconds/days_in_range
        # print("after total sec: ", total_processing_time_seconds)
        # print("total min: ", total_processing_time_min)
        # total_processing_time_min = total_processing_time_min/days_in_range
        # print("after total min: ", total_processing_time_min)
        # print("total hr: ", total_processing_time_hour)
        # total_processing_time_hour = total_processing_time_hour/days_in_range
        # print("after total hr: ", total_processing_time_hour)
        # # Convert extra seconds into minutes
        # total_processing_time_min += total_processing_time_seconds // 60
        # total_processing_time_seconds = total_processing_time_seconds % 60  # Keep remaining seconds

        # # Convert extra minutes into hours
        # total_processing_time_hour += total_processing_time_min // 60
        # total_processing_time_min = total_processing_time_min % 60  # Keep remaining minutes
        total_seconds = (total_processing_time_hour * 3600) + (total_processing_time_min * 60) + total_processing_time_seconds
        print(total_seconds)
        # Determine divisor: if days_in_range > 1, use days_in_range, else use number of time entries
        if days_in_range > 1:
            print(days_in_range)
            divisor = days_in_range
        else:
            # print(max(len(processing_times), 1))
            divisor = max(len(processing_times), 1)  # Prevent division by zero

        # Compute average processing time
        avg_seconds_per_entry = total_seconds / divisor

        # Convert average seconds into HH:MM:SS format
        avg_hours, remainder = divmod(avg_seconds_per_entry, 3600)
        avg_minutes, avg_seconds = divmod(remainder, 60)

        # Ensure integer values for formatting
        avg_hours = int(avg_hours)
        avg_minutes = int(avg_minutes)
        avg_seconds = round(avg_seconds)  # Properly round seconds

        # Print or return the formatted result
        print(avg_hours, avg_minutes, avg_seconds)
        total_emails = query.with_entities(
            func.count(
                WorkflowReportGuruKF.id
            )
        ).filter(
            WorkflowReportGuruKF.date.between(start_date, end_date)
        ).scalar() or 0
        
        total_emails_recieved = email_query.with_entities(
            func.sum(
                EmailData.received
            )
        ).filter(
            EmailData.date.between(start_date, end_date)
        ).scalar() or 0
        
        archived = email_query.with_entities(
            func.sum(
                EmailData.archived
            )
        ).filter(
            EmailData.date.between(start_date, end_date)
        ).scalar() or 0
        
        # Query the latest 6 intervals (dates) and service level gross
        service_level_gross_data = email_query.with_entities(
            EmailData.date.label("interval"),
            func.avg(EmailData.service_level_gross).label("service_level_gross")
        ).filter(
            EmailData.date.between(start_date, end_date)
        ).group_by(EmailData.date).order_by(EmailData.date.desc()).limit(10).all()

        # Format the service level gross data
        service_level_gross_trend = [
            {"interval": row.interval, "service_level_gross": round(row.service_level_gross or 0, 2)}
            for row in service_level_gross_data
        ]
    
    return {
    # "Total Processing Time (sec)": f"{int(total_processing_time_min)}m{int(total_processing_time_seconds % 60)}s" 
    # if total_processing_time_min > 1 else f"0m{int(total_processing_time_seconds)}s",
    "Total Processing Time (min)": time_formatter(avg_hours, avg_minutes, avg_seconds),
    "Total Processing Time (dec)": round((avg_hours*3600+avg_minutes*60+avg_seconds) / 60, 2),
    "total emails": total_emails,
    "total emails received": total_emails_recieved,
    "archived emails": archived,
    "service_level_gross": round(service_level_gross, 2),
    "daily_service_level_gross": service_level_gross_trend
}


@router.get("/email_overview_sub_kpis")
async def get_email_overview_sub_kpis(
    company: str = "all",
    domain:str = "all",
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
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
    # User info
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    # Calculate the allowed date range based on the user's permissions
    start_date, end_date, prev_start_date, prev_end_date = get_date_rng_subkpis(db=db, current_user=current_user, start_date=start_date, end_date=end_date)
    print("dates:", start_date, end_date, prev_start_date, prev_end_date)
    
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
                    "Total Processing Time (sec)": 0,
                    "Total Processing Time (sec) change": 0,
                    "total emails recieved": 0,
                    "total emails recieved change": 0,
                    "total new cases": 0,
                    "total new cases change": 0,
                    "service_level_gross": 0,
                    "service_level_gross change": 0,
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
    total_processing_time_seconds = 0.00001
    prev_total_processing_time_seconds = 0.00001
    total_processing_time_min = 0.00001
    prev_total_processing_time_min = 0.00001
    # start_date, end_date = start_date.strftime("%d.%m.%Y"), end_date.strftime("%d.%m.%Y")
    # prev_start_date, prev_end_date = prev_start_date.strftime("%d.%m.%Y"), prev_end_date.strftime("%d.%m.%Y")
    # Normal Kpis
    service_level_gross = email_query.with_entities(
        func.avg(
            EmailData.service_level_gross
        )
    ).filter(
        EmailData.date.between(start_date, end_date)
    ).scalar() or 0
    
    processing_times = email_query.with_entities(EmailData.processing_time).filter(
        EmailData.date.between(start_date, end_date)
    ).all()
    for pt in processing_times:
        minutes,seconds = time_to_minutes(pt)
        total_processing_time_seconds += seconds
        total_processing_time_min += minutes
        
    total_processing_time_min += total_processing_time_seconds // 60
    
    total_emails = email_query.with_entities(
        func.sum(
            EmailData.received
        )
    ).filter(
        EmailData.date.between(start_date, end_date)
    ).scalar() or 0
    
    new_cases = email_query.with_entities(
        func.sum(
            EmailData.new_cases
        )
    ).filter(
        EmailData.date.between(start_date, end_date)
    ).scalar() or 0
    
    # Previous Kpis to calculate the change
    prev_service_level_gross = email_query.with_entities(
        func.avg(
            EmailData.service_level_gross
        )
    ).filter(
        EmailData.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    
    prev_processing_times = email_query.with_entities(EmailData.processing_time).filter(
        EmailData.date.between(prev_start_date, prev_end_date)
    ).all()
    prev_processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in prev_processing_times]
    for pt in processing_times:
        p_minutes,p_seconds = time_to_minutes(pt)
        prev_total_processing_time_seconds += p_seconds
        prev_total_processing_time_min += p_minutes
        
    prev_total_processing_time_min += total_processing_time_seconds // 60
    
    prev_total_emails = email_query.with_entities(
        func.sum(
            EmailData.received
        )
    ).filter(
        EmailData.date.between(prev_start_date, prev_end_date)
    ).scalar() or 0
    
    prev_new_cases = email_query.with_entities(
        func.sum(
            EmailData.new_cases
        )
    ).filter(
        EmailData.date.between(prev_start_date, prev_end_date)
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
    company: str = "all",
    domain:str = "all",
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve email KPIs from the database, limited to the latest 6 dates."""
    
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
                    "service_level_by_mailbox": [],
                    "Processing_time_by_mailbox": [],
                    "respone_by_customers": []
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
        # processing_time_by_mailbox = {}
        # for row in mailbox_processing_data:
        #     if row.mailbox not in processing_time_by_mailbox:
        #         processing_time_by_mailbox[row.mailbox] = 0

        #     # Convert processing_time to seconds and accumulate
        #     processing_time_by_mailbox[row.mailbox] += time_to_minutes((row.processing_time,))

        # # Format the results
        # pt_mailbox = [
        #     {"mailbox": mailbox, "processing_time_sec": round(total_time, 2)}
        #     for mailbox, total_time in processing_time_by_mailbox.items()
        # ]

        # # Sort by processing time in descending order
        # pt_mailbox = sorted(pt_mailbox, key=lambda x: x["processing_time_sec"], reverse=True)
        
        processing_time_by_mailbox = {}
        for row in mailbox_processing_data:
            if row.mailbox not in processing_time_by_mailbox:
                processing_time_by_mailbox[row.mailbox] = (0, 0)  # Initialize with (minutes, seconds)

            # Convert processing_time to (minutes, seconds) and accumulate
            minutes, seconds = time_to_minutes((row.processing_time,))
            total_minutes, total_seconds = processing_time_by_mailbox[row.mailbox]
            total_seconds += seconds
            total_minutes += minutes + total_seconds // 60  # Handle overflow of seconds
            total_seconds = total_seconds % 60  # Remaining seconds 
            processing_time_by_mailbox[row.mailbox] = (total_minutes, total_seconds)

        # Format the results
        pt_mailbox = [
            {
                "mailbox": mailbox,
                "processing_time": f"{minutes}m{seconds}s"
            }
            for mailbox, (minutes, seconds) in processing_time_by_mailbox.items()
        ]

        # Sort by processing time in descending order
        pt_mailbox = sorted(pt_mailbox, key=lambda x: int(x["processing_time"].split("m")[0]), reverse=True)

        
        # Query total new sent emails
        replies_data = email_query.with_entities(
            EmailData.customer.label("customer"),
            func.sum(EmailData.sent).label("sent"),
            func.sum(func.coalesce(EmailData.received, 0) + func.coalesce(EmailData.new_received, 0)).label("recieved")
        ).group_by(EmailData.customer).order_by(EmailData.sent.desc()).all()

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
        # processing_time_by_mailbox = {}
        # for row in mailbox_processing_data:
        #     if row.mailbox not in processing_time_by_mailbox:
        #         processing_time_by_mailbox[row.mailbox] = 0
            
        #     # print("Processing time: ", row.processing_time)    

        #     # Convert processing_time to seconds and accumulate
        #     processing_time_by_mailbox[row.mailbox] += time_to_minutes((row.processing_time,))

        # # Format the results
        # pt_mailbox = [
        #     {"mailbox": mailbox, "processing_time_sec": round(total_time, 2)}
        #     for mailbox, total_time in processing_time_by_mailbox.items()
        # ]

        # # Sort by processing time in descending order
        # pt_mailbox = sorted(pt_mailbox, key=lambda x: x["processing_time_sec"], reverse=True)
        
        processing_time_by_mailbox = {}
        for row in mailbox_processing_data:
            if row.mailbox not in processing_time_by_mailbox:
                processing_time_by_mailbox[row.mailbox] = (0, 0)  # Initialize with (minutes, seconds)

            # Convert processing_time to (minutes, seconds) and accumulate
            minutes, seconds = time_to_minutes((row.processing_time,))
            total_minutes, total_seconds = processing_time_by_mailbox[row.mailbox]
            total_seconds += seconds
            total_minutes += minutes + total_seconds // 60  # Handle overflow of seconds
            total_seconds = total_seconds % 60  # Remaining seconds
            processing_time_by_mailbox[row.mailbox] = (total_minutes, total_seconds)

        # Format the results
        pt_mailbox = [
            {
                "mailbox": mailbox,
                "processing_time": float(f"{minutes}.{seconds}")
            }
            for mailbox, (minutes, seconds) in processing_time_by_mailbox.items()
        ]

        # Sort by processing time in descending order
        # pt_mailbox = sorted(pt_mailbox, key=lambda x: int(x["processing_time"].split("m")[0]), reverse=True)

        
                
        # Query total new sent emails
        replies_data = email_query.with_entities(
            EmailData.customer.label("customer"),
            func.sum(EmailData.sent).label("sent"),
            func.sum(func.coalesce(EmailData.received, 0) + func.coalesce(EmailData.new_received, 0)).label("recieved")
        ).filter(
            EmailData.date.between(start_date, end_date)
        ).group_by(EmailData.customer).order_by(EmailData.sent.desc()).all()

        replies = [
        {"customer": row.customer, "sent": round(row.sent or 0, 2), "recieved": round(row.recieved or 0, 2)}
        for row in replies_data
        ]

    return {
        "service_level_by_mailbox": service_level_gross,
        "Processing_time_by_mailbox": pt_mailbox,
        "respone_by_customers": replies
    }