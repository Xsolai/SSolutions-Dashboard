from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.models.models import GuruTask, OrderJoin, Permission, User
from app.database.db.db_connection import SessionLocal,  get_db
from sqlalchemy import func
from datetime import datetime, timedelta
from app.src.utils import get_date_range, calculate_percentage_change
from app.database.scehmas import schemas
from app.database.auth import oauth2


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
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve booking data from the database.""" 
    
    # User and Permission Validation
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    
    # Parse allowed filters
    allowed_filters = set(user_permissions.date_filter.split(",")) if user_permissions and user_permissions.date_filter else {"all", "yesterday", "last_week", "last_month", "last_year"}
    
    # Validate the requested filter
    if filter_type not in allowed_filters:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Permission Denied",
                "message": f"The filter type '{filter_type}' is not allowed for this user.",
                "allowed_filters": list(allowed_filters)
            }
        )
    
    # Determine user access level
    email_filter = current_user.get("email")
    email_contains_5vflug = "5vorFlug" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    # Date range for filtering
    start_date, end_date = get_date_range(filter_type)
    
    if is_admin_or_employee:
        query = db.query(OrderJoin).filter(
            OrderJoin.order_number.in_(
                db.query(GuruTask.order_number)
            ))
    elif email_contains_5vflug:
        print("containss")
        query = db.query(OrderJoin).filter(
            OrderJoin.order_number.in_(db.query(GuruTask.order_number)),
            OrderJoin.customer.like("%5vF%")
        )
    else:
        print("executing else containss")
        query = db.query(OrderJoin).filter(OrderJoin.order_number.in_(db.query(GuruTask.order_number)),OrderJoin.customer.notlike("%5vF%"))
       
    start_date, end_date = get_date_range(filter_type)
    
    if start_date is None:
        orders = db.query(func.count(OrderJoin.order_number)).filter(
            OrderJoin.order_number.in_(
                db.query(GuruTask.order_number)
            )
        ).scalar() or 0
        
        total_orders = query.with_entities(func.count(OrderJoin.order_number).label("total_orders")).scalar() or 0
        assign_users_by_tasks = query.with_entities(func.count(func.distinct(OrderJoin.user)).label("distinct_assign_users_by_tasks")).scalar() or 0
        total_tasks = query.with_entities(func.count(func.distinct(OrderJoin.task_type)).label("distinct_task_types")).scalar() or 0
    else:
        orders = db.query(func.count(OrderJoin.order_number)).filter(
            OrderJoin.order_number.in_(
                db.query(OrderJoin.order_number)
            ), OrderJoin.date.between(start_date, end_date)
        ).scalar() or 0
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
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve tasks data from the database."""
    
    # User and Permission Validation
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    
    # Parse allowed filters
    allowed_filters = set(user_permissions.date_filter.split(",")) if user_permissions and user_permissions.date_filter else {"all", "yesterday", "last_week", "last_month", "last_year"}
    
    # Validate the requested filter
    if filter_type not in allowed_filters:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Permission Denied",
                "message": f"The filter type '{filter_type}' is not allowed for this user.",
                "allowed_filters": list(allowed_filters)
            }
        )
    
    # Determine user access level
    email_filter = current_user.get("email")
    email_contains_5vflug = "5vorFlug" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        query = db.query(OrderJoin).filter(
            OrderJoin.order_number.in_(
                db.query(GuruTask.order_number)
            ))
    elif email_contains_5vflug:
        print("containss")
        query = db.query(OrderJoin).filter(
            OrderJoin.order_number.in_(db.query(GuruTask.order_number)),
            OrderJoin.customer.like("%5vF%")
        )
    else:
        print("executing else containss")
        query = db.query(OrderJoin).filter(OrderJoin.order_number.in_(db.query(GuruTask.order_number)),OrderJoin.customer.notlike("%5vF%"))
       
    
    start_date, end_date = get_date_range(filter_type)

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
        "Tasks by date": status_by_date_data,
        "Tasks by weekday": status_by_weekday,
    }

    
    
@router.get("/tasks_performance")
async def get_tasks_performance(
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)):
    """Endpoint to retrieve calls data from the database."""
    
    # User and Permission Validation
    user = db.query(User).filter(User.email == current_user.get("email")).first() 
    user_permissions = db.query(Permission).filter(Permission.user_id == user.id).first()
    
    # Parse allowed filters
    allowed_filters = set(user_permissions.date_filter.split(",")) if user_permissions and user_permissions.date_filter else {"all", "yesterday", "last_week", "last_month", "last_year"}
    
    # Validate the requested filter
    if filter_type not in allowed_filters:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Permission Denied",
                "message": f"The filter type '{filter_type}' is not allowed for this user.",
                "allowed_filters": list(allowed_filters)
            }
        )
    
    # Determine user access level
    email_filter = current_user.get("email")
    email_contains_5vflug = "5vorFlug" in email_filter
    is_admin_or_employee = user.role in ["admin", "employee"]
    
    if is_admin_or_employee:
        query = db.query(OrderJoin).filter(
            OrderJoin.order_number.in_(
                db.query(GuruTask.order_number)
            ))
    elif email_contains_5vflug:
        print("containss")
        query = db.query(OrderJoin).filter(
            OrderJoin.order_number.in_(db.query(GuruTask.order_number)),
            OrderJoin.customer.like("%5vF%")
        )
    else:
        print("executing else containss")
        query = db.query(OrderJoin).filter(OrderJoin.order_number.in_(db.query(GuruTask.order_number)),OrderJoin.customer.notlike("%5vF%"))
    
    start_date, end_date = get_date_range(filter_type)
    
    if start_date is None:
        assign_users_by_tasks = query.with_entities(
            OrderJoin.user.label("assign_users_by_tasks"),
            func.count(OrderJoin.task_created).label("task_count"),
        ).filter(OrderJoin.task_created.isnot(None)).group_by(OrderJoin.user).all()
        
        assign_tasks_by_date = query.with_entities(
            func.strftime('%Y-%m', OrderJoin.task_created).label('month'),
            func.count(OrderJoin.user).label("assign_tasks_by_date"),
        ).filter(OrderJoin.task_created.isnot(None)).group_by(func.strftime('%Y-%m', OrderJoin.task_created)).all()
        
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
        assign_users_by_tasks = query.with_entities(
            OrderJoin.user.label("assign_users_by_tasks"),
            func.count(OrderJoin.task_created).label("task_count"),
        ).filter(
            OrderJoin.date.between(start_date, end_date),
            OrderJoin.task_created.isnot(None)
        ).group_by(OrderJoin.user).all()
        
        assign_tasks_by_date = query.with_entities(
            func.strftime('%Y-%m', OrderJoin.task_created).label('month'),
            func.count(OrderJoin.user).label("assign_tasks_by_date"),
        ).filter(
            OrderJoin.date.between(start_date, end_date),
            OrderJoin.task_created.isnot(None)
        ).group_by(func.strftime('%Y-%m', OrderJoin.task_created)).all()
        
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
        {"date": row.date, "tasks_count": row.tasks_count}
        for row in tasks_trend
    ]
    
    upcoming_tasks_data = [
    {"date": row.date, "tasks_due": row.tasks_due}
    for row in upcoming_tasks_next_week
]
    
    return {
        "Tasks assigned to users": assign_users_by_tasks,
        "Tasks assign to users by date": assign_tasks_by_date,
        "Task creation trend": trends_data,
        "Upcoming tasks": upcoming_tasks_data,
    }
