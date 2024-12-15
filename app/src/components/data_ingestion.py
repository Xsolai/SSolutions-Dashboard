from sqlalchemy.orm import Session
from app.database.models.models import (GuruCallReason,WorkflowReportGuruKF, 
                                        QueueStatistics, SoftBookingKF, GuruTask)
from app.src.logger import logging
from datetime import datetime


def populate_guru_call_reason(data, db: Session, date):
    """Populate GuruCallReason table."""
    try:
        for _, row in data.iterrows():
            if row.iloc[0] == "Summe":
                continue 
            db_record = GuruCallReason(
                date=date,
                agent=row.get('Agent', ''),
                total_calls=row.get('Gesamt [#]', 0),
                cb_sales=row.get('CB SALES [#]', 0),
                cb_wrong_call=row.get('CB WRONG CALL [#]',0),
                guru_cb_booking=row.get('GURU CB BUCHUNG AUF GURU [#]',0),
                guru_sales=row.get('GURU SALES [#]',0),
                guru_service=row.get('Guru SERVICE [#]',0),
                guru_wrong=row.get('GURU WRONG [#]',0),
                other_guru=row.get('SONSTIGES GURU [#]', 0)
            )
            db.add(db_record)
        db.commit()
        logging.info("GuruCallReason Data successfully populated into the database.")
        
    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error populating GuruCallReason table: {e}")
        print(f"Exception occurred while populating GuruCallReason table: {e}")

# def populate_guru_daily(data, db: Session, day, date):
#     """Populate GuruDailyCallData table."""
#     try:
#         for _, row in data.iterrows():
#             if any("Summe" in str(value) for value in row):
#                 continue

#             # Use .get() to access each column, and provide a default if missing
#             db_record = GuruDailyCallData(
#                 date=date,
#                 weekday = day,
#                 queue_name=row.get('Warteschleife', ''),
#                 total_calls=row.get('Anrufe', 0),
#                 answered_calls=row.get('Angenommen', 0),
#                 calls_within_5s=row.get('Anrufe <= 5s', 0),
#                 dropped_calls=row.get('Aufgelegt vor Antwort', 0),
#                 quick_drops=row.get('Schnell aufgelegt <= 5s', 0),
#                 avg_wait_time=row.get('avg Wartezeit', 0.0),
#                 max_wait_time=row.get('max. Wartezeit', 0.0),
#                 inbound_after_call=row.get('sum Nachbearbeitung Inbound', 0.0),
#                 avg_handling_time=row.get('avg AHT Inbound', 0.0),
#                 total_talk_time=row.get('sum Gesprächszeit', 0.0),
#                 asr=row.get('ASR', 0.0),
#                 sla=row.get('SLA20\\20', 0.0),
#                 outbound_calls=row.get('Outbound', 0),
#                 outbound_answered=row.get('Outbound angenommen', 0),
#                 outbound_talk_time=row.get('sum Outbound Gesprächszeit Agent', 0.0),
#                 outbound_after_call=row.get('sum Nachbearbeitung Outbound', 0.0)
#             )
#             db.add(db_record)
#         db.commit()
#         logging.info("Guru Daily Data successfully populated into the database.")

#     except Exception as e:
#         db.rollback()  # Rollback the transaction in case of an error
#         logging.error(f"Error populating Guru Daily table: {e}")
#         print(f"Exception occurred while populating Guru Daily data: {e}")

    
    
def populate_workflow_report(data, db: Session, date):
    """Populate WorkflowReportGuruKF table, skipping rows where any column contains 'Summe'."""
    try:
        for _, row in data.iterrows():
            # Skip row if any value in the row contains "Summe"
            if any("Summe" in str(value) for value in row):
                continue
            
            db_record = WorkflowReportGuruKF(
                date=date,
                customer=row.get('file_name', ""),
                interval=row.get('Intervall', ""),
                mailbox=row.get('Mailbox', ""),
                received=row.get('Empfangen [#]', 0),
                new_cases=row.get('Neue Vorgänge [#]', 0),
                sent=row.get('Gesendet [#]', 0),
                archived=row.get('Archiviert [#]', 0),
                # trashed=row.get('Papierkorb [#]', 0),
                dwell_time_net=row.get('Verweilzeit-Netto [∅ hh:mm:ss]', ""),
                processing_time=row.get('Bearbeitungszeit [∅ Min.]', ""),
                service_level_gross=row.get('ServiceLevel-Brutto [%]', 0.0),
                service_level_gross_reply=row.get('ServiceLevel-Brutto: Antwort [%]', 0.0)
            )
            db.add(db_record)
        db.commit()
        logging.info("WorkflowReportGuruKF Data successfully populated into the database.")
        
    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error populating WorkflowReportGuruKF table: {e}")
        print(f"Exception occurred while populating WorkflowReportGuruKF table data: {e}")
    

