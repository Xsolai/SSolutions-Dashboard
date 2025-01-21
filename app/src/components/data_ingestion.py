from sqlalchemy.orm import Session
from app.database.models.models import (GuruCallReason,WorkflowReportGuruKF, EmailData,
                                        QueueStatistics, SoftBookingKF, GuruTask, OrderJoin)
from app.src.logger import logging
from datetime import datetime
import pandas as pd
from sqlalchemy import text


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
        logging.info("WorkflowReport Data successfully populated into the database.")
        
    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error populating WorkflowReportGuruKF table: {e}")
        print(f"Exception occurred while populating WorkflowReportGuruKF table data: {e}")

def populate_email_data(data, db: Session, date):
    """Populate WorkflowReportGuruKF table, skipping rows where any column contains 'Summe'."""
    try:
        for _, row in data.iterrows():
            # Skip row if any value in the row contains "Summe"
            # if any("Summe" in str(value) for value in row):
            #     continue
            if row.get("Mailbox")=="Summe":
                # print("Summe found")
                db_record = EmailData(
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
            logging.info("Email Data successfully populated into the database.")
        
    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error populating Email table: {e}")
        print(f"Exception occurred while populating Email table data: {e}")


def populate_queue_statistics(data, db: Session, date, day):
    """Populate the QueueStatistics table with data from the DataFrame."""
    try:
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
        # print("Queue statistics data successfully populated into the database.")

    except Exception as e:
        db.rollback()  # Rollback the transaction in case of an error
        logging.error(f"Error populating QueueStatistics data: {e}")
        print(f"Exception occurred while populating queue statistics data: {e}")        
        
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
        # print("SoftBookingKF data successfully populated into the database.")

    except Exception as e:
        db.rollback()
        logging.error(f"Error populating SoftBookingKF table: {e}")
        print(f"Exception occurred while populating SoftBookingKF table: {e}")
        
# def populate_guru_task_data(data, db: Session, date):
#     """
#     Populate the GuruTask table with data from the DataFrame.
#     """
#     try:
#         for _, row in data.iterrows():
#             # Create a GuruTask record
#             db_record = GuruTask(
#                 date = date,
#                 order_number=row.get('Auftrag Auftragsnummer (Auftrag)', ''),
#                 assigned_user=row.get('Notiz/Aufgabe erledigender Benutzer', ''),
#                 due_date=row.get('Notiz/Aufgabe fällig bis', None),
#                 time_modified=row.get('Notiz/Aufgabe Zeit Änderung', None),
#                 task_type=row.get('Notiz/Aufgabe Aufgabentyp', ''),
#                 creation_time=row.get('Notiz/Aufgabe Zeit Anlage', None)
#             )

#             db.add(db_record)

#         db.commit()
#         logging.info("GuruTask data successfully populated into the database.")
#         print("GuruTask data successfully populated into the database.")

#     except Exception as e:
#         db.rollback()
#         logging.error(f"Error populating GuruTask table: {e}")
#         print(f"Exception occurred while populating GuruTask table: {e}")
def populate_guru_task_data(data, db: Session, date):
    """
    Populate the GuruTask table with data from the DataFrame.
    """
    try:
        for _, row in data.iterrows():
            # Ensure all values are properly converted
            order_number = str(row.get('Auftrag Auftragsnummer (Auftrag)', '')).strip() or None
            assigned_user = str(row.get('Notiz/Aufgabe erledigender Benutzer', '')).strip() or None
            due_date = row.get('Notiz/Aufgabe fällig bis')
            time_modified = row.get('Notiz/Aufgabe Zeit Änderung')
            task_type = str(row.get('Notiz/Aufgabe Aufgabentyp', '')).strip() or None
            creation_time = row.get('Notiz/Aufgabe Zeit Anlage')

            # Convert dates to None if they are NaT or invalid
            due_date = due_date if not pd.isna(due_date) else None
            time_modified = time_modified if not pd.isna(time_modified) else None
            creation_time = creation_time if not pd.isna(creation_time) else None

            # Create a GuruTask record
            db_record = GuruTask(
                date=date,
                order_number=order_number,
                assigned_user=assigned_user,
                due_date=due_date,
                time_modified=time_modified,
                task_type=task_type,
                creation_time=creation_time
            )

            db.add(db_record)

        db.commit()
        logging.info("GuruTask data successfully populated into the database.")
        # print("GuruTask data successfully populated into the database.")

    except Exception as e:
        db.rollback()
        logging.error(f"Error populating GuruTask table: {e}")
        print(f"Exception occurred while populating GuruTask table: {e}")
        # Optionally, log the specific row that caused the error
        try:
            logging.error(f"Problematic row details: {row.to_dict()}")
        except Exception:
            pass
        
# def create_order_join(db: Session):
#     """
#     Populate the order_join table by joining SoftBookingKF and GuruTask.
#     Excludes rows where booking_number is NULL.
#     """
#     try:
#         # Clear existing data in the join table
#         db.query(OrderJoin).delete()
#         db.commit()

#         # Insert unique, valid rows
#         join_query = text("""
#         INSERT INTO order_join (
#             order_number, booking_number,
#             customer, lt_code, original_status, status,
#             service_element_price, service_creation_time, service_original_amount,
#             assigned_user, due_date, time_modified,
#             task_type, task_creation_time
#         )
#         SELECT DISTINCT
#             gt.order_number, sb.booking_number,
#             sb.customer, sb.lt_code, sb.original_status, sb.status,
#             sb.service_element_price, sb.service_creation_time, sb.service_original_amount,
#             gt.assigned_user, gt.due_date, gt.time_modified,
#             gt.task_type, gt.creation_time
#         FROM guru_tasks gt
#         LEFT JOIN soft_booking_kf sb ON gt.order_number = sb.booking_number
#         WHERE sb.booking_number IS NOT NULL
#         AND NOT EXISTS (
#             SELECT 1
#             FROM order_join oj
#             WHERE oj.order_number = gt.order_number
#             AND oj.booking_number = sb.booking_number
#         );
#         """)

#         # Execute the query
#         db.execute(join_query)
#         db.commit()
#         logging.info("Order join table successfully populated.")

#     except Exception as e:
#         db.rollback()
#         logging.error(f"Error populating order join table: {e}", exc_info=True)
#         print(f"Exception occurred while populating order join table: {e}")
def create_order_join(db: Session):
    """
    Populate the order_join table using a UNION to emulate FULL OUTER JOIN.
    Includes an additional `date` column from `guru_tasks`.
    """
    try:
        # Clear existing data in the join table
        db.query(OrderJoin).delete()
        db.commit()

        # Insert using UNION to emulate FULL OUTER JOIN
        query = text("""
        INSERT INTO order_join (
            date, order_number, task_type, customer, lt_code, status, 
            element_price, original_amount, performance_time,
            user, task_deadline, task_created, time_modified
        )
        SELECT DISTINCT
            gt.date AS date,
            gt.order_number AS order_number,
            gt.task_type AS task_type,
            sb.customer AS customer,
            sb.lt_code AS lt_code,
            sb.status AS status,
            sb.service_element_price AS element_price,
            sb.service_original_amount AS original_amount,
            sb.service_creation_time AS performance_time,
            gt.assigned_user AS user,
            gt.due_date AS task_deadline,
            gt.creation_time AS task_created,
            gt.time_modified AS time_modified
        FROM guru_tasks gt
        LEFT JOIN soft_booking_kf sb ON gt.order_number = sb.booking_number

        UNION

        SELECT DISTINCT
            DATE(sb.service_creation_time) AS date,
            sb.booking_number AS order_number,
            NULL AS task_type,
            sb.customer AS customer,
            sb.lt_code AS lt_code,
            sb.status AS status,
            sb.service_element_price AS element_price,
            sb.service_original_amount AS original_amount,
            sb.service_creation_time AS performance_time,
            NULL AS user,
            NULL AS task_deadline,
            NULL AS task_created,
            NULL AS time_modified
        FROM soft_booking_kf sb
        LEFT JOIN guru_tasks gt ON sb.booking_number = gt.order_number
        WHERE gt.order_number IS NULL;
        """)

        # Execute the query
        db.execute(query)
        db.commit()
        logging.info("Order join table successfully populated.")

    except Exception as e:
        db.rollback()
        logging.error(f"Error populating order_join table: {e}", exc_info=True)
        print(f"Exception occurred while populating order_join table: {e}")
