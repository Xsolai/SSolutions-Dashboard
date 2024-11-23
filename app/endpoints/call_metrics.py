from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.models.models import (GuruCallReason, GuruDailyCallData, 
                                        QueueStatistics)
from app.database.db.db_connection import SessionLocal,  get_db
from sqlalchemy import func


router = APIRouter()


def get_sla_percentage(db: Session):
    """Endpoint to retrieve sla% per queue."""
    sla_data = db.query(
        func.avg(GuruDailyCallData.sla)
    ).scalar() or 0
    print("SLA Data:", sla_data)

    return sla_data


def get_average_wait_time(db: Session):
    """Endpoint to retrieve average wait time for calls."""
    avg_wait_time = db.query(func.avg(
        GuruDailyCallData.avg_wait_time
    )).scalar() or 0
    print("Average Wait Time Data:", avg_wait_time)

    return avg_wait_time

def get_max_wait_time(db: Session):
    """Endpoint to retrieve max wait time for calls."""
    max_wait_time = db.query(func.max(GuruDailyCallData.max_wait_time)).scalar() or 0
    # Print the structured average wait time data
    print("Max Wait Time Data:", max_wait_time)

    return max_wait_time


def get_talk_time(db: Session):
    """Endpoint to retrieve average wait time for calls."""
    avg_talk_time = db.query(func.avg(
        GuruDailyCallData.total_talk_time
    )).scalar() or 0

    print("Talk Time:", avg_talk_time)
    return avg_talk_time

def get_inbound_after_call(db: Session):
    """Endpoint to retrieve average wait time for calls."""
    after_call = db.query(func.avg(
        GuruDailyCallData.inbound_after_call
    )).scalar() or 0

    print("After work Talk Time:", after_call)

    return after_call


@router.get("/calls_kpis")
async def get_calls(db: Session = Depends(get_db)):
    """Endpoint to retrieve calls data from the database."""
    db = SessionLocal()
    calls = db.query(GuruDailyCallData).all()
    total_calls = db.query(func.sum(GuruDailyCallData.total_calls)).scalar() or 0
    total_answered_calls = db.query(func.sum(GuruDailyCallData.answered_calls)).scalar() or 0
    total_call_reasons = db.query(func.sum(GuruCallReason.total_calls)).scalar() or 0
    asr = (total_answered_calls / total_calls) * 100 if total_calls > 0 else 0
    avg_handling_time = db.query(func.avg(
        GuruDailyCallData.avg_handling_time
    )).scalar()
    dropped_calls = db.query(func.avg(
        GuruDailyCallData.dropped_calls
    )).scalar()
    
    
    return {"total_calls": total_calls, 
            "total_call_reasons": total_call_reasons, 
            "asr": round(asr, 2),
            "SLA":round(get_sla_percentage(db), 2),
            "avg wait time": round(get_average_wait_time(db), 2),
            "max. wait time": round(get_max_wait_time(db), 2),
            "After call work time": round(get_inbound_after_call(db), 2),
            "avg handling time": round(avg_handling_time, 2),
            "Dropped calls": int(dropped_calls)
            }


@router.get("/call_data")
async def get_graphs_data(db: Session = Depends(get_db)):
    """Endpoint to retrieve graphs data from the database."""
    db = SessionLocal()
    avg_handling_time = db.query(
        func.avg(
            GuruDailyCallData.avg_handling_time
        )
    ).scalar()*60 or 0
    
    longest_waiting_time = db.query(
        func.max(
            GuruDailyCallData.max_wait_time
        )
    ).scalar()*60 or 0
    
    total_talk_time = db.query(
        func.sum(
            GuruDailyCallData.total_talk_time
        )
    ).scalar()*60 or 0
    
    total_outbound_calls = db.query(
        func.sum(
            GuruDailyCallData.outbound_calls
        )
    ).scalar()*60 or 0
    
    sale_queue_name = "5vorFlugSales"
    service_queue_name = "5vorFlugService"
    
    # Query for Sale Calls
    sale_metrics = db.query(
        func.sum(QueueStatistics.offered).label("sale_calls_offered"),
        func.sum(QueueStatistics.accepted).label("sale_calls_handled"),
        func.avg(QueueStatistics.accepted / func.nullif(QueueStatistics.offered, 0) * 100).label("sale_ACC"),
        func.avg(QueueStatistics.sla_20_20).label("sale_SL"),
        func.avg(QueueStatistics.avg_handling_time_inbound * 60).label("sale_AHT_sec"),
        func.max(QueueStatistics.max_wait_time * 60).label("sale_longest_waiting_time_sec"),
        func.sum(QueueStatistics.total_talk_time * 60).label("sale_total_talk_time_sec")
    ).filter(QueueStatistics.queue_name == sale_queue_name).first()
    
    # Query for Service Calls
    service_metrics = db.query(
        func.sum(QueueStatistics.offered).label("service_calls_offered"),
        func.sum(QueueStatistics.accepted).label("service_calls_handled"),
        func.avg(QueueStatistics.accepted / func.nullif(QueueStatistics.offered, 0) * 100).label("service_ACC"),
        func.avg(QueueStatistics.sla_20_20).label("service_SL"),
        func.avg(QueueStatistics.avg_handling_time_inbound * 60).label("service_AHT_sec"),
        func.max(QueueStatistics.max_wait_time * 60).label("service_longest_waiting_time_sec"),
        func.sum(QueueStatistics.total_talk_time * 60).label("service_total_talk_time_sec")
    ).filter(QueueStatistics.queue_name == service_queue_name).first()
    
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
        "average handling time": avg_handling_time,
        "Total Talk Time": round(total_talk_time, 2),
        "Total outbound calls": total_outbound_calls
        }


