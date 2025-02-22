# from fastapi import APIRouter, Depends, Query
# from fastapi.responses import StreamingResponse
# from sqlalchemy.orm import Session
# from app.database.models.models import WorkflowReportGuruKF, User, EmailData, QueueStatistics, AllQueueStatisticsData, SoftBookingKF
# from app.database.db.db_connection import  get_db
# from datetime import datetime, timedelta, date
# from sqlalchemy import func, or_
# from app.database.scehmas import schemas
# from app.database.auth import oauth2
# from app.src.utils import time_format, time_formatter, validate_user_and_date_permissions_export, domains_checker, domains_checker_email, domains_checker_booking
# from app.src.utils_booking import validate_user_and_date_permissions_booking_export
# from typing import Optional
# import pandas as pd
# from io import BytesIO
# import openpyxl, io
# from openpyxl.styles import PatternFill, Font, Alignment, Border, Side, Color
# from openpyxl.utils import get_column_letter
# from typing import List
# from pydantic import BaseModel

# router = APIRouter(
#     tags=["Export API"]
# )

# def get_export_data(call_query, all_call_query, email_query, all_email_query, booking_query, start_date, end_date, start_date_booking, end_date_booking, domain, company):
#     # call metrics
#     calls = all_call_query.with_entities(func.sum(AllQueueStatisticsData.calls)).filter(
#             AllQueueStatisticsData.date.between(start_date, end_date)
#         ).scalar() or 0 
#     calls_sales = call_query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.date.between(start_date, end_date),
#             QueueStatistics.queue_name.like(f"%Sales%")
#         ).scalar() or 0 
#     calls_service = call_query.with_entities(func.sum(QueueStatistics.calls)).filter(
#             QueueStatistics.date.between(start_date, end_date),
#             QueueStatistics.queue_name.like(f"%Service%")
#         ).scalar() or 0 
    
#     # email metrics
#     total_emails = all_email_query.with_entities(
#             func.sum(
#                 EmailData.received
#             )
#         ).filter(
#             EmailData.date.between(start_date, end_date),
            
#         ).scalar() or 0
        
#     sales_emails = email_query.with_entities(
#             func.sum(
#                 WorkflowReportGuruKF.received
#             )
#         ).filter(
#             WorkflowReportGuruKF.date.between(start_date, end_date),
#             WorkflowReportGuruKF.customer.notlike(f"%Service%")
#         ).scalar() or 0
        
#     service_emails = email_query.with_entities(
#             func.sum(
#                 WorkflowReportGuruKF.received
#             )
#         ).filter(
#             WorkflowReportGuruKF.date.between(start_date, end_date),
#             WorkflowReportGuruKF.customer.like(f"%Service%")
#         ).scalar() or 0
        
#     # booking metrics 
#     total_bookings = booking_query.with_entities(func.count(SoftBookingKF.original_status)).filter(SoftBookingKF.service_creation_time.between(start_date_booking, end_date_booking)).scalar() or 0
#     sb_bookings = booking_query.with_entities(func.count(SoftBookingKF.id)).filter((SoftBookingKF.status == "OK") | (SoftBookingKF.status == "RF"), SoftBookingKF.service_creation_time.between(start_date_booking, end_date_booking)).scalar() or 0
    
#     # calls_data = call_query.with_entities(QueueStatistics.date.label("date"), func.sum(QueueStatistics.calls).label("total_calls")).filter(
#     #         QueueStatistics.date.between(start_date, end_date),
#     #         QueueStatistics.queue_name.like(f"%Sales%")
#     #     ).all()
#     # calls_result = []
#     # for row in calls_data:
#     #     calls_result.append({
#     #         "date": row.date.strftime("%Y-%m-%d") if row.date else None,
#     #         "calls": row.total_calls
#     #     })   
#     if domain!="all":
#         if "Sales" in domain:
#             call_query = call_query.filter(QueueStatistics.queue_name.notlike("%Service%"))
#             all_call_query = all_call_query.filter(AllQueueStatisticsData.customer.notlike("%Service%"))
#             email_query = email_query.filter(WorkflowReportGuruKF.customer.notlike("%Service%"))
#             all_email_query = all_email_query.filter(EmailData.customer.notlike("%Service%"))
#             booking_query = booking_query.filter(SoftBookingKF.customer.notlike("%Service%"))
#         else:
#             call_query = call_query.filter(QueueStatistics.queue_name.like(f"%{domain}%"))
#             all_call_query = all_call_query.filter(AllQueueStatisticsData.customer.like("%{domain}%"))
#             email_query = email_query.filter(WorkflowReportGuruKF.customer.like(f"%{domain}%"))
#             all_email_query = all_email_query.filter(EmailData.customer.like(f"%{domain}%"))
#             booking_query = booking_query.filter(SoftBookingKF.customer.like(f"%{domain}%"))
#     else:
#         call_query = call_query
#         all_call_query = all_call_query
#         email_query = email_query
#         all_email_query = all_email_query
#         booking_query = booking_query
    
#     calls_data = call_query.with_entities(
#         QueueStatistics.date.label("date"),
#         func.sum(QueueStatistics.calls).label("total_calls")
#         ).filter(
#             QueueStatistics.date.between(start_date, end_date),
#         ).group_by(QueueStatistics.date).all()

#     calls_trend = {
#             row.date.strftime("%Y-%m-%d") if row.date else None: row.total_calls
#             for row in calls_data
#         } 
#     emails_data = all_email_query.with_entities(EmailData.date.label("date"), func.sum(EmailData.id).label("total_emails")).filter(
#             EmailData.date.between(start_date, end_date),
#         ).group_by(EmailData.date).all()
#     email_trend = {
#             row.date.strftime("%Y-%m-%d") if row.date else None: row.total_emails
#             for row in emails_data
#         }
        
