from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Time
from datetime import datetime
from app.database.db.db_connection import Base

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, default="user")  # Default role is 'user'
    password = Column(String, nullable=False)
    
    def __init__(self, username, email, password, role="user"):
        self.username = username
        self.email = email
        self.password = password
        self.role = role



class GuruCallReason(Base):
    __tablename__ = 'guru_call_reason'
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String)
    total_calls = Column(Integer) 
    cb_sales = Column(Integer)
    cb_wrong_call = Column(Integer)
    guru_cb_booking = Column(Integer)
    guru_sales = Column(Integer)
    guru_service = Column(Integer)
    guru_wrong = Column(Integer)
    other_guru = Column(Integer) 

class GuruDailyCallData(Base):
    __tablename__ = "guru_daily"
    id = Column(Integer, primary_key=True, index=True)
    weekday = Column(String)
    queue_name = Column(String, index=True)
    total_calls = Column(Integer)
    answered_calls = Column(Integer)
    calls_within_5s = Column(Integer)
    dropped_calls = Column(Integer)  # Dropped calls before answer
    quick_drops = Column(Integer)  # Quickly dropped calls within 5 seconds
    avg_wait_time = Column(Float)
    max_wait_time = Column(Float)
    inbound_after_call = Column(Float)  # Total after-call work time inbound
    avg_handling_time = Column(Float)
    total_talk_time = Column(Float)
    asr = Column(Float)  # Answer Success Rate
    sla = Column(Float)  # SLA adherence
    outbound_calls = Column(Integer)  # Total outbound calls
    outbound_answered = Column(Integer)
    outbound_talk_time = Column(Float)
    outbound_after_call = Column(Float)  # Outbound after-call work time
    
class WorkflowReportGuruKF(Base):
    __tablename__ = 'workflow_report_gurukf'
    
    id = Column(Integer, primary_key=True, index=True)
    interval = Column(String(255))  # Time period during which the data was recorded
    mailbox = Column(String(255))  # Specific mailbox or category of received emails
    received = Column(Integer)  # Number of emails received
    new_cases = Column(Integer)  # Number of new cases initiated
    sent = Column(Integer)  # Number of emails sent
    archived = Column(Integer)  # Number of cases archived
    trashed = Column(Integer)  # Number of cases moved to trash
    dwell_time_net = Column(String)  # Average dwell time of a case
    processing_time = Column(String)  # Average processing time of a case
    service_level_gross = Column(Float)  # Service-level adherence percentage
    service_level_gross_reply = Column(Float)  # Service-level adherence for sent replies
    
class WorkflowReportGuru(Base):
    __tablename__ = 'guru_email'
    
    id = Column(Integer, primary_key=True, index=True)
    mailbox = Column(String(255), nullable=False)  # Specific mailbox or category of received emails
    interval = Column(String(255), nullable=False)  # Time period during which the data was recorded
    received = Column(Integer, nullable=False, default=0)  # Number of emails received
    new_cases = Column(Integer, nullable=False, default=0)  # Number of new cases initiated
    sent = Column(Integer, nullable=False, default=0)  # Number of emails sent
    sent_reply = Column(Integer, nullable=False, default=0)  # Number of replies sent to received emails
    sent_forwarded = Column(Integer, nullable=False, default=0)  # Number of emails forwarded
    sent_new_message = Column(Integer, nullable=False, default=0)  # Number of new outgoing messages
    sent_follow_up = Column(Integer, nullable=False, default=0)  # Number of follow-up inquiries sent
    sent_interim_reply = Column(Integer, nullable=False, default=0)  # Number of interim replies sent
    archived = Column(Integer, nullable=False, default=0)  # Number of cases archived
    trashed = Column(Integer, nullable=False, default=0)  # Number of cases deleted or moved to trash
    dwell_time_net = Column(String, nullable=False, default="00:00:00")  # Average dwell time of a case
    processing_time = Column(String, nullable=False, default="00:00:00")  # Average processing time of a case
    service_level_gross = Column(Float, nullable=False, default=0.0)  # Percentage of cases processed within service level
    service_level_gross_reply = Column(Float, nullable=False, default=0.0)  # Service level for sent replies
    
    
