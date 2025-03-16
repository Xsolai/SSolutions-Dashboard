from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Time, Date, JSON, Boolean, ForeignKey, UniqueConstraint
from datetime import datetime
from app.database.db.db_connection import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, default="user")  # Default role is 'user'
    status = Column(String, default="pending")
    password = Column(String, nullable=False)
    is_active = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow)
    permissions = relationship("Permission", back_populates="user")
    
    # def __init__(self, username, email, password, role="user"):
    #     self.username = username
    #     self.email = email
    #     self.password = password
    #     self.role = role



class GuruCallReason(Base):
    __tablename__ = 'guru_call_reason'
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    agent = Column(String)
    total_calls = Column(Integer) 
    cb_sales = Column(Integer)
    cb_wrong_call = Column(Integer)
    guru_cb_booking = Column(Integer)
    guru_sales = Column(Integer)
    guru_service = Column(Integer)
    guru_wrong = Column(Integer)
    other_guru = Column(Integer) 

# class DailyCallData(Base):
#     __tablename__ = "daily_call_data"
#     id = Column(Integer, primary_key=True, index=True)
#     date = Column(Date)
#     weekday = Column(String)
#     queue_name = Column(String, index=True)
#     total_calls = Column(Integer)
#     answered_calls = Column(Integer)
#     calls_within_5s = Column(Integer)
#     dropped_calls = Column(Integer)  # Dropped calls before answer
#     quick_drops = Column(Integer)  # Quickly dropped calls within 5 seconds
#     avg_wait_time = Column(Float)
#     max_wait_time = Column(Float)
#     inbound_after_call = Column(Float)  # Total after-call work time inbound
#     avg_handling_time = Column(Float)
#     total_talk_time = Column(Float)
#     asr = Column(Float)  # Answer Success Rate
#     sla = Column(Float)  # SLA adherence
#     outbound_calls = Column(Integer)  # Total outbound calls
#     outbound_answered = Column(Integer)
#     outbound_talk_time = Column(Float)
#     outbound_after_call = Column(Float)  # Outbound after-call work time
    
class WorkflowReportGuruKF(Base):
    __tablename__ = 'workflow_report_gurukf'
    
    id = Column(Integer, primary_key=True, index=True)
    customer = Column(String, nullable=True)
    date = Column(Date)
    interval = Column(String)  # Time period during which the data was recorded
    mailbox = Column(String(255))  # Specific mailbox or category of received emails
    received = Column(Integer)  # Number of emails received
    new_cases = Column(Integer)  # Number of new cases initiated
    sent = Column(Integer)  # Number of emails sent
    archived = Column(Integer)  # Number of cases archived
    # trashed = Column(Integer)  # Number of cases moved to trash
    dwell_time_net = Column(String)  # Average dwell time of a case
    processing_time = Column(String)  # Average processing time of a case
    service_level_gross = Column(Float)  # Service-level adherence percentage
    service_level_gross_reply = Column(Float)  # Service-level adherence for sent replies
    
class EmailData(Base):
    __tablename__ = 'email_data'
    
    id = Column(Integer, primary_key=True, index=True)
    customer = Column(String, nullable=True)
    date = Column(Date)
    interval = Column(String)  # Time period during which the data was recorded
    mailbox = Column(String(255))  # Specific mailbox or category of received emails
    received = Column(Integer)  # Number of emails received
    new_cases = Column(Integer)  # Number of new cases initiated
    sent = Column(Integer)  # Number of emails sent
    archived = Column(Integer)  # Number of cases archived
    # trashed = Column(Integer)  # Number of cases moved to trash
    dwell_time_net = Column(String)  # Average dwell time of a case
    processing_time = Column(String)  # Average processing time of a case
    service_level_gross = Column(Float)  # Service-level adherence percentage
    service_level_gross_reply = Column(Float)  # Service-level adherence for sent replies
    
# class WorkflowReportGuru(Base):
#     __tablename__ = 'guru_email'
    