#     calls_offered = all_call_query.with_entities(func.sum(AllQueueStatisticsData.offered)).filter(
#             AllQueueStatisticsData.date.between(start_date, end_date),
#             # AllQueueStatisticsData.queue_name.like(f"%Sales%")
#         ).scalar() or 0
#     calls_handled = all_call_query.with_entities(func.sum(AllQueueStatisticsData.accepted)).filter(
#             AllQueueStatisticsData.date.between(start_date, end_date),
#             # AllQueueStatisticsData.queue_name.like(f"%Sales%")
#         ).scalar() or 0
#     acc = all_call_query.with_entities(func.sum(AllQueueStatisticsData.asr)).filter(
#             AllQueueStatisticsData.date.between(start_date, end_date),
#             # AllQueueStatisticsData.queue_name.like(f"%Sales%")
#         ).scalar() or 0
#     sla = all_call_query.with_entities(func.sum(AllQueueStatisticsData.sla_20_20)).filter(
#             AllQueueStatisticsData.date.between(start_date, end_date),
#             # AllQueueStatisticsData.queue_name.like(f"%Sales%")
#         ).scalar() or 0
#     max_wait_time = all_call_query.with_entities(func.sum(AllQueueStatisticsData.max_wait_time)).filter(
#             AllQueueStatisticsData.date.between(start_date, end_date),
#             # AllQueueStatisticsData.queue_name.like(f"%Sales%")
#         ).scalar() or 0
#     aht = all_call_query.with_entities(func.sum(AllQueueStatisticsData.avg_handling_time_inbound)).filter(
#             AllQueueStatisticsData.date.between(start_date, end_date),
#             # AllQueueStatisticsData.queue_name.like(f"%Sales%")
#         ).scalar() or 0
#     total_call_time = all_call_query.with_entities(func.sum(AllQueueStatisticsData.total_outbound_talk_time_destination)).filter(
#             AllQueueStatisticsData.date.between(start_date, end_date),
#             # AllQueueStatisticsData.queue_name.like(f"%Sales%")
#         ).scalar() or 0  
#     call_outbound = all_call_query.with_entities(func.sum(AllQueueStatisticsData.outbound_accepted)).filter(
#             AllQueueStatisticsData.date.between(start_date, end_date),
#             # AllQueueStatisticsData.queue_name.like(f"%Sales%")
#         ).scalar() or 0
    
#     #email metrics
#     total_processing_time_seconds = 0.00001
#     total_processing_time_min = 0
#     total_processing_time_hour = 0
#     service_level_gross = all_email_query.with_entities(
#         func.avg(
#             EmailData.service_level_gross
#         )
#     ).filter(
#         EmailData.date.between(start_date, end_date)
#     ).scalar() or 0
    
#     processing_times = all_email_query.with_entities(EmailData.processing_time).filter(
#         EmailData.date.between(start_date, end_date)
#     ).all()
#     processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
#     # for pt in processing_times:
#     #     minutes,seconds = time_to_minutes(pt)
#     #     total_processing_time_seconds += seconds
#     #     total_processing_time_min += minutes
    
#     # total_processing_time_min += total_processing_time_seconds // 60
#     for pt in processing_times:
#         hours, minutes, seconds = time_format(pt)
#         total_processing_time_seconds += seconds
#         total_processing_time_min += minutes
#         total_processing_time_hour += hours

#     # Convert extra seconds into minutes
#     total_processing_time_min += total_processing_time_seconds // 60
#     total_processing_time_seconds = total_processing_time_seconds % 60  # Keep remaining seconds

#     # Convert extra minutes into hours
#     total_processing_time_hour += total_processing_time_min // 60
#     total_processing_time_min = total_processing_time_min % 60  # Keep remaining minutes
    
#     recieved = all_email_query.with_entities(
#         func.sum(
#             EmailData.received
#         )
#     ).filter(
#         EmailData.date.between(start_date, end_date)
#     ).scalar() or 0
    
#     sent = all_email_query.with_entities(
#         func.sum(
#             EmailData.sent
#         )
#     ).filter(
#         EmailData.date.between(start_date, end_date)
#     ).scalar() or 0
    
#     archived = all_email_query.with_entities(
#         func.sum(
#             EmailData.archived
#         )
#     ).filter(
#         EmailData.date.between(start_date, end_date)
#     ).scalar() or 0
    
#     return {
#         "total_bookings": total_bookings,
#         "calls": calls,
#         "calls_sales": calls_sales,
#         "calls_service": calls_service,
#         "total_emails": total_emails,
#         "mails_sales": sales_emails, 
#         "mails_service": service_emails,
#         "sb_bookings": sb_bookings,
#         "table":{
#             "calls": calls_trend,
#             "emails":email_trend,
#         },
#         "call_metrics": {
#             "calls_offered": calls_offered,
#             "calls_handled": calls_handled,
#             "ASR": acc,
#             "SLA": sla,
#             "Max_Waiting_Time": f"00:{str(int((max_wait_time)/60)).zfill(2)}:{str(int((max_wait_time)%60)).zfill(2)}",
#             "AHT": aht,
#             "Total_Call_Time": total_call_time,
#             "Outbound_Calls": call_outbound,
#         },
#         "email_metrics": {
#             "total_emails": total_emails,
#             "received": recieved,
#             "sent":sent,
#             "archived": archived,
#             "aht": aht,
#             "Total_Processing_Time": time_formatter(int(total_processing_time_hour), int(total_processing_time_min), int(total_processing_time_seconds)), 
#         },
        
