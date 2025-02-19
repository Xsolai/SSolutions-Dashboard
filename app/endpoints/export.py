# from fastapi import APIRouter, Depends, Query
# from fastapi.responses import StreamingResponse
# from sqlalchemy.orm import Session
# from app.database.models.models import WorkflowReportGuruKF, User, EmailData
# from app.database.db.db_connection import  get_db
# from datetime import datetime, timedelta, date
# from sqlalchemy import func, or_
# from app.database.scehmas import schemas
# from app.database.auth import oauth2
# from app.src.utils import get_date_rng_subkpis, calculate_percentage_change, validate_user_and_date_permissions, domains_checker_email, time_format, time_formatter
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

# # class DailyData(BaseModel):
# #     date: date
# #     calls: int
# #     mails: int
# #     calls_offered: Optional[int]
# #     calls_handled: Optional[int]
# #     acc: Optional[float]
# #     sl: Optional[int]
# #     longest_wait: Optional[int]
# #     aht: Optional[int]
# #     talk_time_total: Optional[float]
# #     outbound_calls: Optional[int]
# #     outbound_time_total: Optional[float]
# #     mails_received: Optional[int]
# #     mails_sent: Optional[int]
# #     mails_archived: Optional[int]
# #     mail_aht: Optional[int]
# #     mail_processing_time: Optional[float]

# # class ReportData(BaseModel):
# #     year: int
# #     bookings: int
# #     contact_rate: float
# #     contacts: int
# #     total_calls: int
# #     total_mails: int
# #     mail_sales: int
# #     mail_service: int
# #     call_sales: int
# #     call_service: int
# #     sb: int
# #     midoco: int
# #     tui_queue: int
# #     sales_data: List[DailyData]
# #     service_data: List[DailyData]

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

# def get_data_5VF(call_query, all_call_query, email_query, all_email_query, start_date, end_date, start_date_booking, end_date_booking):
#     pass    

# @router.post("/export/excel")
# async def export_excel():
#     output = BytesIO()
#     wb = openpyxl.Workbook()
#     ws = wb.active
#     bold_font = Font(bold=True)
#     ws.title = f"FC neu {datetime.now().strftime('%d.%m.%y')}"

#     # Write header row with year and metrics
#     ws['A1'] = f"FC neu {datetime.now().date()}"
#     ws['A2'] = str(data.year)
#     ws['A2'].font = bold_font
#     headers = [
#         ('B2', 'Buchungen'),
#         ('C2', 'Kontaktrate 5VF'),
#         ('D2', 'Kontakte'),
#         ('E2', 'Call'),
#         ('F2', 'Mail'),
#         ('G2', 'Mail Sales'),
#         ('H2', 'Mail Service'),
#         ('I2', 'Call Sales'),
#         ('J2', 'Call Service'),
#         ('K2', 'SB'),
#         ('L2', 'Midoco 5VF'),
#         ('M2', 'TUI Queue')
#     ]
    
#     for cell, value in headers:
#         ws[cell] = value
#         ws[cell].font = bold_font

#     # Write values
#     ws['B3'] = data.bookings
#     ws['C3'] = data.contact_rate
#     ws['D3'] = data.contacts
#     ws['E3'] = data.total_calls
#     ws['F3'] = data.total_mails
#     ws['G3'] = data.mail_sales
#     ws['H3'] = data.mail_service
#     ws['I3'] = data.call_sales
#     ws['J3'] = data.call_service
#     ws['K3'] = data.sb
#     ws['L3'] = data.midoco
#     ws['M3'] = data.tui_queue

#     # Helper function to get month dates until yesterday
#     def get_month_dates():
#         today = datetime.now().date()
#         yesterday = today - timedelta(days=1)
#         first_day = today.replace(day=1)
#         dates = []
#         current_date = first_day
#         while current_date <= yesterday:
#             dates.append(current_date)
#             current_date += timedelta(days=1)
#         return dates

