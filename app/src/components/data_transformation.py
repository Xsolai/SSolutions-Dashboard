import pandas as pd
from app.src.logger import logging
import os 


def normalize_column_names(data):
    """Normalize column names by replacing special characters and trimming spaces."""
    data.columns = (
        data.columns.str.strip()
        .str.replace("sum", "Sum")  # Replace sum with Sum
        .str.replace("avg", "Avg")  # Replace avg with Avg
        .str.replace("\\", "_")  # Replace backslash with underscore
        .str.replace(" ", "_")  # Replace spaces with underscores
        .str.replace(".", "")
    )
    return data



def clean_and_convert_data(data):
    """Clean and convert data types of DataFrame columns."""
    try:
        # Define column conversions and default values
        logging.info(f"Available columns in DataFrame: {data.columns.tolist()}")
        column_conversions = {
            # Existing columns for GuruCallReason, GuruDaily, WorkflowReportGuru
            'Gesamt [#]': ('int', 0),
            'CB SALES [#]': ('int', 0),
            'CB WRONG CALL [#]': ('int', 0),
            'GURU CB BUCHUNG AUF GURU [#]': ('int', 0),
            'GURU SALES [#]': ('int', 0),
            'Guru SERVICE [#]': ('int', 0),
            'GURU WRONG [#]': ('int', 0),
            'SONSTIGES GURU [#]': ('int', 0),
            'Anrufe': ('int', 0),
            'Angenommen': ('int', 0),
            'Anrufe <= 5s': ('int', 0),
            'Aufgelegt vor Antwort': ('int', 0),
            'Schnell aufgelegt <= 5s': ('int', 0),
            'avg Wartezeit': ('float', 0.0),
            'max. Wartezeit': ('float', 0.0),
            'sum Nachbearbeitung Inbound': ('float', 0.0),
            'avg AHT Inbound': ('float', 0.0),
            'sum Gesprächszeit': ('float', 0.0),
            'ASR': ('float', 0.0),
            'SLA20\\20': ('float', 0.0),
            'Outbound': ('int', 0),
            'Outbound angenommen': ('int', 0),
            'sum Outbound Gesprächszeit Agent': ('float', 0.0),
            'sum Nachbearbeitung Outbound': ('float', 0.0),
            'Mailbox': ('str', ''),
            'Empfangen [#]': ('int', 0), 
            'Neue Vorgänge [#]': ('int', 0),
            'Gesendet [#]': ('int', 0),
            'Gesendet: Antwort [#]': ('int', 0),
            'Gesendet: Weiterleitung [#]': ('int', 0),
            'Gesendet: Neue Nachricht [#]': ('int', 0),
            'Gesendet: Rückfrage [#]': ('int', 0),
            'Gesendet: Zwischenbescheid [#]': ('int', 0),
            'Archiviert [#]': ('int', 0),
            'Papierkorb [#]': ('int', 0),
            'Verweilzeit-Netto [∅ hh:mm:ss]': ('time', '00:00:00'),
            'Bearbeitungszeit [∅ Min.]': ('time', '00:00:00'),
            'ServiceLevel-Brutto [%]': ('float', 0.0),
            'ServiceLevel-Brutto: Antwort [%]': ('float', 0.0),
            
            # QueueStatistics columns
            'Warteschleife': ('str', ''),  # Queue name
            'Anrufe': ('int', 0),  # Calls
            'Angeboten': ('int', 0),  # Offered
            'Angenommen': ('int', 0),  # Accepted
            'Aufgelegt vor Antwort': ('int', 0),  # Abandoned before answer
            'max. Wartezeit erreicht': ('int', 0),  # Max wait time reached
            'max. Warteplätze erreicht': ('int', 0),  # Max wait slots reached
            'Wartezeit': ('float', 0.0),  # Average wait time in seconds
            'max. Wartezeit': ('float', 0.0),  # Max wait time in seconds
            'Wartezeit': ('float', 0.0),  # Total wait time in minutes
            'Wartezeit Aufleger': ('float', 0.0),  # Avg wait time for abandoned calls in seconds
            'avg Gesprächszeit': ('float', 0.0),  # Average talk time in seconds
            'avg Nachbearbeitung Inbound': ('float', 0.0),  # Avg after-call work inbound in seconds
            'avg AHT Inbound': ('float', 0.0),  # Avg handling time inbound in seconds
            'max Gesprächszeit': ('float', 0.0),  # Max talk time in seconds
            'sum Gesprächszeit': ('float', 0.0),  # Total talk time in minutes
            'ASR': ('float', 0.0),  # ASR (%)
            'ASR20': ('float', 0.0),  # ASR within 20 seconds
            'SLA20\\20': ('float', 0.0),  # SLA20/20 (%)
            'Beantwortet20': ('int', 0),  # Answered within 20 seconds
            'Aufleger20': ('int', 0),  # Abandoned within 20 seconds
            'Outbound': ('int', 0),  # Outbound
            'Outbound angenommen': ('int', 0),  # Outbound accepted
            'sum Outbound Gesprächszeit Agent': ('float', 0.0),  # Total outbound talk time (agent) in minutes
            'sum Outbound Gesprächszeit Ziel': ('float', 0.0),  # Total outbound talk time (target) in minutes
            'avg Nachbearbeitung Outbound': ('float', 0.0),  # Avg after-call work outbound in seconds
            'AHT Outbound': ('float', 0.0),  # Avg handling time outbound in seconds
            'Weiterleitung (in)': ('int', 0),  # Transfer in
            'Weiterleitung (out)': ('int', 0),  # Transfer out
            #Booking table columns
            'CRS (Standard) original Status': ('str', ''),
            'CRS (Standard) Status': ('str', ''),
            'Leistung Element Preis': ('float', ''),
            'Auftrag Vermittler (Auftrag)': ('str', ''),
            'CRS (Standard Externes System)': ('str', ''),
            'Auftrag Anlagedatum (Auftrag)': ('str', ''),
            'CRS (Standard) original Buchungsnummer': ('str', ''),
            #Soft Booking table columns
            'Auftrag Auftragsnummer (Auftrag)': ('str', ''),
            'CRS (Standard) LT-Code': ('str', ''),
            'CRS (Standard) original Status': ('str', ''),
            'CRS (Standard) Status': ('str', ''), 
            'Leistung Element Preis': ('float', 0.0),
            'Leistung Originalbetrag': ('float', 0.0),  
        }

        # Replace non-numeric values like '-' with NaN, then fill NaN values and convert types
        for column, (dtype, default_value) in column_conversions.items():
            if column in data.columns:
                if dtype == 'int':
                    data[column] = pd.to_numeric(data[column], errors='coerce').fillna(0.0).astype(int)
                elif dtype == 'float':
                    data[column] = pd.to_numeric(data[column], errors='coerce').fillna(0).astype(float)
                elif column in ["Auftrag Anlagedatum (Auftrag)"]:
                    data[column] = pd.to_datetime(data[column], errors='coerce', dayfirst=True).dt.date
                elif column in ["Verweilzeit-Netto [∅ hh:mm:ss]", "Bearbeitungszeit [∅ Min.]"]:
                    data[column] = data[column].fillna("00:00:00").astype(str)
                else:
                    # Default to string
                    data[column] = data[column].fillna(default_value).astype(str)
        
        logging.info("Converted columns dtypes.")
        return data


    except Exception as e:
        logging.error(f"Error cleaning and converting data: {e}")
        return None