#     }
   

# def create_header_style():
#     return Font(bold=True), PatternFill(start_color='D9D9D9', end_color='D9D9D9', fill_type='solid')

# def apply_cell_border(cell):
#     thin_border = Border(
#         left=Side(style='thin'),
#         right=Side(style='thin'),
#         top=Side(style='thin'),
#         bottom=Side(style='thin')
#     )
#     cell.border = thin_border

# def create_section(workbook, start_row, section_name, dates, data, bold_font, section_type="Sales"):
#     section_height = 6
#     # Write section header and merge cells
#     workbook[f'A{start_row}'] = section_name
#     workbook.merge_cells(f'A{start_row}:A{start_row + section_height - 1}')
#     workbook[f'A{start_row}'].fill = PatternFill(start_color='D3D3D3', end_color='D3D3D3', fill_type='solid')
#     workbook[f'A{start_row}'].alignment = Alignment(horizontal='left', vertical='center')
#     workbook[f'A{start_row}'].font = bold_font

#     # Write calls and mails rows
#     calls_row = start_row + 3
#     mails_row = start_row + 5
#     workbook[f'B{calls_row}'] = "Calls"
#     workbook[f'B{mails_row}'] = "Mails"
#     workbook[f'B{calls_row}'].font = bold_font
#     workbook[f'B{mails_row}'].font = bold_font

#     # Write dates and data
#     days = ['Samstag', 'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']
#     col_offset = 2
    
#     calls_data = data['table']['calls']
#     emails_data = data['table']['emails']

#     # Create a dictionary to store previous day's values for calculating daily differences
#     prev_email_value = 0

#     for idx, date in enumerate(dates):
#         col = idx + col_offset + 1
#         date_str = date.strftime('%Y-%m-%d')
        
#         # Write day name and date
#         workbook.cell(row=start_row, column=col, value=days[date.weekday()])
#         workbook.cell(row=start_row + 1, column=col, value=date.strftime('%d/%m/%Y'))

#         # For calls data - use daily values
#         call_value = calls_data.get(date_str, 0)
#         if section_type == "Service":
#             call_value = int(call_value * 0.857)  # Adjust for Service (85.7% of total)
#         workbook.cell(row=calls_row, column=col, value=call_value)
        
#         # For emails data - calculate daily difference
#         current_email_value = emails_data.get(date_str, prev_email_value)
#         daily_email_value = current_email_value - prev_email_value if idx > 0 else current_email_value
#         if section_type == "Service":
#             daily_email_value = int(daily_email_value * 0.553)  # Adjust for Service (55.3% of total)
#         workbook.cell(row=mails_row, column=col, value=daily_email_value)
#         prev_email_value = current_email_value

#     # Apply borders
#     for row in range(start_row, start_row + section_height):
#         for col in range(1, len(dates) + col_offset + 1):
#             cell = workbook.cell(row=row, column=col)
#             if not isinstance(cell, openpyxl.cell.cell.MergedCell):
#                 apply_cell_border(cell)
#                 if row < start_row + 3:  # Center align days and dates
#                     cell.alignment = Alignment(horizontal='center')

#     return start_row + section_height + 1

# def write_sheet_data(ws, result, sheet_prefix, split_domains=False, result_service=None):
#     bold_font = Font(bold=True)
#     ws['A1'] = f"{sheet_prefix} {datetime.now().date()}"
#     ws['A2'] = str(datetime.now().year)
#     ws['A2'].font = bold_font

#     # Write main metrics header
#     headers = [
#         ('B2', 'Buchungen'),
#         ('C2', 'Kontakte'),
#         ('D2', 'Call'),
#         ('E2', 'Mail'),
#         ('F2', 'Mail Sales'),
#         ('G2', 'Mail Service'),
#         ('H2', 'Call Sales'),
#         ('I2', 'Call Service'),
#         ('J2', 'SB')
#     ]
#     for cell, value in headers:
#         ws[cell] = value
#         ws[cell].font = bold_font

#     if split_domains and result_service:
#         # Combine main metrics from Sales and Service results
#         ws['B3'] = result['total_bookings'] + result_service['total_bookings']
#         ws['C3'] = (result['calls'] + result['total_emails']) + (result_service['calls'] + result_service['total_emails'])
#         ws['D3'] = result['calls'] + result_service['calls']
#         ws['E3'] = result['total_emails'] + result_service['total_emails']
#         ws['F3'] = result['mails_sales']  # assumed to come from Sales
#         ws['G3'] = result_service['mails_service']
#         ws['H3'] = result['calls_sales']
#         ws['I3'] = result_service['calls_service']
#         ws['J3'] = result['sb_bookings'] + result_service['sb_bookings']
#     else:
#         ws['B3'] = result['total_bookings']
#         ws['C3'] = result['calls'] + result['total_emails']
#         ws['D3'] = result['calls']
#         ws['E3'] = result['total_emails']
#         ws['F3'] = result['mails_sales']
#         ws['G3'] = result['mails_service']
#         ws['H3'] = result['calls_sales']
#         ws['I3'] = result['calls_service']
#         ws['J3'] = result['sb_bookings']

#     # Prepare dates (for current month)
#     today = datetime.now().date()
#     first_day = today.replace(day=1)
#     dates = []
#     current_date = first_day
#     while current_date <= today:
#         dates.append(current_date)
#         current_date += timedelta(days=1)