#     def create_section(workbook, start_row, section_name, dates):
#         # Write section header and merge cells
#         section_height = 6  # Total height of section (header + data rows)
#         workbook[f'A{start_row}'] = section_name
#         workbook.merge_cells(f'A{start_row}:A{start_row + section_height - 1}')
#         workbook[f'A{start_row}'].fill = PatternFill(start_color='D3D3D3', end_color='D3D3D3', fill_type='solid')
#         workbook[f'A{start_row}'].alignment = Alignment(horizontal='left', vertical='center')
#         workbook[f'A{start_row}'].font =bold_font

#         # Write year and merge
#         workbook[f'B{start_row}'] = str(data.year)
#         workbook[f'B{start_row}'].alignment = Alignment(horizontal='center', vertical='center')
#         workbook[f'B{start_row}'].font = bold_font
        
#         # Write Calls and Mails labels
#         calls_row = start_row + 3
#         mails_row = start_row + 5
#         workbook[f'B{calls_row}'] = "Calls"
#         workbook[f'B{mails_row}'] = "Mails"
#         workbook[f'B{calls_row}'].font = bold_font
#         workbook[f'B{mails_row}'].font = bold_font

#         # Write dates and data
#         days = ['Samstag', 'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']
#         col_offset = 2  # Starting from column C

#         # Write headers (days and dates)
#         for idx, date in enumerate(dates):
#             col = idx + col_offset + 1
#             # Write day name
#             workbook.cell(row=start_row, column=col, value=days[date.weekday()])
#             # Write date below 
#             workbook.cell(row=start_row + 1, column=col, value=date.strftime('%d/%m/%Y'))

#             # Get data for this date from data.sales_data or data.service_data
#             # Convert datetime to date for comparison if necessary
#             day_data = next((d for d in data.sales_data if 
#                            (d.date.date() if hasattr(d.date, 'date') else d.date) == date), None)
            
#             if day_data: 
#                 workbook.cell(row=calls_row, column=col, value=day_data.calls)
#                 workbook.cell(row=mails_row, column=col, value=day_data.mails)
#             else:
#                 workbook.cell(row=calls_row, column=col, value=0)
#                 workbook.cell(row=mails_row, column=col, value=0)

#         # Apply borders
#         for row in range(start_row, start_row + section_height):
#             for col in range(1, len(dates) + col_offset + 1):
#                 cell = workbook.cell(row=row, column=col)
#                 if not isinstance(cell, openpyxl.cell.cell.MergedCell):
#                     cell.border = Border(
#                         left=Side(style='thin'),
#                         right=Side(style='thin'),
#                         top=Side(style='thin'),
#                         bottom=Side(style='thin')
#                     )
#                     if row < start_row + 3:  # Only center align the day names and dates
#                         cell.alignment = Alignment(horizontal='center')

#         return start_row + section_height + 1 

#     # Get dates for the current month until yesterday
#     month_dates = get_month_dates()

#     # Create Sales section
#     next_row = create_section(ws, 5, '5VF Sales', month_dates)

#     # Create Service section
#     # next_row = create_section(next_row, '5VF Service', month_dates)

#     # Add detailed metrics
#     metrics = [
#         ('Abw. FC', None),
#         ('Calls offered', 'calls_offered'),
#         ('Calls handled', 'calls_handled'),
#         ('ACC', 'acc'),
#         ('SL', 'sl'),
#         ('längste Wartezeit', 'longest_wait'),
#         ('AHT', 'aht'),
#         ('Gesprächszeit gesamt', 'talk_time_total')
#     ]

#     for idx, (label, field) in enumerate(metrics):
#         row = next_row + idx
#         ws.cell(row=row, column=1, value=label)
#         if field:
#             for day_idx, date in enumerate(month_dates):
#                 day_data = next((d for d in data.sales_data if 
#                                (d.date.date() if hasattr(d.date, 'date') else d.date) == date), None)
#                 if day_data and hasattr(day_data, field):
#                     value = getattr(day_data, field, None)
#                     if value is not None:
#                         ws.cell(row=row, column=day_idx + 4, value=value)
                        
