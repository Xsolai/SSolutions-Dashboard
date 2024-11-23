from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.models.models import (BookingData, GuruCallReason, GuruDailyCallData,
                                        QueueStatistics)
from app.database.db.db_connection import SessionLocal,  get_db
from datetime import datetime, time
from sqlalchemy import func


router = APIRouter()

@router.get("/booking_data")
async def get_booking_data(time_input: float = 6*60, db: Session = Depends(get_db)):
    """Endpoint to retrieve graphs data from the database."""
    booked = "OK"
    not_booked = "XX"
    pending = "NG"
    op = "OP"
    rq = "RQ"
    sb_booked = "SB"
    
    try:
        # Count records for each status
        booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == booked).scalar() or 0
        not_booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status != not_booked).scalar() or 0
        pending_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == pending).scalar() or 0
        op_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == op).scalar() or 0
        rq_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == rq).scalar() or 0
        sb_booked_count = db.query(func.count(BookingData.crs_status)).filter(BookingData.crs_status == sb_booked).scalar() or 0
        # Calculate SB Booking Rate
        total_sb_booked_and_not_booked = booked_count + sb_booked_count + not_booked_count
        sb_booking_rate = (sb_booked_count + booked_count / total_sb_booked_and_not_booked * 100) if total_sb_booked_and_not_booked > 0 else 0
        sb_input = db.query(
            func.count(BookingData.crs_original_status)
        ).scalar() or 0
        
        # Return metrics as a dictionary
        return {
            "Booked": booked_count,
            "Not Booked": not_booked_count,
            "Pending": pending_count,
            "OP": op_count,
            "RQ": rq_count,
            "SB Booking Rate (%)": round(sb_booking_rate, 2),
            "Processing time" : sb_input * time_input
        }

    except Exception as e:
        print(f"Error retrieving booking status metrics: {e}")
        return None


@router.get("/conversion_CB")
async def get_conversion_data(db: Session = Depends(get_db)):
    """Endpoint to retrieve graphs data from the database."""
    db = SessionLocal()    
    try:
        calls_cb_handled = db.query(func.sum(GuruCallReason.cb_sales)).scalar() or 0
        calls_sales_handled = db.query(func.sum(GuruCallReason.guru_sales)).scalar() or 0
        wrong_calls = db.query(func.sum(GuruCallReason.cb_wrong_call)).scalar() or 0
        sales_wrong_calls = db.query(func.sum(GuruCallReason.guru_wrong)).scalar() or 0
        calls = db.query(func.sum(GuruDailyCallData.total_calls)).scalar() or 0
        bookings_cb = db.query(func.sum(GuruCallReason.guru_cb_booking)).scalar() or 0
        turnover_cb = round(db.query(func.sum(BookingData.performance_element_price)).scalar() or 0,2)
        sales_volume = db.query(func.sum(GuruCallReason.guru_sales)).scalar() or 0
        
        cb_conversion = round(calls_cb_handled - wrong_calls / bookings_cb, 2)
        sales_conversion = round(calls_sales_handled - sales_wrong_calls / bookings_cb, 2)
        
        
        
        # Return metrics as a dictionary
        return {
            "CB":{
                "CB calls handled": calls_cb_handled,
                "Wrong calls": sales_wrong_calls,
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