#     if split_domains and result_service:
#         # Create separate sections for Sales and Service.
#         next_row = create_section(ws, 5, f'{sheet_prefix} Sales', dates, result, bold_font)
#         next_row = create_section(ws, next_row + 2, f'{sheet_prefix} Service', dates, result_service, bold_font)
#     else:
#         # Create a single section.
#         next_row = create_section(ws, 5, f'{sheet_prefix}', dates, result, bold_font)

#     # Add metrics details (call and email metrics)
#     next_row += 2
#     metrics_header_cell = ws.cell(row=next_row, column=1, value="Metrics")
#     metrics_header_cell.font = bold_font
#     next_row += 1

#     call_metrics_header = ws.cell(row=next_row, column=1, value="Call Metrics")
#     call_metrics_header.font = bold_font
#     next_row += 1
#     call_metrics = [
#         ('Calls offered', 'calls_offered'),
#         ('Calls handled', 'calls_handled'),
#         ('ASR', 'ASR'),
#         ('SLA', 'SLA'),
#         ('Max Waiting Time', 'Max_Waiting_Time'),
#         ('AHT', 'AHT'),
#         ('Total Call Time', 'Total_Call_Time'),
#         ('Outbound Calls', 'Outbound_Calls')
#     ]
#     for idx, (label, field) in enumerate(call_metrics):
#         row = next_row + idx
#         if split_domains and result_service:
#             value = result['call_metrics'].get(field, 0) + result_service['call_metrics'].get(field, 0)
#         else:
#             value = result['call_metrics'].get(field, 0)
#         ws.cell(row=row, column=1, value=label)
#         ws.cell(row=row, column=2, value=value)

#     next_row += len(call_metrics) + 2
#     email_metrics_header = ws.cell(row=next_row, column=1, value="Email Metrics")
#     email_metrics_header.font = bold_font
#     next_row += 1
#     email_metrics = [
#         ('Emails', 'total_emails'),
#         ('Emails received', 'received'),
#         ('Emails sent', 'sent'),
#         ('Emails archived', 'archived'),
#         ('AHT', 'aht'),
#         ('Total Processing Time', 'Total_Processing_Time')
#     ]
#     for idx, (label, field) in enumerate(email_metrics):
#         row = next_row + idx
#         if split_domains and result_service:
#             value = result['email_metrics'].get(field, 0) + result_service['email_metrics'].get(field, 0)
#         else:
#             value = result['email_metrics'].get(field, 0)
#         ws.cell(row=row, column=1, value=label)
#         ws.cell(row=row, column=2, value=value)

#     return next_row + len(email_metrics)


# @router.post("/export/excel")
# async def export_excel(
#     db: Session = Depends(get_db),
#     current_user: schemas.User = Depends(oauth2.get_current_user)
# ):
#     user = db.query(User).filter(User.email == current_user.get("email")).first()
#     start_date, end_date = validate_user_and_date_permissions_export(db=db, current_user=current_user)
#     start_date_booking, end_date_booking = validate_user_and_date_permissions_booking_export(db=db, current_user=current_user)
#     is_admin_or_employee = user.role in ["admin", "employee"]

#     # For admin, export all companies; for non-admin, derive accessible companies
#     if is_admin_or_employee:
#         companies_to_export = ["5vorflug", "bild", "guru", "Galeria", "ADAC", "Urlaub"]
#     else:
#         accessible_companies, _, _ = domains_checker(db, user.id, filter_5vf="5vorFlug", filter_bild="BILD")
#         companies_to_export = accessible_companies

#     # Define which companies get split results
#     split_companies = ["5vorflug", "guru", "bild"]

#     output = BytesIO()
#     wb = openpyxl.Workbook()
#     first_sheet = True

#     # Loop over each company
#     for company in companies_to_export:
#         # Get company-specific filters by passing the target_company parameter
#         acc_companies, call_filters, all_call_filters = domains_checker(
#             db, user.id, filter_5vf="5vorFlug", filter_bild="BILD", target_company=company
#         )
#         acc_companies_email, email_filters, all_email_filters = domains_checker_email(
#             db, user.id, filter_5vf="5vorFlug", filter_bild="Bild", target_company=company
#         )
#         acc_companies_booking, booking_filters, order_filters = domains_checker_booking(
#             db, user.id, filter_5vf="5vF", filter_bild="BILD", target_company=company
#         )

#         # Skip if the company is not accessible
#         if company.lower() not in [c.lower() for c in acc_companies]:
#             continue

#         # Build queries using the company-specific filters
#         call_query = db.query(QueueStatistics).filter(or_(*call_filters)) if call_filters else db.query(QueueStatistics)
#         all_call_query = db.query(AllQueueStatisticsData).filter(or_(*all_call_filters)) if all_call_filters else db.query(AllQueueStatisticsData)
#         email_query = db.query(WorkflowReportGuruKF).filter(or_(*email_filters)) if email_filters else db.query(WorkflowReportGuruKF)
#         all_email_query = db.query(EmailData).filter(or_(*all_email_filters)) if all_email_filters else db.query(EmailData)
#         booking_query = db.query(SoftBookingKF).filter(or_(*booking_filters)) if booking_filters else db.query(SoftBookingKF)

#         # Create or get worksheet for this company
#         if first_sheet:
#             ws = wb.active
#             ws.title = company
#             first_sheet = False
#         else:
#             ws = wb.create_sheet(title=company)

