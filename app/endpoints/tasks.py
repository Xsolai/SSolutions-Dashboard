from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.models.models import GuruTask, GuruTask, User
from app.database.db.db_connection import SessionLocal,  get_db
from sqlalchemy import func, or_, String
from datetime import datetime, timedelta, date
from app.src.utils import validate_user_and_date_permissions, domains_checker_task
from app.database.scehmas import schemas
from app.database.auth import oauth2
from typing import Optional

router = APIRouter(
    tags=["Tasks APIS"]
)

def format_revenue(num):
    if num >= 1_000_000:
        return f"{num / 1_000_000:.2f}M"
    elif num >= 1_000:
        return f"{num / 1_000:.2f}K"
    else:
        return str(num)

@router.get("/tasks_kpis")
async def get_tasks_kpis(
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
    """Endpoint to retrieve booking data from the database.""" 
    
    # User info
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    # Calculate the allowed date range based on the user's permissions
    start_date, end_date = validate_user_and_date_permissions(db=db, current_user=current_user, start_date=start_date, end_date=end_date, include_all=include_all)
    
    # Determine user access level
    email_filter = current_user.get("email")
    is_guru_email = "urlaubsguru" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    if is_admin_or_employee:
        if "5vorflug" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like("%5VFL%"))
        elif "Urlaubsguru" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like(f"%Guru%"))
        elif "Bild" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like("%BILD%"))
        elif "Galeria" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like(f"%Galeria%"))
        elif "ADAC" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like("%ADAC%"))
        elif "Urlaub" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like("%Urlaub%"))
        else:
            query = db.query(GuruTask)
    else:
        accessible_companies, filters = domains_checker_task(db, user.id, filter_5vf="5VFL", filter_bild="BILD")
        print("Accessible companies: ", accessible_companies)
        if filters:
            query = db.query(GuruTask).filter(or_(*filters))
        else:
            query = db.query(GuruTask)
        if company!="all":
            if "5vorflug" in company and "5vorflug" in accessible_companies:
                query = query.filter(GuruTask.customer.like("%5VFL%"))
            elif "guru" in company and "guru" in accessible_companies:
                query = query.filter(GuruTask.customer.like(f"%Guru%"))
            elif "Bild" in company and "bild" in accessible_companies:
                query = query.filter(GuruTask.customer.like("%BILD%"))
            elif "Galeria" in company and "Galeria" in accessible_companies:
                query = query.filter(GuruTask.customer.like(f"%Galeria%"))
            elif "ADAC" in company and "ADAC" in accessible_companies:
                query = query.filter(GuruTask.customer.like("%ADAC%"))
            elif "Urlaub" in company and "Urlaub" in accessible_companies:
                query = query.filter(GuruTask.customer.like("%Urlaub%"))
            else:
                return {
                    "Total orders": 0,
                    "# of assigned users": 0,
                    "Task types": 0,
                }
        
    
    if start_date is None:
        total_orders = query.with_entities(func.count((GuruTask.order_number)).label("total_orders")).scalar() or 0
        assign_users_by_tasks = query.with_entities(func.count(func.distinct(GuruTask.assigned_user)).label("distinct_assign_users_by_tasks")).scalar() or 0
        total_tasks = query.with_entities(func.count(func.distinct(GuruTask.task_type)).label("distinct_task_types")).scalar() or 0
    else:
        total_orders = query.with_entities(
                func.count(GuruTask.order_number)).filter(GuruTask.date.between(start_date, end_date)).scalar()or 0
        assign_users_by_tasks = query.with_entities(func.count(func.distinct(GuruTask.assigned_user)).label("distinct_assign_users_by_tasks")).filter( GuruTask.date.between(start_date, end_date)).scalar() or 0
        total_tasks = query.with_entities(func.count(func.distinct(GuruTask.task_type)).label("distinct_task_types")).filter( GuruTask.date.between(start_date, end_date)).scalar() or 0
    return {
        # "orders": orders,
        "Total orders": total_orders,
        "# of assigned users": assign_users_by_tasks,
        "Task types": total_tasks,
        # "avg_duration in minutes": round(avg_duration, 2) if avg_duration else 0
    }
    
