from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from pytz import timezone
from app.src.components.fetch_emails import download_attachments
from app.database.db.db_connection import SessionLocal
from app.src.components.data_ingestion import (
    populate_guru_call_reason, populate_guru_daily,
    populate_email_table, populate_workflow_report, 
    populate_queue_statistics, populate_booking_data
)
from app.src.components.data_transformation import load_excel_data, load_csv_data
import os

# Define the Pakistani timezone
pk_timezone = timezone('Asia/Karachi')
scheduler = BackgroundScheduler(timezone=pk_timezone)

def parse_date_to_weekday(date_str):
    """Convert a date string (e.g., '22-Nov-2024') to the weekday name."""
    try:
        date_obj = datetime.strptime(date_str, '%d-%b-%Y')  # Adjust format if needed
        return date_obj.strftime('%A')  # Convert to weekday name (e.g., 'Monday')
    except ValueError:
        return None  # Return None if the date string is invalid
    

def run_task():
    print(f"Running task at: {datetime.now(pk_timezone).strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Download attachments
    download_attachments()
    
    # Today's date for file processing
    TODAY_DATE = datetime.now().strftime('%d-%b-%Y')
    # TODAY_DATE = "23-Nov-2024"
    weeday_name = parse_date_to_weekday(TODAY_DATE) if TODAY_DATE else None
    all_files = os.listdir(os.path.join(os.getcwd(), "attachments", TODAY_DATE))
    files = {
        "call_reason": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "Guru_CallReason" in file)),
        "daily": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "Guru Daily" in file)),
        "5vFlug": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "5vFlug" in file)),
        "email_KF": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "Workflow-Report-GuruKF" in file)),
        "email": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "Workflow-Report-Guru_(ID__14)" in file)),
        "booking_data": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "SB_Buchungen_AI" in file))
    }
    
    db = SessionLocal()
    for file_type, path in files.items():
        try:
            if file_type == "call_reason":
                data = load_excel_data(path, skiprows=[0])
            elif file_type == "daily":
                data = load_excel_data(path, skiprows=[0, 2])
            elif file_type == "5vFlug":
                data = load_excel_data(path, skiprows=[0, 2])
            elif file_type == "email_KF":
                data = load_excel_data(path, skiprows=[0, 1, 2, 3])
            elif file_type == "email":
                data = load_excel_data(path, skiprows=[0, 1, 2, 3])
            elif file_type == "booking_data":
                data = load_csv_data(path)

            if data is not None:
                if file_type == "call_reason":
                    populate_guru_call_reason(data, db)
                elif file_type == "daily":
                    populate_guru_daily(data, db, day=weeday_name)
                elif file_type == "5vFlug":
                    populate_queue_statistics(data, db)
                elif file_type == "email_KF":
                    populate_workflow_report(data, db)
                elif file_type == "email":
                    populate_email_table(data, db)
                elif file_type == "booking_data":
                    populate_booking_data(data, db)
        except Exception as e:
            print(f"Error processing {file_type}: {e}")

def schedule_daily_task(hour, minute):
    # Schedule the task daily at the specified hour and minute in Pakistani timezone
    scheduler.add_job(run_task, 'cron', hour=hour, minute=minute)
    scheduler.start()