#         # For companies that should have separate Sales and Service sections…
#         if company.lower() in split_companies:
#             # Get Sales data
#             result_sales = get_export_data(
#                 call_query=call_query,
#                 all_call_query=all_call_query,
#                 email_query=email_query,
#                 all_email_query=all_email_query,
#                 booking_query=booking_query,
#                 start_date=start_date,
#                 end_date=end_date,
#                 start_date_booking=start_date_booking,
#                 end_date_booking=end_date_booking,
#                 domain="Sales",
#                 company=company
#             )
#             # Get Service data
#             result_service = get_export_data(
#                 call_query=call_query,
#                 all_call_query=all_call_query,
#                 email_query=email_query,
#                 all_email_query=all_email_query,
#                 booking_query=booking_query,
#                 start_date=start_date,
#                 end_date=end_date,
#                 start_date_booking=start_date_booking,
#                 end_date_booking=end_date_booking,
#                 domain="Service",
#                 company=company
#             )
#             write_sheet_data(ws, result_sales, company, split_domains=True, result_service=result_service)
#         else:
#             # For companies that do not split domains, simply get a single result.
#             result = get_export_data(
#                 call_query=call_query,
#                 all_call_query=all_call_query,
#                 email_query=email_query,
#                 all_email_query=all_email_query,
#                 booking_query=booking_query,
#                 start_date=start_date,
#                 end_date=end_date,
#                 start_date_booking=start_date_booking,
#                 end_date_booking=end_date_booking,
#                 domain="Sales",  # Domain is not used here
#                 company=company
#             )
#             write_sheet_data(ws, result, company, split_domains=False)

#     wb.save(output)
#     output.seek(0)

#     headers = {
#         'Content-Disposition': f'attachment; filename="FC_neu_{datetime.now().strftime("%d_%m_%Y")}.xlsx"'
#     }
#     return StreamingResponse(
#         output,
#         media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
#         headers=headers
#     )
    
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.models.models import (
    WorkflowReportGuruKF, User, EmailData, QueueStatistics, 
    AllQueueStatisticsData, SoftBookingKF
)
from app.database.db.db_connection import get_db
from datetime import datetime, timedelta, date
from sqlalchemy import func, or_
from app.database.scehmas import schemas
from app.database.auth import oauth2
from app.src.utils import (
    time_format, time_formatter, validate_user_and_date_permissions_export,
    domains_checker, domains_checker_email, domains_checker_booking
)
from app.src.utils_booking import validate_user_and_date_permissions_booking_export
from typing import Optional, List
import pandas as pd
from io import BytesIO
import openpyxl, io
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side, Color
from openpyxl.utils import get_column_letter
from pydantic import BaseModel

router = APIRouter(tags=["Export API"])


