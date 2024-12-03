from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.models.models import BookingData, GuruCallReason, GuruDailyCallData
from app.database.db.db_connection import SessionLocal,  get_db
from sqlalchemy import func
from app.database.scehmas import schemas
from app.database.auth import oauth2
from app.src.utils import get_date_range, calculate_percentage_change


router = APIRouter(
    tags=["Booking and Conversion APIS"]
)

@router.get("/booking_data")
async def get_booking_data(time_input: float = 6*60, filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db)):
    """Endpoint to retrieve graphs data from the database."""
    
    start_date, end_date = get_date_range(filter_type)
    # print(start_date)
    # print(end_date)
    booked = "OK"
    not_booked = "XX"
    pending = "NG"
    op = "OP"
    rq = "RQ"
    pe = "PE"
    sb_booked = "SB"
    
    try:
        if start_date is None:
            # Count records for each status
            total_bookings = db.query(func.count(BookingData.crs_original_status)).scalar() or 0
            booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == booked).scalar() or 0
            not_booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status != not_booked).scalar() or 0
            pending_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == pending).scalar() or 0
            op_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == op).scalar() or 0
            rq_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == rq).scalar() or 0
            pe_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == pe).scalar() or 0
            sb_booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == sb_booked).scalar() or 0
            # Calculate SB Booking Rate
            total_sb_booked_and_not_booked = booked_count + sb_booked_count + not_booked_count
            sb_booking_rate = (sb_booked_count + booked_count / total_sb_booked_and_not_booked * 100) if total_sb_booked_and_not_booked > 0 else 0
            sb_input = db.query(
                func.count(BookingData.crs_original_status)
            ).scalar() or 0
        else:
            start_date_str = start_date.strftime("%Y-%m-%d")
            end_date_str = end_date.strftime("%Y-%m-%d")
            total_bookings = db.query(func.count(BookingData.crs_original_status)).filter(BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
            booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == booked, BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
            not_booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == not_booked, BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
            pending_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == pending, BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
            op_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == op, BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
            rq_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == rq, BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
            pe_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == pe, BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
            sb_booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == sb_booked, BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
            # Calculate SB Booking Rate
            total_sb_booked_and_not_booked = booked_count + sb_booked_count + not_booked_count
            sb_booking_rate = (sb_booked_count + booked_count / total_sb_booked_and_not_booked * 100) if total_sb_booked_and_not_booked > 0 else 0
            sb_input = db.query(
                func.count(BookingData.crs_original_status)
            ).filter(BookingData.order_creation_date.between(start_date_str, end_date_str)).scalar() or 0
        
        # Return metrics as a dictionary
        return {
            "Total Bookings": total_bookings,
            "Booked": booked_count,
            "Cancelled count": not_booked_count,
            "Pending": pending_count,
            "OP": op_count,
            "RQ": rq_count,
            "PE": pe_count,
            "SB": sb_booked_count,
            "SB Booking Rate (%)": round(sb_booking_rate, 2),
            "Processing time" : sb_input * time_input
        }

    except Exception as e:
        print(f"Error retrieving booking status metrics: {e}")
        return None

@router.get("/booking_data_sub_kpis")
async def get_booking_data_sub_kpis(db: Session = Depends(get_db)):
    """Endpoint to retrieve graphs data from the database."""
    
    start_date, end_date = get_date_range("yesterday")
    prev_start_date, prev_end_date = get_date_range("last_week")
    start_date_str, end_date_str = start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d")
    prev_start_date_str, prev_end_date_str = prev_start_date.strftime("%Y-%m-%d"), prev_end_date.strftime("%Y-%m-%d")
    # print(start_date)
    # print(end_date)
    booked = "OK"
    not_booked = "XX"
    pending = "NG"
    sb_booked = "SB"
    
    try:
        total_bookings = db.query(func.count(BookingData.crs_original_status)).filter(BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
        booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == booked, BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
        not_booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status != not_booked, BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
        pending_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == pending, BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
        sb_booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == sb_booked, BookingData.order_creation_date.between(start_date, end_date)).scalar() or 0
        # Calculate SB Booking Rate
        total_sb_booked_and_not_booked = booked_count + sb_booked_count + not_booked_count
        sb_booking_rate = (sb_booked_count + booked_count / total_sb_booked_and_not_booked * 100) if total_sb_booked_and_not_booked > 0 else 0
        
        # Previous week metrics to calculate change
        prev_total_bookings = db.query(func.count(BookingData.crs_original_status)).filter(BookingData.order_creation_date.between(prev_start_date_str, prev_end_date_str)).scalar() or 0
        prev_booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == booked, BookingData.order_creation_date.between(prev_start_date_str, prev_end_date_str)).scalar() or 0
        prev_not_booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status != not_booked, BookingData.order_creation_date.between(prev_start_date_str, prev_end_date_str)).scalar() or 0
        prev_pending_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == pending, BookingData.order_creation_date.between(prev_start_date_str, prev_end_date_str)).scalar() or 0
        prev_sb_booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == sb_booked, BookingData.order_creation_date.between(prev_start_date_str, prev_end_date_str)).scalar() or 0
        # Calculate SB Booking Rate
        prev_total_sb_booked_and_not_booked = prev_booked_count + prev_sb_booked_count + prev_not_booked_count
        prev_sb_booking_rate = (prev_sb_booked_count + prev_booked_count / prev_total_sb_booked_and_not_booked * 100) if prev_total_sb_booked_and_not_booked > 0 else 0
        
        # Return metrics as a dictionary
        return {
            "Total Bookings change": calculate_percentage_change(total_bookings, prev_total_bookings),
            "Pending change": calculate_percentage_change(pending_count, prev_pending_count),
            "SB Booking Rate (%) change": calculate_percentage_change(round(sb_booking_rate, 2), round(prev_sb_booking_rate, 2))
        }

    except Exception as e:
        print(f"Error retrieving booking status metrics: {e}")
        return None


