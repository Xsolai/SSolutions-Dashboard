from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from app.src.components.fetch_emails import download_attachments
from app.database.db.db_connection import SessionLocal
from app.src.components.data_ingestion import (populate_guru_call_reason, populate_guru_daily,
                                               populate_email_table, populate_workflow_report, 
                                               populate_queue_statistics, populate_booking_data)
from app.src.components.data_transformation import load_excel_data, load_csv_data
from app.src.logger import logging
import os

TODAY_DATE = "18-Nov-2024"
# TODAY_DATE = datetime.now().strftime('%d-%b-%Y')
router = APIRouter()

@router.post("/import")
async def import_files(background_tasks: BackgroundTasks):
    """Endpoint to import Excel files and populate the database."""
    
    try:
        logging.info("Start downloading latest files...")
        print("Starting scheduler...")
        # run_task_in_timezone(download_attachments, 15, 5)
        print(" print Downloaded latest files ")
        logging.info("Downloaded latest files ")
        all_files = os.listdir(os.path.join(os.getcwd(), "attachments", TODAY_DATE))
        print("List of files: ", all_files)
        files = {
            "call_reason": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "Guru_CallReason" in file)),
            "daily": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "Guru Daily" in file)),
            "5vFlug": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "5vFlug" in file)),
            "email_KF": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "Workflow-Report-GuruKF" in file)),
            "email": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "Workflow-Report-Guru_(ID__14)" in file)),
            "booking_data": os.path.join(os.getcwd(), "attachments", TODAY_DATE, " ".join(str(file) for file in all_files if "SB_Buchungen_AI" in file))
        }
        print("Files to import: ", files)
        
        db = SessionLocal()
        for file_type, path in files.items():
            # Define specific rows to skip for each file
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
            except FileNotFoundError:
                print(f"File not found for file type: {file_type}. Please check the file path.")
            except Exception as e:
                print(f"An error occurred while processing file type '{file_type}': {str(e)}")


            print("Data:", data)
            if data is not None:
                if file_type == "call_reason":
                    background_tasks.add_task(populate_guru_call_reason, data, db)
                elif file_type == "daily":
                    background_tasks.add_task(populate_guru_daily, data, db)
                elif file_type == "5vFlug":
                    background_tasks.add_task(populate_queue_statistics, data, db)
                elif file_type == "email_KF":
                    background_tasks.add_task(populate_workflow_report, data, db)
                elif file_type == "email":
                    background_tasks.add_task(populate_email_table, data, db)
                elif file_type == "booking_data":
                    background_tasks.add_task(populate_booking_data, data, db)
            else:
                raise HTTPException(status_code=500, detail=f"Error loading {file_type} file")
                
    except Exception as e:
        logging.error(f"Error cleaning and converting data: {e}")
        return None
            

    return {"message": "Data import started in background"}