def get_export_data(call_query, all_call_query, email_query, all_email_query, booking_query, 
                    start_date, end_date, start_date_booking, end_date_booking, domain, company):
    # Call metrics
    calls = all_call_query.with_entities(func.sum(AllQueueStatisticsData.calls)).filter(
        AllQueueStatisticsData.date.between(start_date, end_date)
    ).scalar() or 0
    calls_sales = call_query.with_entities(func.sum(QueueStatistics.calls)).filter(
        QueueStatistics.date.between(start_date, end_date),
        QueueStatistics.queue_name.like(f"%Sales%")
    ).scalar() or 0
    calls_service = call_query.with_entities(func.sum(QueueStatistics.calls)).filter(
        QueueStatistics.date.between(start_date, end_date),
        QueueStatistics.queue_name.like(f"%Service%")
    ).scalar() or 0

    # Email metrics
    total_emails = all_email_query.with_entities(func.sum(EmailData.received)).filter(
        EmailData.date.between(start_date, end_date)
    ).scalar() or 0

    sales_emails = email_query.with_entities(func.sum(WorkflowReportGuruKF.received)).filter(
        WorkflowReportGuruKF.date.between(start_date, end_date),
        WorkflowReportGuruKF.customer.notlike(f"%Service%")
    ).scalar() or 0

    service_emails = email_query.with_entities(func.sum(WorkflowReportGuruKF.received)).filter(
        WorkflowReportGuruKF.date.between(start_date, end_date),
        WorkflowReportGuruKF.customer.like(f"%Service%")
    ).scalar() or 0

    # Booking metrics 
    total_bookings = booking_query.with_entities(func.count(SoftBookingKF.original_status)).filter(
        SoftBookingKF.service_creation_time.between(start_date_booking, end_date_booking)
    ).scalar() or 0
    sb_bookings = booking_query.with_entities(func.count(SoftBookingKF.id)).filter(
        (SoftBookingKF.status == "OK") | (SoftBookingKF.status == "RF"), 
        SoftBookingKF.service_creation_time.between(start_date_booking, end_date_booking)
    ).scalar() or 0

    # Apply domain filtering if domain is not "all"
    if domain != "all":
        if "Sales" in domain:
            call_query = call_query.filter(QueueStatistics.queue_name.notlike("%Service%"))
            all_call_query = all_call_query.filter(AllQueueStatisticsData.customer.notlike("%Service%"))
            email_query = email_query.filter(WorkflowReportGuruKF.customer.notlike("%Service%"))
            all_email_query = all_email_query.filter(EmailData.customer.notlike("%Service%"))
            booking_query = booking_query.filter(SoftBookingKF.customer.notlike("%Service%"))
        else:
            call_query = call_query.filter(QueueStatistics.queue_name.like(f"%{domain}%"))
            all_call_query = all_call_query.filter(AllQueueStatisticsData.customer.like(f"%{domain}%"))
            email_query = email_query.filter(WorkflowReportGuruKF.customer.like(f"%{domain}%"))
            all_email_query = all_email_query.filter(EmailData.customer.like(f"%{domain}%"))
            booking_query = booking_query.filter(SoftBookingKF.customer.like(f"%{domain}%"))

    # Daily calls trend
    calls_data = call_query.with_entities(
        QueueStatistics.date.label("date"),
        func.sum(QueueStatistics.calls).label("total_calls")
    ).filter(
        QueueStatistics.date.between(start_date, end_date)
    ).group_by(QueueStatistics.date).all()

    calls_trend = {
        row.date.strftime("%Y-%m-%d") if row.date else None: row.total_calls
        for row in calls_data
    }
    
    # Daily emails trend
    emails_data = all_email_query.with_entities(
        EmailData.date.label("date"), 
        func.sum(EmailData.id).label("total_emails")
    ).filter(
        EmailData.date.between(start_date, end_date)
    ).group_by(EmailData.date).all()
    email_trend = {
        row.date.strftime("%Y-%m-%d") if row.date else None: row.total_emails
        for row in emails_data
    }
    
    # Other call metrics
    calls_offered = all_call_query.with_entities(func.sum(AllQueueStatisticsData.offered)).filter(
        AllQueueStatisticsData.date.between(start_date, end_date)
    ).scalar() or 0
    calls_handled = all_call_query.with_entities(func.sum(AllQueueStatisticsData.accepted)).filter(
        AllQueueStatisticsData.date.between(start_date, end_date)
    ).scalar() or 0
    acc = all_call_query.with_entities(func.sum(AllQueueStatisticsData.asr)).filter(
        AllQueueStatisticsData.date.between(start_date, end_date)
    ).scalar() or 0
    sla = all_call_query.with_entities(func.sum(AllQueueStatisticsData.sla_20_20)).filter(
        AllQueueStatisticsData.date.between(start_date, end_date)
    ).scalar() or 0
    max_wait_time = all_call_query.with_entities(func.sum(AllQueueStatisticsData.max_wait_time)).filter(
        AllQueueStatisticsData.date.between(start_date, end_date)
    ).scalar() or 0
    aht = all_call_query.with_entities(func.sum(AllQueueStatisticsData.avg_handling_time_inbound)).filter(
        AllQueueStatisticsData.date.between(start_date, end_date)
    ).scalar() or 0
    total_call_time = all_call_query.with_entities(func.sum(AllQueueStatisticsData.total_outbound_talk_time_destination)).filter(
        AllQueueStatisticsData.date.between(start_date, end_date)
    ).scalar() or 0  
    call_outbound = all_call_query.with_entities(func.sum(AllQueueStatisticsData.outbound_accepted)).filter(
        AllQueueStatisticsData.date.between(start_date, end_date)
    ).scalar() or 0

    # Email processing metrics
    total_processing_time_seconds = 0.00001
    total_processing_time_min = 0
    total_processing_time_hour = 0
    service_level_gross = all_email_query.with_entities(func.avg(EmailData.service_level_gross)).filter(
        EmailData.date.between(start_date, end_date)
    ).scalar() or 0

    processing_times = all_email_query.with_entities(EmailData.processing_time).filter(
        EmailData.date.between(start_date, end_date)
    ).all()
    processing_times = [pt[0] if isinstance(pt, tuple) else pt for pt in processing_times]
    for pt in processing_times:
        hours, minutes, seconds = time_format(pt)
        total_processing_time_seconds += seconds
        total_processing_time_min += minutes
        total_processing_time_hour += hours

    total_processing_time_min += total_processing_time_seconds // 60
    total_processing_time_seconds = total_processing_time_seconds % 60
    total_processing_time_hour += total_processing_time_min // 60
    total_processing_time_min = total_processing_time_min % 60

    recieved = all_email_query.with_entities(func.sum(EmailData.received)).filter(
        EmailData.date.between(start_date, end_date)
    ).scalar() or 0

    sent = all_email_query.with_entities(func.sum(EmailData.sent)).filter(
        EmailData.date.between(start_date, end_date)
    ).scalar() or 0

    archived = all_email_query.with_entities(func.sum(EmailData.archived)).filter(
        EmailData.date.between(start_date, end_date)
    ).scalar() or 0

    return {
        "total_bookings": total_bookings,
        "calls": calls,
        "calls_sales": calls_sales,
        "calls_service": calls_service,
        "total_emails": total_emails,
        "mails_sales": sales_emails, 
        "mails_service": service_emails,
        "sb_bookings": sb_bookings,
        "table": {
            "calls": calls_trend,
            "emails": email_trend,
        },
        "call_metrics": {
            "calls_offered": calls_offered,
            "calls_handled": calls_handled,
            "ASR": acc,
            "SLA": sla,
            "Max Waiting Time": f"00:{str(int(max_wait_time/60)).zfill(2)}:{str(int(max_wait_time)%60).zfill(2)}",
            "AHT": aht,
            "Total_Call_Time": total_call_time,
            "Outbound_Calls": call_outbound,
        },
        "email_metrics": {
            "total_emails": total_emails,
            "received": recieved,
            "sent": sent,
            "archived": archived,
            "aht": aht,
            "Total_Processing_Time": time_formatter(int(total_processing_time_hour), int(total_processing_time_min), int(total_processing_time_seconds)),
        },
    }


def create_header_style():
    return Font(bold=True), PatternFill(start_color='D9D9D9', end_color='D9D9D9', fill_type='solid')


def apply_cell_border(cell):
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    cell.border = thin_border


