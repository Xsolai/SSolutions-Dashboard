from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.models.models import GuruTask, OrderJoin, User
from app.database.db.db_connection import SessionLocal,  get_db
from sqlalchemy import func
from datetime import datetime, timedelta, date
from app.src.utils import validate_user_and_date_permissions
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
    email_contains_5vflug = "5vorflug" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    # if is_admin_or_employee:
    #     query = db.query(OrderJoin).join(
    #         GuruTask, OrderJoin.order_number == GuruTask.order_number
    #     ).distinct()
    if is_admin_or_employee:
        if "5vorflug" in company:
            query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
            ).filter(OrderJoin.customer.like("%5vF%")).distinct()  
        elif "guru" in company:
            query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
            ).filter(OrderJoin.customer.notlike("%5vF%")).distinct()
        else:
            query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
            ).distinct()
    elif email_contains_5vflug:
        print("containss")
        query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
        ).filter(OrderJoin.customer.like("%5vF%")).distinct()
    else:
        print("executing else containss")
        query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
        ).filter(OrderJoin.customer.notlike("%5vF%")).distinct()
    
    if start_date is None:
        orders = db.query(func.count(OrderJoin.order_number)).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
        ).scalar() or 0
        
        total_orders = query.with_entities(func.count(OrderJoin.order_number).label("total_orders")).scalar() or 0
        assign_users_by_tasks = query.with_entities(func.count(func.distinct(OrderJoin.user)).label("distinct_assign_users_by_tasks")).scalar() or 0
        total_tasks = query.with_entities(func.count(func.distinct(OrderJoin.task_type)).label("distinct_task_types")).scalar() or 0
    else:
        orders = db.query(func.count(OrderJoin.order_number)).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
        ).filter(OrderJoin.date.between(start_date, end_date)).scalar() or 0
        total_orders = query.with_entities(func.count(OrderJoin.order_number).label("total_orders")).filter(OrderJoin.date.between(start_date, end_date)).scalar() or 0
        assign_users_by_tasks = query.with_entities(func.count(func.distinct(OrderJoin.user)).label("distinct_assign_users_by_tasks")).filter(OrderJoin.date.between(start_date, end_date)).scalar() or 0
        total_tasks = query.with_entities(func.count(func.distinct(OrderJoin.task_type)).label("distinct_task_types")).filter(OrderJoin.date.between(start_date, end_date)).scalar() or 0
    return {
        "orders": orders,
        "Total orders": total_orders,
        "# of assigned users": assign_users_by_tasks,
        "Task types": total_tasks,
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
    email_contains_5vflug = "5vorflug" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        if "5vorflug" in company:
            query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
            ).filter(OrderJoin.customer.like("%5vF%")).distinct()  
        elif "guru" in company:
            query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
            ).filter(OrderJoin.customer.notlike("%5vF%")).distinct()
        else:
            query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
            ).distinct()
    elif email_contains_5vflug:
        print("containss")
        query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
        ).filter(OrderJoin.customer.like("%5vF%")).distinct()
    else:
        print("executing else containss")
        query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
        ).filter(OrderJoin.customer.notlike("%5vF%")).distinct()

    if start_date is None:
        # No date filter applied
        status_by_cat_data = query.with_entities(
            OrderJoin.task_type.label("tasks"),
            func.count(OrderJoin.task_type).label("count"),
        ).group_by(OrderJoin.task_type).all()

        status_by_date_data = query.with_entities(
            func.strftime('%Y-%m', OrderJoin.task_created).label('month'),
            func.count(OrderJoin.task_type).label("count"),
        ).group_by(func.strftime('%Y-%m', OrderJoin.task_created)).all()

        status_by_day_data = query.with_entities(
            func.strftime('%w', OrderJoin.task_created).label('weekday'),
            func.count(OrderJoin.order_number).label("count"),
        ).group_by(func.strftime('%w', OrderJoin.task_created)).all()
    else:
        status_by_cat_data = query.with_entities(
            OrderJoin.task_type.label("tasks"),
            func.count(OrderJoin.task_type).label("count"),
        ).filter(
            OrderJoin.date.between(start_date, end_date)
        ).group_by(OrderJoin.task_type).all()

        status_by_date_data = query.with_entities(
            func.strftime('%Y-%m', OrderJoin.task_created).label('month'),
            func.count(OrderJoin.task_type).label("count"),
        ).filter(
            OrderJoin.date.between(start_date, end_date)
        ).group_by(func.strftime('%Y-%m', OrderJoin.task_created)).all()

        status_by_day_data = query.with_entities(
            func.strftime('%w', OrderJoin.task_created).label('weekday'),
            func.count(OrderJoin.order_number).label("count"),
        ).filter(
            OrderJoin.date.between(start_date, end_date)
        ).group_by(func.strftime('%w', OrderJoin.task_created)).all()

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
    email_contains_5vflug = "5vorflug" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        if "5vorflug" in company:
            query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
            ).filter(OrderJoin.customer.like("%5vF%")).distinct()  
        elif "guru" in company:
            query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
            ).filter(OrderJoin.customer.notlike("%5vF%")).distinct()
        else:
            query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
            ).distinct()
    elif email_contains_5vflug:
        print("containss")
        query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
        ).filter(OrderJoin.customer.like("%5vF%")).distinct()
    else:
        print("executing else containss")
        query = db.query(OrderJoin).join(
            GuruTask, OrderJoin.order_number == GuruTask.order_number
        ).filter(OrderJoin.customer.notlike("%5vF%")).distinct()
    
    if start_date is None:
        assign_users_by_tasks = [
            {"assign_users_by_tasks": row[0], "task_count": row[1]}
            for row in query.with_entities(
                OrderJoin.user.label("assign_users_by_tasks"),
                func.count(OrderJoin.task_created).label("task_count")
            ).filter(OrderJoin.task_created.isnot(None)).group_by(OrderJoin.user).all()
        ]
        assign_tasks_by_date = [
            {"month":row[0], "assign_tasks_by_date":row[1]}
            for row in query.with_entities(
            func.strftime('%Y-%m', OrderJoin.task_created).label('month'),
            func.count(OrderJoin.user).label("assign_tasks_by_date"),
        ).filter(
            OrderJoin.task_created.isnot(None)
        ).group_by(func.strftime('%Y-%m', OrderJoin.task_created)).all()
        ]
        
        tasks_trend = query.with_entities(
            func.date(OrderJoin.task_created).label("date"),
            func.count(OrderJoin.order_number).label("tasks_count"),
        ).filter(OrderJoin.task_created.isnot(None)).group_by(func.date(OrderJoin.task_created)).all()
        
        upcoming_tasks_next_week = query.with_entities(
            func.date(OrderJoin.task_deadline).label("date"),
            func.count(OrderJoin.order_number).label("tasks_due")
        ).filter(
            OrderJoin.task_deadline >= datetime.utcnow().date(),
            OrderJoin.task_deadline < datetime.utcnow().date() + timedelta(days=7),
            OrderJoin.task_created.isnot(None)
        ).group_by(func.date(OrderJoin.task_deadline)).all()

    else:
        assign_users_by_tasks = [
            {"assign_users_by_tasks": row[0], "task_count": row[1]}
            for row in query.with_entities(
                OrderJoin.user.label("assign_users_by_tasks"),
                func.count(OrderJoin.task_created).label("task_count")
            ).filter(OrderJoin.date.between(start_date, end_date),OrderJoin.task_created.isnot(None)
                     ).group_by(OrderJoin.user).all()
        ]
        
        assign_tasks_by_date = [
            {"month":row[0], "assign_tasks_by_date":row[1]}
            for row in query.with_entities(
            func.strftime('%Y-%m', OrderJoin.task_created).label('month'),
            func.count(OrderJoin.user).label("assign_tasks_by_date"),
        ).filter(
            OrderJoin.date.between(start_date, end_date),
            OrderJoin.task_created.isnot(None)
        ).group_by(func.strftime('%Y-%m', OrderJoin.task_created)).all()
        ]
        
        tasks_trend = query.with_entities(
            func.date(OrderJoin.task_created).label("date"),
            func.count(OrderJoin.order_number).label("tasks_count"),
        ).filter(
            OrderJoin.date.between(start_date, end_date),
            OrderJoin.task_created.isnot(None)
        ).group_by(func.date(OrderJoin.task_created)).all()
        
        upcoming_tasks_next_week = query.with_entities(
            func.date(OrderJoin.task_deadline).label("date"),
            func.count(OrderJoin.order_number).label("tasks_due")
        ).filter(
            OrderJoin.task_deadline >= datetime.utcnow().date(),
            OrderJoin.task_deadline < datetime.utcnow().date() + timedelta(days=7),
            OrderJoin.task_created.isnot(None)
        ).group_by(func.date(OrderJoin.task_deadline)).all()
    
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