@router.get("/tasks_overview")
async def get_tasks_overview(
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
    """Endpoint to retrieve tasks data from the database."""
    
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
            query = db.query(GuruTask).filter(GuruTask.customer.like("%5VFL%"))
        elif "Urlaubsguru" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like(f"%Guru%"))
        elif "Bild" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like("%BILD%"))
        elif "Galeria" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like(f"%Galeria%"))
        elif "ADAC" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like("%ADAC%"))
        elif "Urlaub" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like("%Urlaub%"))
        else:
            query = db.query(GuruTask)
    else:
        accessible_companies, filters = domains_checker_task(db, user.id, filter_5vf="5VFL", filter_bild="BILD")
        print("Accessible companies: ", accessible_companies)
        if filters:
            query = db.query(GuruTask).filter(or_(*filters))
        else:
            query = db.query(GuruTask)
        if company!="all":
            if "5vorflug" in company and "5vorflug" in accessible_companies:
                query = query.filter(GuruTask.customer.like("%5VFL%"))
            elif "guru" in company and "guru" in accessible_companies:
                query = query.filter(GuruTask.customer.like(f"%Guru%"))
            elif "Bild" in company and "bild" in accessible_companies:
                query = query.filter(GuruTask.customer.like("%BILD%"))
            elif "Galeria" in company and "Galeria" in accessible_companies:
                query = query.filter(GuruTask.customer.like(f"%Galeria%"))
            elif "ADAC" in company and "ADAC" in accessible_companies:
                query = query.filter(GuruTask.customer.like("%ADAC%"))
            elif "Urlaub" in company and "Urlaub" in accessible_companies:
                query = query.filter(GuruTask.customer.like("%Urlaub%"))
            else:
                return {
                    "Tasks by categories": 0,
                    "Tasks created by date": 0,
                    "Tasks created by weekday": 0,
                }
        
    if start_date is None:
        # No date filter applied
        status_by_cat_data = query.with_entities(
            GuruTask.task_type.label("tasks"),
            func.count(GuruTask.order_number).label("count"),
        ).filter(GuruTask.task_type.isnot(None)).group_by(GuruTask.task_type).all()

        status_by_date_data = query.with_entities(
            func.strftime('%Y-%m', GuruTask.creation_time).label('month'),
            func.count(GuruTask.order_number).label("count"),
        ).group_by(func.strftime('%Y-%m', GuruTask.creation_time)).all()

        status_by_day_data = query.with_entities(
            func.strftime('%w', GuruTask.creation_time).label('weekday'),
            func.count(GuruTask.order_number).label("count"),
        ).group_by(func.strftime('%w', GuruTask.creation_time)).all()
    else:
        status_by_cat_data = query.with_entities(
            GuruTask.task_type.label("tasks"),
            func.count(GuruTask.order_number).label("count"),
        ).filter(
            GuruTask.task_type.isnot(None),
            GuruTask.date.between(start_date, end_date)
        ).group_by(GuruTask.task_type).all() 

        status_by_date_data = query.with_entities(
            func.strftime('%Y-%m', GuruTask.creation_time).label('month'),
            func.count(GuruTask.order_number).label("count"),
        ).filter(
            GuruTask.date.between(start_date, end_date)
        ).group_by(func.strftime('%Y-%m', GuruTask.creation_time)).all()

        status_by_day_data = query.with_entities(
            func.strftime('%w', GuruTask.creation_time).label('weekday'),
            func.count(GuruTask.order_number).label("count"),
        ).filter(
            
            GuruTask.date.between(start_date, end_date)
        ).group_by(func.strftime('%w', GuruTask.creation_time)).all()


    # Convert query results to a list of dictionaries
    status_by_cat_data = [{"tasks": row.tasks, "count": row.count} for row in status_by_cat_data]
    status_by_date_data = [{"month": row.month, "count": row.count} for row in status_by_date_data]

    weekday_map = {
        '0': 'Sunday',
        '1': 'Monday',
        '2': 'Tuesday',
        '3': 'Wednesday',
        '4': 'Thursday',
        '5': 'Friday',
        '6': 'Saturday'
    }

    # Convert weekday data to readable format
    status_by_weekday = [
        {"weekday": weekday_map[row.weekday], "count": row.count}
        for row in status_by_day_data
    ]
    # print("status_by_cat_data: ", status_by_cat_data)
    # print("status_by_date_data: ", status_by_date_data)
    # print("status_by_weekday: ", status_by_weekday)
    return {
        "Tasks by categories": status_by_cat_data,
        "Tasks created by date": status_by_date_data,
        "Tasks created by weekday": status_by_weekday,
    }
    
