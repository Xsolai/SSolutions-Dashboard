from sqlalchemy.orm import Session
from app.database.models.models import (GuruCallReason, GuruDailyCallData, 
                                        WorkflowReportGuru, WorkflowReportGuruKF, 
                                        QueueStatistics, BookingData)
from app.src.logger import logging


def populate_guru_call_reason(data, db: Session):
    """Populate GuruCallReason table."""
    try:
        for _, row in data.iterrows():
            if row.iloc[0] == "Summe":
                continue 
            db_record = GuruCallReason(
                date=row['Agent'],
                total_calls=row['Gesamt [#]'],
                cb_sales=row['CB SALES [#]'],
                cb_wrong_call=row['CB WRONG CALL [#]'],
                guru_cb_booking=row['GURU CB BUCHUNG AUF GURU [#]'],
                guru_sales=row['GURU SALES [#]'],
                guru_service=row['Guru SERVICE [#]'],
                guru_wrong=row['GURU WRONG [#]'],
                other_guru=row['SONSTIGES GURU [#]']
            )
            db.add(db_record)
        db.commit()
        logging.info("GuruCallReason Data successfully populated into the database.")
        
    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error populating GuruCallReason table: {e}")
        print(f"Exception occurred while populating GuruCallReason table: {e}")

def populate_guru_daily(data, db: Session):
    """Populate GuruDailyCallData table."""
    try:
        for _, row in data.iterrows():
            if row.iloc[0] == "Summe":
                continue 

            # Use .get() to access each column, and provide a default if missing
            db_record = GuruDailyCallData(
                queue_name=row.get('Warteschleife', ''),
                total_calls=row.get('Anrufe', 0),
                answered_calls=row.get('Angenommen', 0),
                calls_within_5s=row.get('Anrufe <= 5s', 0),
                dropped_calls=row.get('Aufgelegt vor Antwort', 0),
                quick_drops=row.get('Schnell aufgelegt <= 5s', 0),
                avg_wait_time=row.get('avg Wartezeit', 0.0),
                max_wait_time=row.get('max. Wartezeit', 0.0),
                inbound_after_call=row.get('sum Nachbearbeitung Inbound', 0.0),
                avg_handling_time=row.get('avg AHT Inbound', 0.0),
                total_talk_time=row.get('sum Gesprächszeit', 0.0),
                asr=row.get('ASR', 0.0),
                sla=row.get('SLA20\\20', 0.0),
                outbound_calls=row.get('Outbound', 0),
                outbound_answered=row.get('Outbound angenommen', 0),
                outbound_talk_time=row.get('sum Outbound Gesprächszeit Agent', 0.0),
                outbound_after_call=row.get('sum Nachbearbeitung Outbound', 0.0)
            )
            db.add(db_record)
        db.commit()
        logging.info("Guru Daily Data successfully populated into the database.")

    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error populating Guru Daily table: {e}")
        print(f"Exception occurred while populating Guru Daily data: {e}")

    
    
def populate_workflow_report(data, db: Session):
    """Populate WorkflowReportGuruKF table, skipping rows where any column contains 'Summe'."""
    try:
        for _, row in data.iterrows():
            # Skip row if any value in the row contains "Summe"
            if any("Summe" in str(value) for value in row):
                continue
            
            db_record = WorkflowReportGuruKF(
                interval=row['Intervall'],
                mailbox=row['Mailbox'],
                received=row['Empfangen [#]'],
                new_cases=row['Neue Vorgänge [#]'],
                sent=row['Gesendet [#]'],
                archived=row['Archiviert [#]'],
                trashed=row['Papierkorb [#]'],
                dwell_time_net=row['Verweilzeit-Netto [∅ hh:mm:ss]'],
                processing_time=row['Bearbeitungszeit [∅ Min.]'],
                service_level_gross=row['ServiceLevel-Brutto [%]'],
                service_level_gross_reply=row['ServiceLevel-Brutto: Antwort [%]']
            )
            db.add(db_record)
        db.commit()
        logging.info("WorkflowReportGuruKF Data successfully populated into the database.")
        
    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error populating WorkflowReportGuruKF table: {e}")
        print(f"Exception occurred while populating WorkflowReportGuruKF table data: {e}")
    

