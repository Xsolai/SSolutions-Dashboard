from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.models.models import (GuruCallReason, GuruDailyCallData, 
                                        QueueStatistics, BookingData, SoftBookingKF)
from app.database.db.db_connection import SessionLocal,  get_db
from sqlalchemy import func
from app.database.scehmas import schemas
from app.database.auth import oauth2
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
        total_bookings = db.query(
            func.count(BookingData.crs_original_booking_number).label("total_bookings"),
        ).scalar() or 0
        total_soft_bookings = db.query(
            func.count(SoftBookingKF.booking_number).label("total_soft_bookings"),
        ).scalar() or 0
        avg_price = db.query(
            func.avg(BookingData.performance_element_price).label("booking_price"),
        ).scalar() or 0
        total_booking_revenue = db.query(
            func.sum(BookingData.performance_element_price).label("soft_booking_price"),
        ).scalar() or 0
        avg_sf_price = db.query(
            func.avg(SoftBookingKF.service_element_price).label("soft_booking_price"),
        ).scalar() or 0
        
    else:
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
        total_bookings = db.query(func.count(BookingData.crs_original_booking_number)).filter(
            BookingData.order_creation_date.between(start_date_str, end_date_str)
        ).scalar() or 0
        
        total_soft_bookings = db.query(func.count(SoftBookingKF.booking_number)).filter(
            SoftBookingKF.service_creation_time.between(start_date_str, end_date_str)
        ).scalar() or 0
        
        avg_price = db.query(func.avg(BookingData.performance_element_price)).filter(
            BookingData.order_creation_date.between(start_date_str, end_date_str)
        ).scalar() or 0
        
        total_booking_revenue = db.query(func.sum(BookingData.performance_element_price)).filter(
            BookingData.order_creation_date.between(start_date_str, end_date_str)
        ).scalar() or 0
        
        avg_sf_price = db.query(func.avg(SoftBookingKF.service_element_price)).filter(
            SoftBookingKF.service_creation_time.between(start_date_str, end_date_str)
        ).scalar() or 0

    # Calculate Booking Rate
    booking_rate = round((total_soft_bookings / total_bookings * 100) if total_bookings > 0 else 0, 2)
    
    return {
        "Total bookings": total_bookings + total_soft_bookings,
        "Average Booking price": round(avg_price,2),
        "Total booking revenue": format_revenue(total_booking_revenue),
        "Average Soft Booking price": round(avg_sf_price, 2),
        "Booking Rate": booking_rate
    }
    
@router.get("/tasks_overview")
async def get_tasks_overview(
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db)):
    """Endpoint to retrieve calls data from the database."""
    start_date, end_date = get_date_range(filter_type)
    
    if start_date is None:
        status_by_cat_data = db.query(
            BookingData.crs_status.label("categories"),
            func.count(BookingData.crs_status).label("count"),
        ).group_by(BookingData.crs_status).all()
        status_by_date_data = db.query(
            func.strftime('%Y-%m', BookingData.order_creation_date).label('month'),
            func.count(BookingData.crs_status).label("count"),
        ).group_by(func.strftime('%Y-%m', BookingData.order_creation_date)).all()
        status_by_day_data = db.query(
            func.strftime('%w', BookingData.order_creation_date).label('weekday'),
            func.count(BookingData.id).label("count"),
        ).group_by(func.strftime('%w', BookingData.order_creation_date)).all()
    else:
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
        status_by_cat_data = db.query(
            BookingData.crs_status.label("categories"),
            func.count(BookingData.crs_status).label("count"),
        ).filter(
            BookingData.order_creation_date.between(start_date_str, end_date_str)
        ).group_by(BookingData.crs_status).all()
        
        status_by_date_data = db.query(
            func.strftime('%Y-%m', BookingData.order_creation_date).label('month'),
            func.count(BookingData.crs_status).label("count"),
        ).filter(
            BookingData.order_creation_date.between(start_date_str, end_date_str)
        ).group_by(func.strftime('%Y-%m', BookingData.order_creation_date)).all()
        
        status_by_day_data = db.query(
            func.strftime('%w', BookingData.order_creation_date).label('weekday'),
            func.count(BookingData.id).label("count"),
        ).filter(
            BookingData.order_creation_date.between(start_date_str, end_date_str)
        ).group_by(func.strftime('%w', BookingData.order_creation_date)).all()
    
    
    
    weekday_map = {
    '0': 'Sunday',
    '1': 'Monday',
    '2': 'Tuesday',
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday',
    '6': 'Saturday'
    }

    # Convert the result into a readable format
    status_by_weekday = [
        {"weekday": weekday_map[row.weekday], "count": row.count}
        for row in status_by_day_data
    ]
    return {
        "status by categories": status_by_cat_data,
        "status by date": status_by_date_data,
        "status by weekday": status_by_weekday
    }
    
    