@router.get("/tasks_performance")
async def get_tasks_performance(
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
    
    if is_admin_or_employee:
        if "5vorflug" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like("%5VFL%"))
        elif "Urlaubsguru" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like(f"%Guru%"))
        elif "Bild" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like("%BILD%"))
        elif "Galeria" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like(f"%Galeria%"))
        elif "ADAC" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like("%ADAC%"))
        elif "Urlaub" in company:
            query = db.query(GuruTask).filter(GuruTask.customer.like("%Urlaub%"))
        else:
            query = db.query(GuruTask)
    else:
        accessible_companies, filters = domains_checker_task(db, user.id, filter_5vf="5VFL", filter_bild="BILD")
        print("Accessible companies: ", accessible_companies)
        if filters:
            query = db.query(GuruTask).filter(or_(*filters))
        else:
            query = db.query(GuruTask)
        if company!="all":
            if "5vorflug" in company and "5vorflug" in accessible_companies:
                query = query.filter(GuruTask.customer.like("%5VFL%"))
            elif "guru" in company and "guru" in accessible_companies:
                query = query.filter( GuruTask.customer.like(f"%Guru%"))
            elif "Bild" in company and "bild" in accessible_companies:
                query = query.filter(GuruTask.customer.like("%BILD%"))
            elif "Galeria" in company and "Galeria" in accessible_companies:
                query = query.filter(GuruTask.customer.like(f"%Galeria%"))
            elif "ADAC" in company and "ADAC" in accessible_companies:
                query = query.filter(GuruTask.customer.like("%ADAC%"))
            elif "Urlaub" in company and "Urlaub" in accessible_companies:
                query = query.filter(GuruTask.customer.like("%Urlaub%"))
            else:
                return {
                    "Tasks assigned to users": 0,
                    "Tasks assign to users by date": 0,
                    "Task creation trend": 0,
                    "Upcoming tasks": 0,
                }
                
    if start_date is None:
        assign_users_by_tasks = [
            {"assign_users_by_tasks": row[0], "task_count": row[1]}
            for row in query.with_entities(
                GuruTask.assigned_user.label("assign_users_by_tasks"),
                func.count(GuruTask.order_number).label("task_count")
            ).group_by(GuruTask.assigned_user).all()
        ]
        assign_tasks_by_date = [
            {"month":row[0], "assign_tasks_by_date":row[1]}
            for row in query.with_entities(
            func.strftime('%Y-%m', GuruTask.creation_time).label('month'),
            func.count(func.distinct(GuruTask.assigned_user)).label("assign_tasks_by_date"),
        ).filter(
            
        ).group_by(func.strftime('%Y-%m', GuruTask.creation_time)).all()
        ]
        
        tasks_trend = query.with_entities(
            func.date(GuruTask.creation_time).label("date"),
            func.count(GuruTask.order_number).label("tasks_count"),
        ).group_by(func.date(GuruTask.creation_time)).all()
        
        upcoming_tasks_next_week = query.with_entities(
            func.date(GuruTask.due_date).label("date"),
            func.count(GuruTask.order_number).label("tasks_due")
        ).filter(
            GuruTask.due_date >= datetime.utcnow().date(),
            GuruTask.due_date < datetime.utcnow().date() + timedelta(days=7),
            
        ).group_by(func.date(GuruTask.due_date)).all()

    else:
        assign_users_by_tasks = [
            {"assign_users_by_tasks": row[0], "task_count": row[1]}
            for row in query.with_entities(
                GuruTask.assigned_user.label("assign_users_by_tasks"),
                func.count(GuruTask.order_number).label("task_count")
            ).filter(GuruTask.date.between(start_date, end_date),
                     ).group_by(GuruTask.assigned_user).all()
        ]
        
        # assign_tasks_by_date = [
        #     {"month":row[0], "assign_tasks_by_date":row[1]}
        #     for row in query.with_entities(
        #     func.strftime('%Y-%m', GuruTask.task_created).label('month'),
        #     func.count((GuruTask.user)).label("assign_tasks_by_date"),
        # ).filter(
        #     GuruTask.date.between(start_date, end_date),
        #     
        # ).group_by(func.strftime('%Y-%m', GuruTask.task_created)).all()
        # ]
        assign_tasks_by_date = [
        {"month": row[0], "assign_tasks_by_date": row[1]}
        for row in query.with_entities(
            func.strftime('%Y-%m', GuruTask.creation_time).label('month'),
            func.count(func.distinct(GuruTask.assigned_user)).label("assign_tasks_by_date"),
        )
        .filter(
            GuruTask.date.between(start_date, end_date),
            
        )
        .group_by(func.strftime('%Y-%m', GuruTask.creation_time))
        .all()
    ]
        
        tasks_trend = query.with_entities(
            func.date(GuruTask.creation_time).label("date"),
            func.count(GuruTask.order_number).label("tasks_count"),
        ).filter(
            GuruTask.date.between(start_date, end_date),
            
        ).group_by(func.date(GuruTask.creation_time)).all()
        
        upcoming_tasks_next_week = query.with_entities(
            func.date(GuruTask.due_date).label("date"),
            func.count(GuruTask.order_number).label("tasks_due")
        ).filter(
            GuruTask.due_date >= datetime.utcnow().date(),
            GuruTask.due_date < datetime.utcnow().date() + timedelta(days=7),
            
        ).group_by(func.date(GuruTask.due_date)).all()
    
    # Prepare response
    trends_data = [
        {"date": str(row.date), "tasks_count": row.tasks_count}
        for row in tasks_trend
    ]
    
    upcoming_tasks_data = [
    {"date": str(row.date), "tasks_due": row.tasks_due}
    for row in upcoming_tasks_next_week
]
    
    return {
        "Tasks assigned to users": assign_users_by_tasks,
        "Tasks assign to users by date": assign_tasks_by_date,
        "Task creation trend": trends_data,
        "Upcoming tasks": upcoming_tasks_data,
    }