def load_excel_data(file_path, skiprows=None):
    try:
        if not os.path.exists(file_path):
            print(f"File {file_path} does not exist.")
            return None

        if file_path.endswith('.csv'):
            print("Reading csv", file_path)
            data = pd.read_csv(file_path, skiprows=skiprows, sep=";")
            print("Columns: \n", data.columns)
        else:
            print("Reading excel", file_path)
            data = pd.read_excel(file_path, skiprows=skiprows)
        
        # print("Data loaded successfully.")
        data.columns = data.columns.str.strip()

        # Clean column names
        data.columns =  [col.replace("∑\xa0", "sum ") for col in data.columns ]
        data.columns =  [col.replace("Ø\xa0", "avg ") for col in data.columns ]
        data.columns = data.columns.str.strip()

        # Clean and convert data types using the new function
        data = clean_and_convert_data(data)

        if data is not None:
            # print("Cleaned Data Columns:", data.columns)
            # print("Data info: ", data.info())
            print("Data: \n", data)
        
            return data

    except Exception as e:
        logging.error(f"Error loading file {file_path}: {e}")
        print(f"Exception while loading Excel file: {e}")
        return None
    
    
def load_csv_data(file_path):
    try:
        if not os.path.exists(file_path):
            print(f"File {file_path} does not exist.")
            return None

        # Load data from Excel with specified engine
        data = pd.read_csv(file_path, sep=";", encoding='latin1')
        df = data.iloc[:, :-1]
        
        print("Data loaded successfully.")
        # print("CSV\n", df)
        # print("DF Info \n", df.info())
        df.columns = df.columns.str.strip()

        # Clean and convert data types using the new function
        if "Leistung Element Preis" in df.columns:
            df["Leistung Element Preis"] = df["Leistung Element Preis"].str.replace(",", "").str.strip()
            df["Leistung Element Preis"] = pd.to_numeric(df["Leistung Element Preis"], errors='coerce')
            df["Leistung Element Preis"] = df["Leistung Element Preis"].apply(
                lambda x: x / 100 if x > 1000 else x
            )
            
        if "Leistung Anlagezeit" in df.columns:
            # print(pd.to_datetime(data["Leistung Anlagezeit"], errors='coerce', dayfirst=True).dt.date)
            df["Leistung Anlagezeit"] = pd.to_datetime(df["Leistung Anlagezeit"], errors='coerce', dayfirst=True)
            
        print(df.info())
        
        df = clean_and_convert_data(df)

        if df is not None:
            print("Cleaned Data Columns:", df.columns)
            print(df.info())
        
        return df

    except Exception as e:
        logging.error(f"Error loading file {file_path}: {e}")
        print(f"Exception while loading csv file: {e}")
        return None