#     # Create Service section
#     next_row = create_section(ws, 20, '5VF Service', month_dates)

#     # Add detailed metrics
#     metrics = [
#         ('Abw. FC', None),
#         ('Calls offered', 'calls_offered'),
#         ('Calls handled', 'calls_handled'),
#         ('ACC', 'acc'),
#         ('SL', 'sl'),
#         ('längste Wartezeit', 'longest_wait'),
#         ('AHT', 'aht'),
#         ('Gesprächszeit gesamt', 'talk_time_total')
#     ]

#     for idx, (label, field) in enumerate(metrics):
#         row = next_row + idx
#         ws.cell(row=row, column=1, value=label)
#         if field:
#             for day_idx, date in enumerate(month_dates):
#                 day_data = next((d for d in data.sales_data if 
#                                (d.date.date() if hasattr(d.date, 'date') else d.date) == date), None)
#                 if day_data and hasattr(day_data, field):
#                     value = getattr(day_data, field, None)
#                     if value is not None:
#                         ws.cell(row=row, column=day_idx + 4, value=value)

#     # Bild and Guru
#     ws_bild = wb.create_sheet(title="Guru+Bild")
    
#     # Write header for Bild sheet
#     ws_bild['A1'] = f"Bild {datetime.now().date()}"
#     ws_bild['A1'].font = bold_font
    
#     month_dates = get_month_dates()

#     # Create Sales section
#     next_row = create_section(ws_bild, 5, 'BILD Sales', month_dates)

#     # Create Service section
#     # next_row = create_section(next_row, '5VF Service', month_dates)

#     # Add detailed metrics
#     metrics = [
#         ('Abw. FC', None),
#         ('Calls offered', 'calls_offered'),
#         ('Calls handled', 'calls_handled'),
#         ('ACC', 'acc'),
#         ('SL', 'sl'),
#         ('längste Wartezeit', 'longest_wait'),
#         ('AHT', 'aht'),
#         ('Gesprächszeit gesamt', 'talk_time_total')
#     ]

#     for idx, (label, field) in enumerate(metrics):
#         row = next_row + idx
#         ws_bild.cell(row=row, column=1, value=label)
#         if field:
#             for day_idx, date in enumerate(month_dates):
#                 day_data = next((d for d in data.sales_data if 
#                                (d.date.date() if hasattr(d.date, 'date') else d.date) == date), None)
#                 if day_data and hasattr(day_data, field):
#                     value = getattr(day_data, field, None)
#                     if value is not None:
#                         ws_bild.cell(row=row, column=day_idx + 4, value=value)
                        
#     # Create Service section
#     next_row = create_section(ws_bild, 20, '5VF Service', month_dates)

#     # Add detailed metrics
#     metrics = [
#         ('Abw. FC', None),
#         ('Calls offered', 'calls_offered'),
#         ('Calls handled', 'calls_handled'),
#         ('ACC', 'acc'),
#         ('SL', 'sl'),
#         ('längste Wartezeit', 'longest_wait'),
#         ('AHT', 'aht'),
#         ('Gesprächszeit gesamt', 'talk_time_total')
#     ]

#     for idx, (label, field) in enumerate(metrics):
#         row = next_row + idx
#         ws_bild.cell(row=row, column=1, value=label)
#         if field:
#             for day_idx, date in enumerate(month_dates):
#                 day_data = next((d for d in data.sales_data if 
#                                (d.date.date() if hasattr(d.date, 'date') else d.date) == date), None)
#                 if day_data and hasattr(day_data, field):
#                     value = getattr(day_data, field, None)
#                     if value is not None:
#                         ws_bild.cell(row=row, column=day_idx + 4, value=value)
    
#     # Save the file
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