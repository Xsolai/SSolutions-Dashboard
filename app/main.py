from fastapi import FastAPI, Request, Depends
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
import uvicorn
from app.database.db.db_connection import engine, Base, get_db
from fastapi.middleware.cors import CORSMiddleware
from app.src.logger import logging
from app.endpoints import email_metrics, call_metrics, booking_metrics, login, history, auth, tasks, admin, analytics
from app.src.components.scheduler import schedule_daily_task
import warnings
from app.src.components.middlewares import RoleBasedAccessMiddleware

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

app = FastAPI()


# @app.get("/restricted-endpoint", dependencies=[Depends(role_based_access_control)])
# async def restricted_endpoint():
#     return {"message": "You have access to this endpoint"}

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
    # This will run the task every day at 13:00 (1:00 PM) Pakistani time
    schedule_daily_task(17, 00)  # Set your desired hour and minute here

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