@router.get("/tasks_performance")
async def get_tasks_performance(
    filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db)):
    """Endpoint to retrieve calls data from the database."""
    start_date, end_date = get_date_range(filter_type)
    
    if start_date is None:
        LT_by_cat_data = db.query(
            SoftBookingKF.lt_code.label("categories"),
            func.count(SoftBookingKF.lt_code).label("count"),
        ).group_by(SoftBookingKF.lt_code).all()
        booking_trend = db.query(
            BookingData.order_creation_date.label('date'),
            func.count(BookingData.crs_original_booking_number).label("booking_count")
        ).order_by(BookingData.order_creation_date.desc()).limit(10).all()
        sf_booking_trend = db.query(
            func.date(SoftBookingKF.service_creation_time).label('date'),
            func.count(SoftBookingKF.booking_number).label("soft_booking_count")
        ).order_by(SoftBookingKF.service_creation_time.desc()).limit(10).all()
        order_mediator_count = db.query(
            BookingData.order_mediator.label('order mediator'),
            func.count(BookingData.order_mediator).label("count"),
        ).group_by(BookingData.order_mediator).all()
        order_mediator_count_date = db.query(
            BookingData.order_creation_date.label('date'),
            BookingData.order_mediator.label('order mediator'),
            func.count(BookingData.order_mediator).label("count"),
        ).group_by(BookingData.order_mediator).order_by(BookingData.order_creation_date.desc()).limit(10).all()
    else:
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
        LT_by_cat_data = db.query(
            SoftBookingKF.lt_code.label("categories"),
            func.count(SoftBookingKF.lt_code).label("count"),
        ).filter(
            SoftBookingKF.service_creation_time.between(start_date_str, end_date_str)
        ).group_by(SoftBookingKF.lt_code).all()
        booking_trend = db.query(
            BookingData.order_creation_date.label('date'),
            func.count(BookingData.crs_original_booking_number).label("booking_count")
        ).filter(
            BookingData.order_creation_date.between(start_date_str, end_date_str)
        ).order_by(BookingData.order_creation_date.desc()).limit(10).all()
        sf_booking_trend = db.query(
            func.date(SoftBookingKF.service_creation_time).label('date'),
            func.count(SoftBookingKF.booking_number).label("soft_booking_count")
        ).filter(
            SoftBookingKF.service_creation_time.between(start_date_str, end_date_str)
        ).order_by(SoftBookingKF.service_creation_time.desc()).limit(10).all()
        order_mediator_count = db.query(
            BookingData.order_mediator.label('order mediator'),
            func.count(BookingData.order_mediator).label("count"),
        ).filter(
            BookingData.order_creation_date.between(start_date_str, end_date_str)
        ).group_by(BookingData.order_mediator).all()
        order_mediator_count_date = db.query(
            BookingData.order_creation_date.label('date'),
            BookingData.order_mediator.label('order mediator'),
            func.count(BookingData.order_mediator).label("count"),
        ).filter(
            BookingData.order_creation_date.between(start_date_str, end_date_str)
        ).group_by(BookingData.order_mediator).order_by(BookingData.order_creation_date.desc()).limit(10).all()
        
    
    return {
        "LT code by categories": LT_by_cat_data,
        "Booking Trend": booking_trend,
        "SF Booking Trend": sf_booking_trend,
        "Order Mediator": order_mediator_count,
        "Order Mediator by Date": order_mediator_count_date
    }