class QueueStatistics(Base):
    __tablename__ = 'queue_statistics'
    
    id = Column(Integer, primary_key=True, index=True)
    queue_name = Column(String(255), nullable=False)  # Warteschleife or queue name
    
    # General call statistics
    calls = Column(Integer, nullable=False, default=0)  # Anrufe
    offered = Column(Integer, nullable=False, default=0)  # Angeboten
    accepted = Column(Integer, nullable=False, default=0)  # Angenommen
    abandoned_before_answer = Column(Integer, nullable=False, default=0)  # Aufgelegt vor Antwort
    max_wait_time_reached = Column(Integer, nullable=False, default=0)  # max. Wartezeit erreicht
    max_wait_places_reached = Column(Integer, nullable=False, default=0)  # max. Warteplätze erreicht
    
    # Wait time statistics
    avg_wait_time = Column(Integer, nullable=False, default=0)  # Ø Wartezeit (in seconds)
    max_wait_time = Column(Integer, nullable=False, default=0)  # max. Wartezeit (in seconds)
    total_wait_time = Column(Float, nullable=False, default=0.0)  # ∑ Wartezeit (in minutes)
    avg_wait_time_abandoned = Column(Integer, nullable=False, default=0)  # Ø Wartezeit Aufleger (in seconds)
    
    # Conversation and handling times
    avg_talk_time = Column(Integer, nullable=False, default=0)  # Ø Gesprächszeit (in seconds)
    avg_after_call_work_inbound = Column(Integer, nullable=False, default=0)  # Ø Nachbearbeitung Inbound (in seconds)
    avg_handling_time_inbound = Column(Integer, nullable=False, default=0)  # Ø AHT Inbound (in seconds)
    max_talk_time = Column(Integer, nullable=False, default=0)  # max Gesprächszeit (in seconds)
    total_talk_time = Column(Float, nullable=False, default=0.0)  # ∑ Gesprächszeit (in minutes)
    
    # Service level and ASR statistics
    asr = Column(Float, nullable=False, default=0.0)  # ASR (%)
    asr20 = Column(Float, nullable=False, default=0.0)  # ASR20 (%)
    sla_20_20 = Column(Float, nullable=False, default=0.0)  # SLA20\20 (%)
    answered_20 = Column(Integer, nullable=False, default=0)  # Beantwortet20
    abandoned_20 = Column(Integer, nullable=False, default=0)  # Aufleger20
    
    # Outbound statistics
    outbound = Column(Integer, nullable=False, default=0)  # Outbound
    outbound_accepted = Column(Integer, nullable=False, default=0)  # Outbound angenommen
    total_outbound_talk_time_agent = Column(Float, nullable=False, default=0.0)  # ∑ Outbound Gesprächszeit Agent (in minutes)
    total_outbound_talk_time_destination = Column(Float, nullable=False, default=0.0)  # ∑ Outbound Gesprächszeit Ziel (in minutes)
    avg_after_call_work_outbound = Column(Integer, nullable=False, default=0)  # Ø Nachbearbeitung Outbound (in seconds)
    avg_handling_time_outbound = Column(Integer, nullable=False, default=0)  # Ø AHT Outbound (in seconds)
    
    # Transfer statistics
    transfer_in = Column(Integer, nullable=False, default=0)  # Weiterleitung (in)
    transfer_out = Column(Integer, nullable=False, default=0)  # Weiterleitung (out)
    
    
class BookingData(Base):
    __tablename__ = 'booking_data'
    
    id = Column(Integer, primary_key=True, index=True)
    crs_original_status = Column(String(255), nullable=True)  # CRS (Standard) original Status
    crs_status = Column(String(255), nullable=True)  # CRS (Standard) Status
    performance_element_price = Column(Float, nullable=True)  # Leistung Element Preis
    order_mediator = Column(String(255), nullable=True)  # Auftrag Vermittler (Auftrag)
    external_system = Column(String(255), nullable=True)  # CRS (Standard Externes System)
    order_creation_date = Column(String, nullable=True)  # Auftrag Anlagedatum (Auftrag)
    crs_original_booking_number = Column(String(255), nullable=True)  # CRS (Standard) original Buchungsnummer
    
    
class FileProcessingHistory(Base):
    __tablename__ = "file_processing_history"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)  # Name of the file
    status = Column(String(50), nullable=False)  # Status of the processing (e.g., 'Success', 'Failed')
    processed_at = Column(DateTime, default=datetime.utcnow)  # Timestamp when the file was processed