# def populate_email_table(data, db: Session, date):
#     """Populate the WorkflowReportGuru table with data from the DataFrame."""
#     try:
#         for _, row in data.iterrows():
#             # Skip rows where any value in the row contains "Summe"
#             if any("Summe" in str(value) for value in row):
#                 continue
            
#             db_record = WorkflowReportGuru(
#                 mailbox=row['Mailbox'],
#                 date = date,
#                 interval=row['Intervall'],
#                 received=row['Empfangen [#]'],
#                 new_cases=row['Neue Vorgänge [#]'],
#                 sent=row['Gesendet [#]'],
#                 sent_reply=row['Gesendet: Antwort [#]'],
#                 sent_forwarded=row['Gesendet: Weiterleitung [#]'],
#                 sent_new_message=row['Gesendet: Neue Nachricht [#]'],
#                 sent_follow_up=row['Gesendet: Rückfrage [#]'],
#                 sent_interim_reply=row['Gesendet: Zwischenbescheid [#]'],
#                 archived=row['Archiviert [#]'],
#                 trashed=row['Papierkorb [#]'],
#                 dwell_time_net=row['Verweilzeit-Netto [∅ hh:mm:ss]'],
#                 processing_time=row['Bearbeitungszeit [∅ Min.]'],
#                 service_level_gross=row['ServiceLevel-Brutto [%]'],
#                 service_level_gross_reply=row['ServiceLevel-Brutto: Antwort [%]']
#             )
#             db.add(db_record)
#         db.commit()
#         logging.info("Email Data successfully populated into the database.")

#     except Exception as e:
#         db.rollback()  # Rollback the transaction in case of an error
#         logging.error(f"Error populating email data: {e}")
#         print(f"Exception occurred while populating email data: {e}")

def populate_queue_statistics(data, db: Session, date, day):
    """Populate the QueueStatistics table with data from the DataFrame."""
    try:
        print("Data in queue: ", data.head())
        for _, row in data.iterrows():
            if any("Summe" in str(value) for value in row):
                continue
            
            # Populate the QueueStatistics record, using .get() to avoid KeyError if column is missing
            db_record = QueueStatistics(
                date=date,
                weekday=day,
                queue_name=row.get('Warteschleife', ''),
                calls=row.get('Anrufe', 0),
                offered=row.get('Angeboten', 0),
                accepted=row.get('Angenommen', 0),
                abandoned_before_answer=row.get('Aufgelegt vor Antwort', 0),
                # max_wait_time_reached=row.get('max. Wartezeit erreicht', 0),
                # max_wait_places_reached=row.get('max. Warteplätze erreicht', 0),
                avg_wait_time=row.get('av. Wartezeit', 0),
                max_wait_time=row.get('max. Wartezeit', 0.0),
                # total_wait_time=row.get('sum Wartezeit'),
                # avg_wait_time_abandoned=row.get('avg Wartezeit Aufleger', 0),
                # avg_talk_time=row.get('avg Gesprächszeit', 0),
                # avg_after_call_work_inbound=row.get('avg Nachbearbeitung Inbound', 0),
                avg_handling_time_inbound=row.get('av. AHT Inbound', 0),
                max_talk_time=row.get('max. Gesprächszeit', 0),
                # total_talk_time=row.get('sum Gesprächszeit', 0.0),
                asr=row.get('ASR', 0.0),
                # asr20=row.get('ASR20', 0.0),
                sla_20_20=row.get('SLA20\\20', 0.0),
                # answered_20=row.get('Beantwortet20', 0),
                # abandoned_20=row.get('Aufleger20', 0),
                outbound=row.get('Outbound', 0),
                outbound_accepted=row.get('Outbound angenommen', 0),
                # total_outbound_talk_time_agent=row.get('sum Outbound Gesprächszeit Agent', 0.0),
                total_outbound_talk_time_destination=row.get('tot. Outbound Gesprächszeit Ziel', 0.0),
                avg_after_call_work_outbound=row.get('tot. Nachbearbeitung Outbound', 0.0),
                # avg_handling_time_outbound=row.get('avg AHT Outbound', 0),
                # transfer_in=row.get('Weiterleitung (in)', 0),
                # transfer_out=row.get('Weiterleitung (out)', 0)
            )
            # print(db_record)
            # print("AHT utbound:", row.get('avg AHT Outbound', 0))
            db.add(db_record)
        
        db.commit()
        logging.info("Queue statistics data successfully populated into the database.")
        print("Queue statistics data successfully populated into the database.")

    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error populating QueueStatistics data: {e}")
        print(f"Exception occurred while populating queue statistics data: {e}")