#     id = Column(Integer, primary_key=True, index=True)
#     date = Column(Date)
#     mailbox = Column(String(255))  # Specific mailbox or category of received emails
#     interval = Column(String)  # Time period during which the data was recorded
#     received = Column(Integer, default=0)  # Number of emails received
#     new_cases = Column(Integer, default=0)  # Number of new cases initiated
#     sent = Column(Integer, default=0)  # Number of emails sent
#     sent_reply = Column(Integer, default=0)  # Number of replies sent to received emails
#     sent_forwarded = Column(Integer, default=0)  # Number of emails forwarded
#     sent_new_message = Column(Integer, default=0)  # Number of new outgoing messages
#     sent_follow_up = Column(Integer, default=0)  # Number of follow-up inquiries sent
#     sent_interim_reply = Column(Integer, default=0)  # Number of interim replies sent
#     archived = Column(Integer, default=0)  # Number of cases archived
#     trashed = Column(Integer, default=0)  # Number of cases deleted or moved to trash
#     dwell_time_net = Column(String, default="00:00:00")  # Average dwell time of a case
#     processing_time = Column(String, default="00:00:00")  # Average processing time of a case
#     service_level_gross = Column(Float, default=0.0)  # Percentage of cases processed within service level
#     service_level_gross_reply = Column(Float, default=0.0)  # Service level for sent replies
    
    
class QueueStatistics(Base):
    __tablename__ = 'queue_statistics'
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    weekday = Column(String)
    queue_name = Column(String(255), nullable=False)  # Warteschleife or queue name
    
    # General call statistics
    calls = Column(Integer, nullable=False, default=0)  # Anrufe
    offered = Column(Integer, nullable=False, default=0)  # Angeboten
    accepted = Column(Integer, nullable=False, default=0)  # Angenommen
    abandoned_before_answer = Column(Integer, nullable=False, default=0)  # Aufgelegt vor Antwort
    # max_wait_time_reached = Column(Integer, nullable=False, default=0)  # max. Wartezeit erreicht
    # max_wait_places_reached = Column(Integer, nullable=False, default=0)  # max. Warteplätze erreicht
    
    # Wait time statistics
    avg_wait_time = Column(Integer, nullable=False, default=0)  # Ø Wartezeit (in seconds)
    max_wait_time = Column(Integer, nullable=False, default=0)  # max. Wartezeit (in seconds)
    # total_wait_time = Column(Float, nullable=False, default=0.0)  # ∑ Wartezeit (in minutes)
    # avg_wait_time_abandoned = Column(Integer, nullable=False, default=0)  # Ø Wartezeit Aufleger (in seconds)
    
    # # Conversation and handling times
    # avg_talk_time = Column(Integer, nullable=False, default=0)  # Ø Gesprächszeit (in seconds)
    # avg_after_call_work_inbound = Column(Integer, nullable=False, default=0)  # Ø Nachbearbeitung Inbound (in seconds)
    avg_handling_time_inbound = Column(Integer, nullable=False, default=0)  # Ø AHT Inbound (in seconds)
    max_talk_time = Column(Integer, nullable=False, default=0)  # max Gesprächszeit (in seconds)
    # total_talk_time = Column(Float, nullable=False, default=0.0)  # ∑ Gesprächszeit (in minutes)
    
    # Service level and ASR statistics
    asr = Column(Float, nullable=False, default=0.0)  # ASR (%)
    # asr20 = Column(Float, nullable=False, default=0.0)  # ASR20 (%)
    sla_20_20 = Column(Float, nullable=False, default=0.0)  # SLA20\20 (%)
    # answered_20 = Column(Integer, nullable=False, default=0)  # Beantwortet20
    # abandoned_20 = Column(Integer, nullable=False, default=0)  # Aufleger20
    
    # Outbound statistics
    outbound = Column(Integer, nullable=False, default=0)  # Outbound
    outbound_accepted = Column(Integer, nullable=False, default=0)  # Outbound angenommen
    # total_outbound_talk_time_agent = Column(Float, nullable=False, default=0.0)  # ∑ Outbound Gesprächszeit Agent (in minutes)
    total_outbound_talk_time_destination = Column(Float, nullable=False, default=0.0)  # ∑ Outbound Gesprächszeit Ziel (in minutes)
    avg_after_call_work_outbound = Column(Integer, nullable=False, default=0)  # Ø Nachbearbeitung Outbound (in seconds)
    # avg_handling_time_outbound = Column(Integer, nullable=False, default=0)  # Ø AHT Outbound (in seconds)
    
    # # Transfer statistics
    # transfer_in = Column(Integer, nullable=False, default=0)  # Weiterleitung (in)
    # transfer_out = Column(Integer, nullable=False, default=0)  # Weiterleitung (out)

