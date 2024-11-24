from fastapi import FastAPI
import uvicorn
from app.database.db.db_connection import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from app.src.logger import logging
from app.endpoints import email_metrics, call_metrics, booking_metrics, login, history, auth
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
    schedule_daily_task(19, 14)  # Set your desired hour and minute here

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
app.include_router(history.router)
app.include_router(auth.router)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)
