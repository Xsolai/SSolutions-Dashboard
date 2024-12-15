from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.models.models import GuruTask
from app.database.db.db_connection import SessionLocal,  get_db
from sqlalchemy import func
from datetime import datetime, timedelta
from app.src.utils import get_date_range, calculate_percentage_change


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
    db: Session = Depends(get_db)):
    """Endpoint to retrieve booking data from the database."""
    start_date, end_date = get_date_range(filter_type)
    
    if start_date is None:
        total_orders = db.query(func.count(GuruTask.order_number).label("total_orders")).scalar() or 0
        assign_users_by_tasks = db.query(func.count(func.distinct(GuruTask.assigned_user)).label("distinct_assign_users_by_tasks")).scalar() or 0
        total_tasks = db.query(func.count(func.distinct(GuruTask.task_type)).label("distinct_task_types")).scalar() or 0
    else:
        total_orders = db.query(func.count(GuruTask.order_number).label("total_orders")).filter(GuruTask.date.between(start_date, end_date)).scalar() or 0
        assign_users_by_tasks = db.query(func.count(func.distinct(GuruTask.assigned_user)).label("distinct_assign_users_by_tasks")).filter(GuruTask.date.between(start_date, end_date)).scalar() or 0
        total_tasks = db.query(func.count(func.distinct(GuruTask.task_type)).label("distinct_task_types")).filter(GuruTask.date.between(start_date, end_date)).scalar() or 0
    return {
        "Total orders": total_orders,
        "# of assigned users": assign_users_by_tasks,
        "Tota Tasks": total_tasks,
    }
    
@router.get("/tasks_overview")
async def get_tasks_overview(
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db),
):
    """Endpoint to retrieve tasks data from the database."""
    start_date, end_date = get_date_range(filter_type)

    if start_date is None:
        # No date filter applied
        status_by_cat_data = db.query(
            GuruTask.task_type.label("tasks"),
            func.count(GuruTask.task_type).label("count"),
        ).group_by(GuruTask.task_type).all()

        status_by_date_data = db.query(
            func.strftime('%Y-%m', GuruTask.creation_time).label('month'),
            func.count(GuruTask.task_type).label("count"),
        ).group_by(func.strftime('%Y-%m', GuruTask.creation_time)).all()

        status_by_day_data = db.query(
            func.strftime('%w', GuruTask.creation_time).label('weekday'),
            func.count(GuruTask.id).label("count"),
        ).group_by(func.strftime('%w', GuruTask.creation_time)).all()
    else:
        # Date filter applied
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
        status_by_cat_data = db.query(
            GuruTask.task_type.label("tasks"),
            func.count(GuruTask.task_type).label("count"),
        ).filter(
            GuruTask.creation_time.between(start_date_str, end_date_str)
        ).group_by(GuruTask.task_type).all()

        status_by_date_data = db.query(
            func.strftime('%Y-%m', GuruTask.creation_time).label('month'),
            func.count(GuruTask.task_type).label("count"),
        ).filter(
            GuruTask.creation_time.between(start_date_str, end_date_str)
        ).group_by(func.strftime('%Y-%m', GuruTask.creation_time)).all()

        status_by_day_data = db.query(
            func.strftime('%w', GuruTask.creation_time).label('weekday'),
            func.count(GuruTask.id).label("count"),
        ).filter(
            GuruTask.creation_time.between(start_date_str, end_date_str)
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

    return {
        "Tasks by categories": status_by_cat_data,
        "Tasks by date": status_by_date_data,
        "Tasks by weekday": status_by_weekday,
    }

    
    
@router.get("/tasks_performance")
async def get_tasks_performance(
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db)):
    """Endpoint to retrieve calls data from the database."""
    start_date, end_date = get_date_range(filter_type)
    
    if start_date is None:
        assign_users_by_tasks = db.query(
            GuruTask.assigned_user.label("assign_users_by_tasks"),
            func.count(GuruTask.creation_time).label("task_count"),
        ).group_by(GuruTask.assigned_user).all()
        
        assign_tasks_by_date = db.query(
            func.strftime('%Y-%m', GuruTask.creation_time).label('month'),
            func.count(GuruTask.assigned_user).label("assign_tasks_by_date"),
        ).group_by(func.strftime('%Y-%m', GuruTask.creation_time)).all()
        
        tasks_trend = db.query(
            func.date(GuruTask.creation_time).label("date"),
            func.count(GuruTask.order_number).label("tasks_count"),
        ).group_by(func.date(GuruTask.creation_time)).all()
        
        upcoming_tasks_next_week = db.query(
            func.date(GuruTask.due_date).label("date"),
            func.count(GuruTask.id).label("tasks_due")
        ).filter(
            GuruTask.due_date >= datetime.utcnow().date(),
            GuruTask.due_date < datetime.utcnow().date() + timedelta(days=7)
        ).group_by(func.date(GuruTask.due_date)).all()

    else:
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
        
        assign_users_by_tasks = db.query(
            GuruTask.assigned_user.label("assign_users_by_tasks"),
            func.count(GuruTask.creation_time).label("task_count"),
        ).filter(
            GuruTask.creation_time.between(start_date_str, end_date_str)
        ).group_by(GuruTask.assigned_user).all()
        
        assign_tasks_by_date = db.query(
            func.strftime('%Y-%m', GuruTask.creation_time).label('month'),
            func.count(GuruTask.assigned_user).label("assign_tasks_by_date"),
        ).filter(
            GuruTask.creation_time.between(start_date_str, end_date_str)
        ).group_by(func.strftime('%Y-%m', GuruTask.creation_time)).all()
        
        tasks_trend = db.query(
            func.date(GuruTask.creation_time).label("date"),
            func.count(GuruTask.order_number).label("tasks_count"),
        ).filter(
            GuruTask.creation_time.between(start_date_str, end_date_str)
        ).group_by(func.date(GuruTask.creation_time)).all()
        
        upcoming_tasks_next_week = db.query(
            func.date(GuruTask.due_date).label("date"),
            func.count(GuruTask.id).label("tasks_due")
        ).filter(
            GuruTask.due_date >= datetime.utcnow().date(),
            GuruTask.due_date < datetime.utcnow().date() + timedelta(days=7)
        ).group_by(func.date(GuruTask.due_date)).all()
    
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