class AllQueueStatisticsData(Base):
    __tablename__ = 'queue_statistics_summe'
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    weekday = Column(String)
    customer = Column(String)
    queue_name = Column(String(255), nullable=False)  # Warteschleife or queue name
    
    # General call statistics
    calls = Column(Integer, nullable=False, default=0)  # Anrufe
    offered = Column(Integer, nullable=False, default=0)  # Angeboten
    accepted = Column(Integer, nullable=False, default=0)  # Angenommen
    abandoned_before_answer = Column(Integer, nullable=False, default=0) 
    
    # Wait time statistics
    avg_wait_time = Column(Integer, nullable=False, default=0)  # Ø Wartezeit (in seconds)
    max_wait_time = Column(Integer, nullable=False, default=0)  # max. Wartezeit (in seconds)
    avg_handling_time_inbound = Column(Integer, nullable=False, default=0)  # Ø AHT Inbound (in seconds)
    max_talk_time = Column(Integer, nullable=False, default=0)  
    
    # Service level and ASR statistics
    asr = Column(Float, nullable=False, default=0.0)  # ASR (%)
    sla_20_20 = Column(Float, nullable=False, default=0.0)  # SLA20\20 (%)
    
    # Outbound statistics
    outbound = Column(Integer, nullable=False, default=0)  # Outbound
    outbound_accepted = Column(Integer, nullable=False, default=0)
    total_outbound_talk_time_destination = Column(Float, nullable=False, default=0.0)  # ∑ Outbound Gesprächszeit Ziel (in minutes)
    avg_after_call_work_outbound = Column(Integer, nullable=False, default=0) 
    
class BookingData(Base):
    __tablename__ = 'booking_list'
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    order_creation_date = Column(String, nullable=True)
    order_creation_time = Column(DateTime, nullable=False)
    crs_extld = Column(String(255), nullable=False)
    crs_status = Column(String(255), nullable=True) 
    crs_status_org_number = Column(Integer, nullable=True)    
    order_agent = Column(String(255), nullable=True)  
    lt_code = Column(String, nullable=True)
    order_attribute_value = Column(String, nullable=True)
    order_creating_user = Column(String, nullable=True)
    crs_original_booking_number = Column(String(255), nullable=True)  
    service_sales_price = Column(Float, nullable=True)
    
    
class SoftBookingKF(Base):
    __tablename__ = "soft_booking_kf"

    id = Column(Integer, primary_key=True, index=True)
    customer = Column(String, nullable=True)
    booking_number = Column(String, nullable=False)  # Booking number (unique identifier)
    lt_code = Column(String, nullable=True)  # CRS (Standard) LT-Code
    original_status = Column(String, nullable=True)  # CRS (Standard) original Status
    status = Column(String, nullable=True)  # CRS (Standard) Status
    service_element_price = Column(Float, nullable=True)  # Leistung Element Preis
    service_creation_time = Column(DateTime, nullable=True)  # Leistung Anlagezeit
    service_original_amount = Column(Float, nullable=True)  # Leistung Originalbetrag
    
class BookingTracking(Base):
    __tablename__ = "booking_tracking"

    id = Column(Integer, primary_key=True, index=True)
    booking_number = Column(String, nullable=False) 
    previous_status = Column(String, nullable=False) 
    current_status = Column(String, nullable=False) 
    change_date = Column(DateTime, default=datetime.utcnow)  
    
class FileProcessingHistory(Base):
    __tablename__ = "file_processing_history"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)  # Name of the file
    status = Column(String(50), nullable=False)  # Status of the processing (e.g., 'Success', 'Failed')
    processed_at = Column(DateTime, default=datetime.utcnow)  # Timestamp when the file was processed
    
    