@router.get("/conversion_CB")
async def get_conversion_data(filter_type: str = Query("all", description="Filter by date range: all, yesterday, last_week, last_month, last_year"),
    db: Session = Depends(get_db)):
    """Endpoint to retrieve graphs data from the database."""
    try:
        db = SessionLocal()    
        start_date, end_date = get_date_range(filter_type=filter_type)
        if start_date is None:
            calls_cb_handled = db.query(func.sum(GuruCallReason.cb_sales)).scalar() or 0
            calls_sales_handled = db.query(func.sum(GuruCallReason.guru_sales)).scalar() or 0
            wrong_calls = db.query(func.sum(GuruCallReason.cb_wrong_call)).scalar() or 0
            sales_wrong_calls = db.query(func.sum(GuruCallReason.guru_wrong)).scalar() or 0
            calls = db.query(func.sum(GuruDailyCallData.total_calls)).scalar() or 0
            bookings_cb = db.query(func.sum(GuruCallReason.guru_cb_booking)).scalar() or 0
            turnover_cb = round(db.query(func.sum(BookingData.performance_element_price)).scalar() or 0,2)
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
            calls = db.query(func.sum(GuruDailyCallData.total_calls)).filter(
            GuruDailyCallData.date.between(start_date, end_date)
            ).scalar() or 0
            bookings_cb = db.query(func.sum(GuruCallReason.guru_cb_booking)).filter(
            GuruCallReason.date.between(start_date, end_date)
            ).scalar() or 0
            turnover_cb = round(db.query(func.sum(BookingData.performance_element_price)).filter(
            BookingData.order_creation_date.between(start_date_str, end_date_str)
            ).scalar() or 0,2)
            sales_volume = db.query(func.sum(GuruCallReason.guru_sales)).filter(
            GuruCallReason.date.between(start_date, end_date)
            ).scalar() or 0
            
        cb_conversion = round(calls_cb_handled - wrong_calls / bookings_cb, 2)
        sales_conversion = round(calls_sales_handled - sales_wrong_calls / bookings_cb, 2)
        
        # Return metrics as a dictionary
        return {
            "CB":{
                "CB calls handled": calls_cb_handled,
                "Wrong calls": wrong_calls,
                "Bookings CB": bookings_cb,
                "Turnover": turnover_cb,
                "CB Conversion": cb_conversion
                },
            "Sales":{
                "Sales handles": calls_sales_handled,
                "Wrong calls": sales_wrong_calls,
                "Bookings Sales": bookings_cb,
                "Sales volume": sales_volume,
                "Sales Conversion": sales_conversion
                }
            }
        

    except Exception as e:
        print(f"Error retrieving booking status metrics: {e}")
        return None