def populate_email_table(data, db: Session):
    """Populate the WorkflowReportGuru table with data from the DataFrame."""
    try:
        for _, row in data.iterrows():
            # Skip rows where any value in the row contains "Summe"
            if any("Summe" in str(value) for value in row):
                continue
            
            db_record = WorkflowReportGuru(
                mailbox=row['Mailbox'],
                interval=row['Intervall'],
                received=row['Empfangen [#]'],
                new_cases=row['Neue Vorgänge [#]'],
                sent=row['Gesendet [#]'],
                sent_reply=row['Gesendet: Antwort [#]'],
                sent_forwarded=row['Gesendet: Weiterleitung [#]'],
                sent_new_message=row['Gesendet: Neue Nachricht [#]'],
                sent_follow_up=row['Gesendet: Rückfrage [#]'],
                sent_interim_reply=row['Gesendet: Zwischenbescheid [#]'],
                archived=row['Archiviert [#]'],
                trashed=row['Papierkorb [#]'],
                dwell_time_net=row['Verweilzeit-Netto [∅ hh:mm:ss]'],
                processing_time=row['Bearbeitungszeit [∅ Min.]'],
                service_level_gross=row['ServiceLevel-Brutto [%]'],
                service_level_gross_reply=row['ServiceLevel-Brutto: Antwort [%]']
            )
            db.add(db_record)
        db.commit()
        logging.info("Email Data successfully populated into the database.")

    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error populating email data: {e}")
        print(f"Exception occurred while populating email data: {e}")

def populate_queue_statistics(data, db: Session):
    """Populate the QueueStatistics table with data from the DataFrame."""
    try:
        print("Data in queue: ", data.head())
        for _, row in data.iterrows():
            if any("Summe" in str(value) for value in row):
                continue
            
            # Populate the QueueStatistics record, using .get() to avoid KeyError if column is missing
            db_record = QueueStatistics(
                queue_name=row.get('Warteschleife', ''),
                calls=row.get('Anrufe', 0),
                offered=row.get('Angeboten', 0),
                accepted=row.get('Angenommen', 0),
                abandoned_before_answer=row.get('Aufgelegt vor Antwort', 0),
                max_wait_time_reached=row.get('max. Wartezeit erreicht', 0),
                max_wait_places_reached=row.get('max. Warteplätze erreicht', 0),
                avg_wait_time=row.get('avg Wartezeit', 0),
                max_wait_time=row.get('max. Wartezeit', 0.0),
                total_wait_time=row.get('sum Wartezeit'),
                avg_wait_time_abandoned=row.get('avg Wartezeit Aufleger', 0),
                avg_talk_time=row.get('avg Gesprächszeit', 0),
                avg_after_call_work_inbound=row.get('avg Nachbearbeitung Inbound', 0),
                avg_handling_time_inbound=row.get('avg AHT Inbound', 0),
                max_talk_time=row.get('max Gesprächszeit', 0),
                total_talk_time=row.get('sum Gesprächszeit', 0.0),
                asr=row.get('ASR', 0.0),
                asr20=row.get('ASR20', 0.0),
                sla_20_20=row.get('SLA20\\20', 0.0),
                answered_20=row.get('Beantwortet20', 0),
                abandoned_20=row.get('Aufleger20', 0),
                outbound=row.get('Outbound', 0),
                outbound_accepted=row.get('Outbound angenommen', 0),
                total_outbound_talk_time_agent=row.get('sum Outbound Gesprächszeit Agent', 0.0),
                total_outbound_talk_time_destination=row.get('sum Outbound Gesprächszeit Ziel', 0.0),
                avg_after_call_work_outbound=row.get('avg Nachbearbeitung Outbound', 0),
                avg_handling_time_outbound=row.get('avg AHT Outbound', 0),
                transfer_in=row.get('Weiterleitung (in)', 0),
                transfer_out=row.get('Weiterleitung (out)', 0)
            )
            print(db_record)
            print("AHT utbound:", row.get('avg AHT Outbound', 0))
            db.add(db_record)
        
        db.commit()
        logging.info("Queue statistics data successfully populated into the database.")
        print("Queue statistics data successfully populated into the database.")

    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error populating QueueStatistics data: {e}")
        print(f"Exception occurred while populating queue statistics data: {e}")

def populate_booking_data(data, db: Session):
    """Populate the BookingData table with data from the DataFrame."""
    try:
        for _, row in data.iterrows():
            # Create a BookingData record
            db_record = BookingData(
                crs_original_status=row.get('CRS (Standard) original Status', ''),
                crs_status=row.get('CRS (Standard) Status', ''),
                performance_element_price=row.get('Leistung Element Preis', 0.0),
                order_mediator=row.get('Auftrag Vermittler (Auftrag)', ''),
                external_system=row.get('CRS (Standard Externes System)', ''),
                order_creation_date=row.get('Auftrag Anlagedatum (Auftrag)', None),
                crs_original_booking_number=row.get('CRS (Standard) original Buchungsnummer', '')
            )
            
            db.add(db_record)
        
        db.commit()
        logging.info("Booking data successfully populated into the database.")
        print("Booking data successfully populated into the database.")

    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error populating BookingData table: {e}")
        print(f"Exception occurred while populating BookingData table: {e}")