@router.get("/kpis")
async def get_kpis_data(db: Session = Depends(get_db)):
    """Endpoint to retrieve graphs data from the database."""
    sale_queue_name = "5vorFlugSales"
    service_queue_name = "5vorFlugService"
    try:
        calls_cb_handled = db.query(func.sum(GuruCallReason.cb_sales)).scalar() or 0
        wrong_calls = db.query(func.sum(GuruCallReason.cb_wrong_call)).scalar() or 0
        bookings_cb = db.query(func.sum(GuruCallReason.guru_cb_booking)).scalar() or 0
        cb_conversion = round(calls_cb_handled - wrong_calls / bookings_cb, 2)
        
        sales_kpis = db.query(
            func.avg(QueueStatistics.accepted / func.nullif(QueueStatistics.offered, 0) * 100).label("sale_ACC"),
            func.avg(QueueStatistics.sla_20_20).label("sale_SL"),
        ).filter(QueueStatistics.queue_name == sale_queue_name).first()
        
        service_kpis = db.query(
            func.avg(QueueStatistics.accepted / func.nullif(QueueStatistics.offered, 0) * 100).label("service_ACC"),
            func.avg(QueueStatistics.sla_20_20).label("service_SL"),
        ).filter(QueueStatistics.queue_name == service_queue_name).first()
        
        # Return metrics as a dictionary
        return {
            "Sales ACC" : sales_kpis.sale_ACC,
            "Sales SL" : sales_kpis.sale_SL,
            "Service ACC" : service_kpis.service_ACC,
            "Service SL" : service_kpis.service_SL,
            "Conversion CB" : cb_conversion
            }
        

    except Exception as e:
        print(f"Error retrieving booking status metrics: {e}")
        return None
    
@router.get("/calls_kpis_weekdays")
async def get_calls_weekdays(db: Session = Depends(get_db)):
    """Endpoint to retrieve weekdays-wise calls KPIs from the database."""
    # Query weekday-wise grouped data
    weekday_data = db.query(
        GuruDailyCallData.weekday.label("weekday"),  # Group by weekday
        func.sum(GuruDailyCallData.total_calls).label("total_calls"),
        func.sum(GuruDailyCallData.answered_calls).label("answered_calls"),
        func.avg(GuruDailyCallData.avg_wait_time).label("avg_wait_time"),
        func.max(GuruDailyCallData.max_wait_time).label("max_wait_time"),
        func.avg(GuruDailyCallData.avg_handling_time).label("avg_handling_time"),
        func.avg(GuruDailyCallData.sla).label("sla"),
        func.sum(GuruDailyCallData.dropped_calls).label("dropped_calls")
    ).group_by(
        GuruDailyCallData.weekday
    ).all()

    # Format the result
    result = []
    for row in weekday_data:
        if row.weekday is not None:  # Ensure weekday is not None
            total_calls = int(row.total_calls or 0)
            answered_calls = int(row.answered_calls or 0)
            asr = (answered_calls / total_calls) * 100 if total_calls > 0 else 0
            result.append({
                "weekday": row.weekday,  # Convert weekday number to name
                "total_calls": total_calls,
                "answered_calls": answered_calls,
                "avg_wait_time_sec": round(row.avg_wait_time or 0, 2),
                "max_wait_time_sec": round(row.max_wait_time or 0, 2),
                "sla_percent": round(row.sla or 0, 2),
                "asr": round(asr, 2),
                "avg_handling_time": round(row.avg_handling_time or 0, 2),
                "dropped_calls": int(row.dropped_calls or 0)
            })

    return result