class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    call_overview_api = Column(Boolean, default=False, nullable=False)
    call_performance_api = Column(Boolean, default=False, nullable=False)
    call_sub_kpis_api = Column(Boolean, default=False, nullable=False)
    email_overview_api = Column(Boolean, default=False, nullable=False)
    email_performance_api = Column(Boolean, default=False, nullable=False)
    email_sub_kpis_api = Column(Boolean, default=False, nullable=False)
    tasks_overview_api = Column(Boolean, default=False, nullable=False)
    tasks_performance_api = Column(Boolean, default=False, nullable=False)
    tasks_kpis_api = Column(Boolean, default=False, nullable=False)
    analytics_email_api = Column(Boolean, default=False, nullable=False)
    analytics_email_subkpis_api = Column(Boolean, default=False, nullable=False)
    analytics_sales_service_api = Column(Boolean, default=False, nullable=False)
    analytics_booking_api = Column(Boolean, default=False, nullable=False)
    analytics_booking_subkpis_api = Column(Boolean, default=False, nullable=False)
    analytics_conversion_api = Column(Boolean, default=False, nullable=False)
    date_filter = Column(String, nullable=True)
    domains = Column(String, nullable=True)
    
    user = relationship("User", back_populates="permissions")
    
class GuruTask(Base):
    __tablename__ = 'guru_tasks'  # Define the table name

    id = Column(Integer, primary_key=True, autoincrement=True) 
    date = Column(Date)
    customer = Column(String, nullable=True)
    order_number = Column(String, nullable=False)  # Auftrag Auftragsnummer (Auftrag)
    assigned_user = Column(String)  # Notiz/Aufgabe erledigender Benutzer
    due_date = Column(DateTime, nullable=True)# Notiz/Aufgabe fällig bis
    time_modified = Column(DateTime, nullable=True)  # Notiz/Aufgabe Zeit Änderung
    task_type = Column(String, nullable=True)  # Notiz/Aufgabe Aufgabentyp
    creation_time = Column(DateTime, nullable=True)  # Notiz/Aufgabe Zeit Anlage
    
# class OrderJoin(Base):
#     __tablename__ = 'order_join'
    
#     id = Column(Integer, primary_key=True, autoincrement=True)
    
#     # Columns from SoftBookingKF
#     booking_number = Column(String, nullable=True)
#     customer = Column(String, nullable=True)
#     lt_code = Column(String, nullable=True)
#     original_status = Column(String, nullable=True)
#     status = Column(String, nullable=True)
#     service_element_price = Column(Float, nullable=True)
#     service_creation_time = Column(DateTime, nullable=True)
#     service_original_amount = Column(Float, nullable=True)
    
#     # Columns from GuruTask
#     order_number = Column(String, nullable=False)
#     assigned_user = Column(String, nullable=True)
#     due_date = Column(DateTime, nullable=True)
#     time_modified = Column(DateTime, nullable=True)
#     task_type = Column(String, nullable=True)
#     task_creation_time = Column(DateTime, nullable=True)
    
#     # # Create a unique constraint on the order_number to ensure no duplicates
#     # __table_args__ = (
#     #     UniqueConstraint('order_number', 'booking_number', name='_order_booking_uc'),
#     # )

class OrderJoin(Base):
    __tablename__ = 'order_join'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date)
    order_number = Column(String, nullable=False)  # Order number must always be present
    task_type = Column(String, nullable=True)  # Task type
    customer = Column(String, nullable=True)  # Type of entry (KF, SB, Task, etc.)
    lt_code = Column(String, nullable=True)  # LT-Code
    status = Column(String, nullable=True)  # Status (e.g., OP, SB)
    element_price = Column(Float, nullable=True)  # Element price
    original_amount = Column(Float, nullable=True)  # Original amount
    performance_time = Column(DateTime, nullable=True)  # Performance time
    user = Column(String, nullable=True)  # Assigned user
    task_deadline = Column(DateTime, nullable=True)  # Task deadline
    task_created = Column(DateTime, nullable=True)  # Task creation timestamp
    time_modified = Column(DateTime, nullable=True)  # Task creation timestamp
    duration = Column(Float, nullable=True)
    
    # # Optional unique constraint if you still want to enforce uniqueness
    # __table_args__ = (
    #     UniqueConstraint('order_number', name='_order_number_uc'),
    # )

class BlacklistedToken(Base):
    __tablename__ = "blacklisted_tokens"

    token = Column(String, primary_key=True, index=True)
    reason = Column(String)
    blacklisted_at = Column(DateTime, default=datetime.utcnow)