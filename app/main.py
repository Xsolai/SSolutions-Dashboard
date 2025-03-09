from fastapi import FastAPI, Request, Depends
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
import uvicorn
from app.database.db.db_connection import engine, Base, get_db
from fastapi.middleware.cors import CORSMiddleware
from app.src.logger import logging
from app.endpoints import admin, analytics, auth, login, call_metrics, email_metrics, tasks, history, export
from app.src.components.scheduler import schedule_daily_task
import warnings
from app.src.components.middlewares import RoleBasedAccessMiddleware

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
app.add_middleware(RoleBasedAccessMiddleware)

@app.on_event("startup")
async def startup_event():
    # Schedule the data import task to run daily at a fixed time
    schedule_daily_task(2,20)  # Set your desired hour and minute here 

# Create tables in database
Base.metadata.create_all(bind=engine)
logging.info("Table created successfully.") 

@app.get("/")
async def root():
    return {"message": "Welcome to the AI powered Dashboard Backend"}

app.include_router(admin.router)
app.include_router(analytics.router)
app.include_router(tasks.router)
app.include_router(call_metrics.router)
app.include_router(email_metrics.router)
app.include_router(login.router)
app.include_router(history.router)
app.include_router(auth.router)
app.include_router(export.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