# def populate_booking_data(data, db: Session):
#     """Populate the BookingData table with data from the DataFrame."""
#     try:
#         for _, row in data.iterrows():
#             # Create a BookingData record
#             db_record = BookingData(
#                 crs_original_status=row.get('CRS (Standard) original Status', ''),
#                 crs_status=row.get('CRS (Standard) Status', ''),
#                 performance_element_price=row.get('Leistung Element Preis', 0.0),
#                 order_mediator=row.get('Auftrag Vermittler (Auftrag)', ''),
#                 external_system=row.get('CRS (Standard Externes System)', ''),
#                 order_creation_date=row.get('Auftrag Anlagedatum (Auftrag)', None),
#                 crs_original_booking_number=row.get('CRS (Standard) original Buchungsnummer', '')
#             )
            
#             db.add(db_record)
        
#         db.commit()
#         logging.info("Booking data successfully populated into the database.")
#         print("Booking data successfully populated into the database.")

#     except Exception as e:
#         db.rollback()  # Rollback the transaction in case of an error
#         logging.error(f"Error populating BookingData table: {e}")
#         print(f"Exception occurred while populating BookingData table: {e}")
        
        
def populate_soft_booking_data(data, db: Session):
    """
    Populate the OrderDetails table with data from the DataFrame.
    """
    try:
        for _, row in data.iterrows():
            if 'service_creation_time' in row and isinstance(row['service_creation_time'], str):
                row['service_creation_time'] = datetime.strptime(row['service_creation_time'], '%d.%m.%Y %H:%M:%S')

            db_record = SoftBookingKF(
                customer=row.get("file_name", ""),
                booking_number=row.get('Auftrag Auftragsnummer (Auftrag)', ''),
                lt_code=row.get('CRS (Standard) LT-Code', ''),
                original_status=row.get('CRS (Standard) original Status', ''),
                status=row.get('CRS (Standard) Status', ''),
                service_element_price=row.get('Leistung Element Preis', 0.0),
                service_creation_time=row.get('Leistung Anlagezeit', None),
                service_original_amount=row.get('Leistung Originalbetrag', 0.0)
            )

            db.add(db_record)

        db.commit()
        logging.info("SoftBookingKF data successfully populated into the database.")
        print("SoftBookingKF data successfully populated into the database.")

    except Exception as e:
        db.rollback()
        logging.error(f"Error populating SoftBookingKF table: {e}")
        print(f"Exception occurred while populating SoftBookingKF table: {e}")
        
def populate_guru_task_data(data, db: Session, date):
    """
    Populate the GuruTask table with data from the DataFrame.
    """
    try:
        for _, row in data.iterrows():
            # Create a GuruTask record
            db_record = GuruTask(
                date = date,
                order_number=row.get('Auftrag Auftragsnummer (Auftrag)', ''),
                assigned_user=row.get('Notiz/Aufgabe erledigender Benutzer', ''),
                due_date=row.get('Notiz/Aufgabe fällig bis', None),
                time_modified=row.get('Notiz/Aufgabe Zeit Änderung', None),
                task_type=row.get('Notiz/Aufgabe Aufgabentyp', ''),
                creation_time=row.get('Notiz/Aufgabe Zeit Anlage', None)
            )

            db.add(db_record)

        db.commit()
        logging.info("GuruTask data successfully populated into the database.")
        print("GuruTask data successfully populated into the database.")

    except Exception as e:
        db.rollback()
        logging.error(f"Error populating GuruTask table: {e}")
        print(f"Exception occurred while populating GuruTask table: {e}")