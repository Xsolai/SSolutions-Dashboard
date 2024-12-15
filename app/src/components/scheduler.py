from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta, date
from pytz import timezone
from app.src.components.fetch_emails import download_attachments
from app.database.db.db_connection import SessionLocal
from app.src.components.data_ingestion import (
    populate_guru_call_reason,populate_workflow_report, 
    populate_queue_statistics, populate_soft_booking_data, populate_guru_task_data
)
from app.src.components.data_transformation import load_excel_data, load_csv_data
import os
from app.src.utils import add_file_record

# Define the Pakistani timezone
pk_timezone = timezone('Asia/Karachi')
scheduler = BackgroundScheduler(timezone=pk_timezone)

def parse_date_to_weekday(date_str):
    """Convert a date to the weekday name."""
    try:
        # If input is already a datetime.date object, use it directly
        if isinstance(date_str, date):
            return date_str.strftime('%A')
        
        # If input is a string, convert it to a datetime.date object
        if isinstance(date_str, str):
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            return date_obj.strftime('%A')
        
        return None  # Return None for unrecognized input types
    except ValueError:
        return None  # Return None if the date string is invalid
    

def run_task():
    print(f"Running task at: {datetime.now(pk_timezone).strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Download attachments
    # download_attachments()
    
    # Today's date for file processing
    # TODAY_DATE = datetime.now().strftime('%d-%b-%Y')
    TODAY_DATE = "10-Dec-2024"
    YESTERDAY_DATE = (datetime.now() - timedelta(days=1)).date()
    print("yesterday date: ", YESTERDAY_DATE)
    weeday_name = parse_date_to_weekday(YESTERDAY_DATE) if YESTERDAY_DATE else None
    print("weekday: ", weeday_name)
    all_files = os.listdir(os.path.join(os.getcwd(), "attachments", TODAY_DATE))
    # files = {
    #     "call_reason": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "Guru_CallReason" in file)),
    #     "daily": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "Guru Daily" in file)),
    #     "5vFlug": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "5vFlug" in file)),
    #     "email_KF": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "Workflow-Report-GuruKF_(ID__15)" in file)),
    #     "email": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "Workflow-Report-Guru_(ID__14)" in file)),
    #     "booking_data": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "SB_Buchungen_AI" in file))
    # }
    files = {
    "call_reason": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "Guru_CallReason" in file and (file.endswith('.xlsx') or file.endswith('.xls'))
    )),
    "daily_5vF_SB": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "1915_daily_5vF_SB" in file and (file.endswith('.csv'))
    )),
    "daily_SB_Guru_KF": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "1654_daily_SB_Guru_KF" in file and (file.endswith('.csv'))
    )),
    "daily_Guru_SB": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "1075_daily_Guru_SB" in file and (file.endswith('.csv'))
    )),
    "5vFlug_service": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "5vFlugService_daily" in file and (file.endswith('.csv'))
    )),
    "5vFlug_sales": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "5vFlugSales_daily" in file and (file.endswith('.csv'))
    )),
    "Guru_sales_daily": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "Guru_Sales_daily" in file and (file.endswith('.csv'))
    )),
    "Guru_service_daily": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "Guru_Service_daily" in file and (file.endswith('.csv'))
    )),
    "GuruKF_daily": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "GuruKF_daily" in file and (file.endswith('.csv'))
    )),
    "ID_14": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "Workflow-Report-Guru_daily_sales_(ID__14)" in file and (file.endswith('.csv'))
    )),
    "ID_15": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "Workflow-Report-GuruKF_daily_(ID__15)" in file and (file.endswith('.csv'))
    )),
    "ID_29": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "Workflow-Report-5vorFlug_daily_sales_(ID__29)" in file and (file.endswith('.csv'))
    )),
    "ID_32": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "Workflow-Report-5vorFlug_daily_service_(ID__32)" in file and (file.endswith('.csv'))
    )),
    "ID_33": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "Workflow-Report-Guru_daily_service_(ID__33)" in file and (file.endswith('.csv'))
    )),
    "guru_task": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "1518_daily_Guru_Aufgaben" in file and (file.endswith('.csv'))
    )),
    # "booking_data": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
    #     str(file) for file in all_files 
    #     if "SB_Buchungen_AI" in file and file.endswith('.csv')
    # )),
    "soft_booking_data": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
        str(file) for file in all_files 
        if "Softbuchung_KF" in file and file.endswith('.csv')
    ))
}
    db = SessionLocal()
    for file_type, path in files.items():
        try:
            data = None  # Initialize data to None
            if file_type == "call_reason":
                data = load_excel_data(path, skiprows=[0])
                print("Guru call reason data: ", data)
                if data is not None and not data.empty:  # Check for None and empty
                    add_file_record(db=db, filename="Guru_CallReason", status="added")
            # elif file_type == "daily":
            #     data = load_excel_data(path, skiprows=[0, 2])
            #     if data is not None and not data.empty:
            #         add_file_record(db=db, filename="Guru Daily", status="added")
            elif file_type in ["5vFlug_service", "5vFlug_sales", "GuruKF_daily", "Guru_service_daily", "Guru_sales_daily"]:
                data = load_csv_data(path)
                if data is not None and not data.empty:
                    add_file_record(db=db, filename=file_type, status="added")
            elif file_type in ["ID_14", "ID_15", "ID_29", "ID_32", "ID_33"]:
                data = load_excel_data(path, skiprows=[0, 1, 2, 3])
                if data is not None and not data.empty:
                    add_file_record(db=db, filename=file_type, status="added")
            elif file_type == "guru_task":
                data = load_csv_data(path)
                if data is not None and not data.empty:
                    add_file_record(db=db, filename=file_type, status="added")
            # if file_type == "email":
            #     data = load_excel_data(path, skiprows=[0, 1, 2, 3])
            #     if data is not None and not data.empty:
            #         add_file_record(db=db, filename="Workflow-Report-Guru_(ID__14)", status="added")
            # elif file_type == "booking_data":
            #     data = load_csv_data(path)
            #     if data is not None and not data.empty:
            #         add_file_record(db=db, filename="SB_Buchungen_AI", status="added")
            elif file_type =="daily_Guru_SB" or file_type == "daily_SB_Guru_KF" or file_type == "daily_5vF_SB":
                data = load_csv_data(path)
                if data is not None and not data.empty:
                    add_file_record(db=db, filename=file_type, status="added")

            # Populate database only if data is not None and not empty
            if data is not None and not data.empty:
                if file_type == "call_reason":
                    populate_guru_call_reason(data=data, db=db, date=YESTERDAY_DATE)
                # elif file_type == "daily":
                #     populate_guru_daily(data, db, day=weeday_name, date=YESTERDAY_DATE)
                elif file_type in ["5vFlug_service", "5vFlug_sales", "GuruKF_daily", "Guru_service_daily", "Guru_sales_daily"]:
                    populate_queue_statistics(data, db, date=YESTERDAY_DATE, day=weeday_name)
                elif file_type in ["ID_14", "ID_15", "ID_29", "ID_32", "ID_33"]:
                    print("Data: \n\n", data)
                    populate_workflow_report(data, db, date=YESTERDAY_DATE)
                elif file_type == "guru_task":
                    print("Guru Task Data: \n\n", data)
                    populate_guru_task_data(data, db, date=YESTERDAY_DATE)
                # elif file_type == "email":
                #     populate_email_table(data, db, date=YESTERDAY_DATE)
                # elif file_type == "booking_data":
                #     populate_booking_data(data, db)
                elif file_type =="daily_Guru_SB" or file_type == "daily_SB_Guru_KF" or file_type == "daily_5vF_SB":
                    print("Data: \n\n", data)
                    populate_soft_booking_data(data, db)
        except Exception as e:
            print(f"Error processing {file_type}: {e}")

def schedule_daily_task(hour, minute):
    # Schedule the task daily at the specified hour and minute in Pakistani timezone
    scheduler.add_job(run_task, 'cron', hour=hour, minute=minute)
    scheduler.start()
