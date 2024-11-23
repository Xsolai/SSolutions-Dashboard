from fastapi import FastAPI
import uvicorn
from app.database.db.db_connection import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from app.src.logger import logging
from app.endpoints import email_metrics, call_metrics, booking_metrics, login
from app.src.components.scheduler import schedule_daily_task
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

app = FastAPI()

print("backend start")
# Enable CORS for specific origins or allow all
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Schedule the data import task to run daily at a fixed time
    # This will run the task every day at 13:00 (1:00 PM) Pakistani time
    schedule_daily_task(21, 5)  # Set your desired hour and minute here

# Create tables in database
Base.metadata.create_all(bind=engine)
logging.info("Table created successfully.")

@app.get("/")
async def root():
    return {"message": "Welcome to the AI powered Dashboard Backend"}

# app.include_router(data_import.router)
app.include_router(email_metrics.router)
app.include_router(call_metrics.router)
app.include_router(booking_metrics.router)
app.include_router(login.router)

# def get_local_time(hour, minute):
#     now_utc = datetime.now(tz=timezone('UTC'))
#     pk_time = now_utc.astimezone(pk_timezone)
#     print("Time now",pk_time)
#     pk_time = pk_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
#     return pk_time.strftime('%H:%M')

# def schedule_email_fetch():
#     # Schedule the job in Pakistani Time
#     local_time = get_local_time(12, 57)  # 1:00 PM Pakistani Time
#     schedule.every().day.at(local_time).do(download_attachments)

#     while True:
#         schedule.run_pending()
#         time.sleep(1)

# # Run scheduler in a thread
# def start_scheduler():
#     scheduler_thread = threading.Thread(target=schedule_email_fetch, daemon=True)
#     scheduler_thread.start()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)