def create_section(workbook, start_row, section_name, dates, data, bold_font, section_type="Sales"):
    section_height = 6
    workbook[f'A{start_row}'] = section_name
    workbook.merge_cells(f'A{start_row}:A{start_row + section_height - 1}')
    workbook[f'A{start_row}'].fill = PatternFill(start_color='D3D3D3', end_color='D3D3D3', fill_type='solid')
    workbook[f'A{start_row}'].alignment = Alignment(horizontal='left', vertical='center')
    workbook[f'A{start_row}'].font = bold_font

    calls_row = start_row + 3
    mails_row = start_row + 5
    workbook[f'B{calls_row}'] = "Calls"
    workbook[f'B{mails_row}'] = "Mails"
    workbook[f'B{calls_row}'].font = bold_font
    workbook[f'B{mails_row}'].font = bold_font

    days = ['Samstag', 'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']
    col_offset = 2
    calls_data = data['table']['calls']
    emails_data = data['table']['emails']
    prev_email_value = 0

    for idx, date in enumerate(dates):
        col = idx + col_offset + 1
        date_str = date.strftime('%Y-%m-%d')
        workbook.cell(row=start_row, column=col, value=days[date.weekday()])
        workbook.cell(row=start_row + 1, column=col, value=date.strftime('%d/%m/%Y'))
        call_value = calls_data.get(date_str, 0)
        if section_type == "Service":
            call_value = int(call_value * 0.857)
        workbook.cell(row=calls_row, column=col, value=call_value)
        current_email_value = emails_data.get(date_str, prev_email_value)
        daily_email_value = current_email_value - prev_email_value if idx > 0 else current_email_value
        if section_type == "Service":
            daily_email_value = int(daily_email_value * 0.553)
        workbook.cell(row=mails_row, column=col, value=daily_email_value)
        prev_email_value = current_email_value

    for row in range(start_row, start_row + section_height):
        for col in range(1, len(dates) + col_offset + 1):
            cell = workbook.cell(row=row, column=col)
            if not isinstance(cell, openpyxl.cell.cell.MergedCell):
                apply_cell_border(cell)
                if row < start_row + 3:
                    cell.alignment = Alignment(horizontal='center')

    return start_row + section_height + 1

def write_metrics(ws, start_row, result, bold_font):
    """
    Writes Call and Email Metrics in the worksheet.
    """
    row = start_row
    ws.cell(row=row, column=1, value="Call Metrics").font = bold_font
    row += 1
    call_metrics = [
        ('Calls offered', 'calls_offered'),
        ('Calls handled', 'calls_handled'),
        ('ASR', 'ASR'),
        ('SLA', 'SLA'),
        ('Max Waiting Time', 'Max_Waiting_Time'),
        ('AHT', 'AHT'),
        ('Total Call Time', 'Total_Call_Time'),
        ('Outbound Calls', 'Outbound_Calls')
    ]
    for label, field in call_metrics:
        ws.cell(row=row, column=1, value=label)
        ws.cell(row=row, column=2, value=result['call_metrics'].get(field, 0))
        row += 1

    row += 1
    ws.cell(row=row, column=1, value="Email Metrics").font = bold_font
    row += 1
    email_metrics = [
        ('Emails', 'total_emails'),
        ('Emails received', 'received'),
        ('Emails sent', 'sent'),
        ('Emails archived', 'archived'),
        ('AHT', 'aht'),
        ('Total Processing Time', 'Total_Processing_Time')
    ]
    for label, field in email_metrics:
        ws.cell(row=row, column=1, value=label)
        ws.cell(row=row, column=2, value=result['email_metrics'].get(field, 0))
        row += 1

    return row

def write_sheet_data(ws, result, sheet_prefix, split_domains=False, result_service=None):
    """
    Writes structured data in the worksheet in this format:
    
    - Sales Table (if split)
    - Sales Metrics (if split)
    - Service Table (if split)
    - Service Metrics (if split)
    - Single Table (if no split)
    """
    bold_font = Font(bold=True)
    ws['A1'] = f"{sheet_prefix} {datetime.now().date()}"
    ws['A2'] = str(datetime.now().year)
    ws['A2'].font = bold_font

    # Write the main metrics header
    headers = [
        ('B2', 'Buchungen'),
        ('C2', 'Kontakte'),
        ('D2', 'Call'),
        ('E2', 'Mail'),
        ('F2', 'Mail Sales'),
        ('G2', 'Mail Service'),
        ('H2', 'Call Sales'),
        ('I2', 'Call Service'),
        ('J2', 'SB')
    ]
    for cell, value in headers:
        ws[cell] = value
        ws[cell].font = bold_font

    # Populate the main metrics row
    if split_domains and result_service:
        ws['B3'] = result['total_bookings'] + result_service['total_bookings']
        ws['C3'] = (result['calls'] + result['total_emails']) + (result_service['calls'] + result_service['total_emails'])
        ws['D3'] = result['calls'] + result_service['calls']
        ws['E3'] = result['total_emails'] + result_service['total_emails']
        ws['F3'] = result['mails_sales']
        ws['G3'] = result_service['mails_service']
        ws['H3'] = result['calls_sales']
        ws['I3'] = result_service['calls_service']
        ws['J3'] = result['sb_bookings'] + result_service['sb_bookings']
    else:
        ws['B3'] = result['total_bookings']
        ws['C3'] = result['calls'] + result['total_emails']
        ws['D3'] = result['calls']
        ws['E3'] = result['total_emails']
        ws['F3'] = result['mails_sales']
        ws['G3'] = result['mails_service']
        ws['H3'] = result['calls_sales']
        ws['I3'] = result['calls_service']
        ws['J3'] = result['sb_bookings']

    today = datetime.now().date()
    first_day = today.replace(day=1)
    dates = []
    current_date = first_day
    while current_date <= today:
        dates.append(current_date)
        current_date += timedelta(days=1)

    next_row = 5  # Start after the main metrics row

    # ---- Sales Section ----
    if split_domains:
        ws.cell(row=next_row, column=1, value=f"{sheet_prefix} Sales").font = bold_font
        next_row += 1
        next_row = create_section(ws, next_row, f"{sheet_prefix} Sales", dates, result, bold_font)
        next_row += 2  # Space before metrics

        # Add Sales Metrics
        ws.cell(row=next_row, column=1, value="Sales Metrics").font = bold_font
        next_row += 1
        next_row = write_metrics(ws, next_row, result, bold_font)

    # ---- Service Section ----
    if split_domains and result_service:
        next_row += 2  # Add some space
        ws.cell(row=next_row, column=1, value=f"{sheet_prefix} Service").font = bold_font
        next_row += 1
        next_row = create_section(ws, next_row, f"{sheet_prefix} Service", dates, result_service, bold_font)
        next_row += 2  # Space before metrics

        # Add Service Metrics
        ws.cell(row=next_row, column=1, value="Service Metrics").font = bold_font
        next_row += 1
        next_row = write_metrics(ws, next_row, result_service, bold_font)
    
    # If no splitting is needed, write everything as a single block.
    if not split_domains:
        ws.cell(row=next_row, column=1, value=f"{sheet_prefix} Overview").font = bold_font
        next_row += 1
        next_row = create_section(ws, next_row, f"{sheet_prefix}", dates, result, bold_font)
        next_row += 2  # Space before metrics

        # Add Metrics
        ws.cell(row=next_row, column=1, value="Metrics").font = bold_font
        next_row += 1
        next_row = write_metrics(ws, next_row, result, bold_font)

    return next_row + len(headers)  


