from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta, date
from pytz import timezone
from app.src.components.fetch_emails import download_attachments
from app.database.db.db_connection import SessionLocal
from app.src.components.data_ingestion import (
    populate_guru_call_reason,populate_workflow_report, 
    populate_queue_statistics, populate_soft_booking_data, populate_guru_task_data, create_order_join,
    populate_email_data, populate_booking_data, populate_all_queue_statistics)
from app.src.components.data_transformation import load_excel_data, load_csv_data
import os
from app.src.utils import add_file_record
from app.src.logger import logging

# Define the Pakistani timezone
pk_timezone = timezone('Europe/Berlin')
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
        
        return None 
    except ValueError:
        return None 
    

def run_task():
    try:
        print(f"Running task at: {datetime.now(pk_timezone).strftime('%Y-%m-%d %H:%M:%S')}")
        logging.info("Task started successfully")

        # Download attachments
        download_attachments()
        logging.info("Attachments downloaded")

        # Today's date for file processing
        TODAY_DATE = datetime.now().strftime('%d-%b-%Y')
        # TODAY_DATE = "07-May-2025"  # Hardcoded for now
        YESTERDAY_DATE = (datetime.now() - timedelta(days=1)).date()

        weeday_name = parse_date_to_weekday(YESTERDAY_DATE) if YESTERDAY_DATE else None

        # List all files in today's attachments folder
        all_files = os.listdir(os.path.join(os.getcwd(), "attachments", TODAY_DATE))
        logging.info(f"Found {len(all_files)} files in attachments for date {TODAY_DATE}")

        files = {
            "guru_call_reason": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Guru_CallReason" in file and (file.endswith('.csv'))
            )),
            "adac_call_reason": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "ADAC_Call Reason" in file and (file.endswith('.csv'))
            )),
            "daily_booking_list": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Buchungsliste_daily" in file and (file.endswith('.csv'))
            )),
            "daily_5vF_SB": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "1915_daily_5vF_SB" in file and (file.endswith('.csv')) 
            )),
            "daily_BILD_SB": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "1972_daily_BILD_SB" in file and (file.endswith('.csv'))
            )),
            "daily_Galeria_SB": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Galeria_SB_daily" in file and (file.endswith('.csv'))
            )),
            "daily_ADAC_SB": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "ADAC_SB_daily" in file and (file.endswith('.csv'))
            )),
            "daily_Urlaub_SB": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Urlaub_SB_daily" in file and (file.endswith('.csv'))
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
            "Bild_sales": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "BildSales_daily" in file and (file.endswith('.csv'))
            )),
            "Bild_service": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "BildService_daily" in file and (file.endswith('.csv'))
            )),
            "Guru_sales_daily": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Guru_Sales_daily" in file and (file.endswith('.csv'))
            )),
            "Guru_service_daily": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Guru_Service_daily" in file and (file.endswith('.csv'))
            )),
            "GuruKFdaily": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "GuruKF_daily" in file and file.startswith("GuruKF_daily") and (file.endswith('.csv'))
            )),
            "Galeria_daily": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Galeria_daily" in file and file.startswith("Galeria_daily") and (file.endswith('.csv'))
            )),
            "ADAC_daily": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "ADAC_daily" in file and file.startswith("ADAC_daily_20") and (file.endswith('.csv'))
            )),
            "Urlaub_daily": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Urlaub_daily" in file and file.startswith("Urlaub_daily_") and (file.endswith('.csv'))
            )),
            "ID_14": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Workflow-Report-Guru_daily_sales_(ID__14)" in file and (file.endswith('.csv'))
            )),
            "ID_15": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Workflow-Report-GuruKF_daily_(ID__15)" in file and (file.endswith('.csv'))
            )),
            "ID_27": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Workflow-Report-ADAC_daily_(ID__27)" in file and (file.endswith('.csv'))
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
            "ID_35": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Workflow-Report-Bild.de_daily_(ID__35)" in file and (file.endswith('.csv'))
            )),
            "ID_44": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Workflow-Report-Galeria_daily_(ID__44)" in file and (file.endswith('.csv'))
            )),
            "ID_45": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Workflow-Report-Urlaub_daily_(ID__45)" in file and (file.endswith('.csv'))
            )),
            "guru_task": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "1518_daily_Guru_Aufgaben" in file and (file.endswith('.csv'))
            )),
            "5vf_task": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "1518_daily_5VFL_Aufgaben" in file and (file.endswith('.csv'))
            )),
            "bild_task": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "1518_daily_BILD_Aufgaben_" in file and (file.endswith('.csv'))
            )),
            "guruKF_task": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "1518_daily_Guru_KF_Aufgaben" in file and (file.endswith('.csv'))
            )),
            "galeria_task": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Galeria_Aufgaben_daily" in file and (file.endswith('.csv'))
            )),
            "urlaub_task": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Urlaub_Aufgaben_daily" in file and (file.endswith('.csv'))
            )),
            "ADAC_task": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "ADAC_daily_Aufgaben" in file and (file.endswith('.csv'))
            )),
            "soft_booking_data": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(
                str(file) for file in all_files 
                if "Softbuchung_KF" in file and file.endswith('.csv')
            ))
        }

        db = SessionLocal()
        for file_type, path in files.items():
            try:
                data = None  # Initialize data to None
                if os.path.exists(path) and os.path.isfile(path): 
                    if file_type in ["guru_call_reason"]:
                        data = load_csv_data(path)
                        # print(data)
                    elif file_type in ["5vFlug_service", "5vFlug_sales", "GuruKFdaily", "Guru_service_daily", "Guru_sales_daily", "Bild_sales", "Bild_service", "ADAC_daily", "Galeria_daily", "Urlaub_daily"]:
                        data = load_csv_data(path)
                    elif file_type in ["ID_14", "ID_15", "ID_27", "ID_29", "ID_32", "ID_33", "ID_35", "ID_44", "ID_45"]:
                        data = load_excel_data(path, skiprows=[0, 1, 2, 3])
                    # elif file_type in ["ID_14", "ID_15", "ID_29", "ID_32", "ID_33"]:
                    #     email_data = load_excel_data(path, skiprows=[0, 1, 2, 3])
                    #     # print("Found email data")
                    elif file_type in ["guru_task", "bild_task", "5vf_task", "guruKF_task", "urlaub_task", "galeria_task", "ADAC_task"]:
                        data = load_csv_data(path)
                    elif file_type in ["daily_Guru_SB", "daily_SB_Guru_KF", "daily_5vF_SB", "daily_BILD_SB", "daily_Urlaub_SB", "daily_Galeria_SB", "daily_ADAC_SB"]:
                        data = load_csv_data(path)
                    elif file_type == "daily_booking_list":
                        data = load_csv_data(path)
                else:
                    logging.warning(f"File not found: {path}, {file_type}")
                    print(f"File not found: {path}, {file_type}")
                    continue 

                # Populate database only if data is not None and not empty
                if data is not None and not data.empty:
                    if file_type in ["guru_call_reason"]:
                        populate_guru_call_reason(data=data, db=db, date=YESTERDAY_DATE)
                        add_file_record(db=db, filename=file_type, status="added")
                    elif file_type in ["5vFlug_service", "5vFlug_sales", "GuruKFdaily", "Guru_service_daily", "Guru_sales_daily", "Bild_sales", "Bild_service", "ADAC_daily", "Galeria_daily", "Urlaub_daily"]:
                        populate_queue_statistics(data, db, date=YESTERDAY_DATE, day=weeday_name)
                        add_file_record(db=db, filename=file_type, status="added")
                        populate_all_queue_statistics(data, db, date=YESTERDAY_DATE, day=weeday_name)
                        add_file_record(db=db, filename=file_type, status="added for summe")
                    elif file_type in ["ID_14", "ID_15", "ID_27", "ID_29", "ID_32", "ID_33", "ID_35", "ID_44", "ID_45"]:
                        populate_workflow_report(data, db, date=YESTERDAY_DATE)
                        add_file_record(db=db, filename=file_type, status="added")
                        populate_email_data(data, db, date=YESTERDAY_DATE)
                        add_file_record(db=db, filename=file_type, status="added for email data")
                    # elif file_type in ["ID_14", "ID_15", "ID_29", "ID_32", "ID_33"]:
                    #     populate_email_data(data, db, date=YESTERDAY_DATE)
                    #     add_file_record(db=db, filename=file_type, status="added for email data")
                    elif file_type in ["guru_task", "bild_task", "5vf_task", "guruKF_task", "urlaub_task", "galeria_task", "ADAC_task"]:
                        populate_guru_task_data(data, db, date=YESTERDAY_DATE)
                        add_file_record(db=db, filename=file_type, status="added")
                    elif file_type in ["daily_Guru_SB", "daily_SB_Guru_KF", "daily_5vF_SB", "daily_BILD_SB", "daily_Urlaub_SB", "daily_Galeria_SB", "daily_ADAC_SB"]:
                        populate_soft_booking_data(data, db)
                        add_file_record(db=db, filename=file_type, status="added")
                    elif file_type == "daily_booking_list":
                        populate_booking_data(data, db, date=YESTERDAY_DATE)
                        add_file_record(db=db, filename=file_type, status="added")
                    logging.info(f"Successfully processed {file_type}")
            except Exception as e:
                logging.error(f"Error processing {file_type}: {e}", exc_info=True)
            
            try:
                create_order_join(db)
            except Exception as e:
                logging.error(f"Error in creating order join: {e}")
            
            db.close()

    except Exception as e:
        logging.critical("Task failed with an unexpected error", exc_info=True)

def schedule_daily_task(hour, minute):
    logging.info("Running scheduler")
    scheduler = BackgroundScheduler()
    scheduler.add_job(run_task, 'cron', hour=hour, minute=minute)
    scheduler.start()
    logging.info(f"Task scheduled to run daily at {hour}:{minute}")