@router.post("/export/excel")
async def export_excel(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user)
):
    user = db.query(User).filter(User.email == current_user.get("email")).first()
    start_date, end_date = validate_user_and_date_permissions_export(db=db, current_user=current_user)
    start_date_booking, end_date_booking = validate_user_and_date_permissions_booking_export(db=db, current_user=current_user)
    is_admin_or_employee = user.role in ["admin", "employee"]

    if is_admin_or_employee:
        companies_to_export = ["5vorflug", "bild", "guru", "Galeria", "ADAC", "Urlaub"]
    else:
        accessible_companies, _, _ = domains_checker(db, user.id, filter_5vf="5vorFlug", filter_bild="BILD")
        companies_to_export = accessible_companies

    split_companies = ["5vorflug", "guru", "bild"]

    output = BytesIO()
    wb = openpyxl.Workbook()
    first_sheet = True

    for company in companies_to_export:
        acc_companies, call_filters, all_call_filters = domains_checker(
            db, user.id, filter_5vf="5vorFlug", filter_bild="BILD", target_company=company
        )
        acc_companies_email, email_filters, all_email_filters = domains_checker_email(
            db, user.id, filter_5vf="5vorFlug", filter_bild="Bild", target_company=company
        )
        acc_companies_booking, booking_filters, order_filters = domains_checker_booking(
            db, user.id, filter_5vf="5vF", filter_bild="BILD", target_company=company
        )

        if company.lower() not in [c.lower() for c in acc_companies]:
            continue

        call_query = db.query(QueueStatistics).filter(or_(*call_filters)) if call_filters else db.query(QueueStatistics)
        all_call_query = db.query(AllQueueStatisticsData).filter(or_(*all_call_filters)) if all_call_filters else db.query(AllQueueStatisticsData)
        email_query = db.query(WorkflowReportGuruKF).filter(or_(*email_filters)) if email_filters else db.query(WorkflowReportGuruKF)
        all_email_query = db.query(EmailData).filter(or_(*all_email_filters)) if all_email_filters else db.query(EmailData)
        booking_query = db.query(SoftBookingKF).filter(or_(*booking_filters)) if booking_filters else db.query(SoftBookingKF)

        if first_sheet:
            ws = wb.active
            ws.title = company
            first_sheet = False
        else:
            ws = wb.create_sheet(title=company)

        if company.lower() in split_companies:
            result_sales = get_export_data(
                call_query=call_query,
                all_call_query=all_call_query,
                email_query=email_query,
                all_email_query=all_email_query,
                booking_query=booking_query,
                start_date=start_date,
                end_date=end_date,
                start_date_booking=start_date_booking,
                end_date_booking=end_date_booking,
                domain="Sales",
                company=company
            )
            result_service = get_export_data(
                call_query=call_query,
                all_call_query=all_call_query,
                email_query=email_query,
                all_email_query=all_email_query,
                booking_query=booking_query,
                start_date=start_date,
                end_date=end_date,
                start_date_booking=start_date_booking,
                end_date_booking=end_date_booking,
                domain="Service",
                company=company
            )
            write_sheet_data(ws, result_sales, company, split_domains=True, result_service=result_service)
        else:
            result = get_export_data(
                call_query=call_query,
                all_call_query=all_call_query,
                email_query=email_query,
                all_email_query=all_email_query,
                booking_query=booking_query,
                start_date=start_date,
                end_date=end_date,
                start_date_booking=start_date_booking,
                end_date_booking=end_date_booking,
                domain="Sales",  # Domain not used here
                company=company
            )
            write_sheet_data(ws, result, company, split_domains=False)

    wb.save(output)
    output.seek(0)
    headers = {
        'Content-Disposition': f'attachment; filename="FC_neu_{datetime.now().strftime("%d_%m_%Y")}.xlsx"'
    }
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers=headers
    )
