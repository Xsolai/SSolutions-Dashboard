# import imaplib
# import email
# import os
# import re
# from datetime import datetime
# from app.src.logger import logging

# # Define your Outlook account credentials
# outlook_email = 'solasolution@ai-mitarbeiter.de'
# outlook_password = 'spCUA3imf82Uju'

# # Connect to the Outlook IMAP server
# imap_server = 'imap.ionos.de'

# def sanitize_filename(filename):
#     # Remove or replace characters that are not allowed in filenames
#     return re.sub(r'[<>:"/\\|?*]', '_', filename)

# def download_attachments():
#     today_date = datetime.now().strftime('%d-%b-%Y')  # Format: DD-Mon-YYYY
#     logging.info(f"Today's date: {today_date}")

#     attachments_dir = f'attachments/{today_date}'
#     os.makedirs(attachments_dir, exist_ok=True)

#     try:
#         # Connect to the IMAP server
#         mail = imaplib.IMAP4_SSL(imap_server)
#         mail.login(outlook_email, outlook_password)
#         logging.info("Login sucessfull")
#         # status, folders = mail.list()
#         # print("Available folders:", folders)
        
#         # Folders to check: Inbox and Junk
#         folders_to_check = ['inbox', 'Spam']  

#         for folder in folders_to_check:
#             logging.info(f"\nChecking folder: {folder}")
#             print(f"\nChecking folder: {folder}")
#             mail.select(folder)  # Select the folder

#             # Search for today's emails
#             search_criteria = f'SINCE {today_date}'
#             result, data = mail.search(None, search_criteria)

#             email_ids = data[0].split()
#             if not email_ids or email_ids == [b'']:
#                 logging.info(f"No emails found in {folder} for today.")
#                 continue  # Move to the next folder

#             for email_id in email_ids:
#                 # Fetch the email by ID
#                 result, message_data = mail.fetch(email_id, '(RFC822)')
#                 raw_email = message_data[0][1]

#                 # Parse the email
#                 msg = email.message_from_bytes(raw_email)

#                 # Iterate through the email parts
#                 for part in msg.walk():
#                     if part.get_content_disposition() == 'attachment':
#                         filename = part.get_filename()
#                         if filename and (filename.endswith('.xlsx') or filename.endswith('.xls') or filename.endswith('.csv')):
#                             sanitized_filename = sanitize_filename(filename)
#                             with open(os.path.join(attachments_dir, sanitized_filename), 'wb') as f:
#                                 f.write(part.get_payload(decode=True))
#                             logging.info(f'Downloaded attachment: {sanitized_filename} from {folder}')
#                             print(f'Downloaded attachment: {sanitized_filename} from {folder}')

#     except Exception as e:
#         logging.info(f'An error occurred: {e}')
#     finally:
#         mail.logout()

# # if __name__ == "__main__":
# #     download_attachments()


import imaplib
import email
import os
import re
from datetime import datetime
from app.src.logger import logging

# Define your Outlook account credentials
outlook_email = 'solasolution@ai-mitarbeiter.de'
outlook_password = 'spCUA3imf82Uju'

# Connect to the Outlook IMAP server
imap_server = 'imap.ionos.de'

def sanitize_filename(filename):
    # Remove or replace characters that are not allowed in filenames
    return re.sub(r'[<>:"/\\|?*]', '_', filename)

def download_attachments():
    today_date = datetime.now().strftime('%d-%b-%Y')  # Format: DD-Mon-YYYY
    logging.info(f"Today's date: {today_date}")

    attachments_dir = f'attachments/{today_date}'
    os.makedirs(attachments_dir, exist_ok=True)

    try:
        # Connect to the IMAP server
        mail = imaplib.IMAP4_SSL(imap_server)
        mail.login(outlook_email, outlook_password)
        logging.info("Login sucessfull")
        
        # Folders to check: Inbox and Junk
        folders_to_check = ['inbox', 'Spam']  

        for folder in folders_to_check:
            logging.info(f"\nChecking folder: {folder}")
            print(f"\nChecking folder: {folder}")
            status, select_data = mail.select(folder)  # Select the folder
            
            if status != 'OK':
                logging.info(f"Could not select folder {folder}: {select_data}")
                continue
            
            # Search for today's emails
            search_criteria = f'SINCE {today_date}'
            result, data = mail.search(None, search_criteria)

            if result != 'OK':
                logging.info(f"Search failed in {folder}: {data}")
                continue

            email_ids = data[0].split()
            if not email_ids or email_ids == [b'']:
                logging.info(f"No emails found in {folder} for today.")
                continue  # Move to the next folder

            for email_id in email_ids:
                # Fetch the email by ID
                result, message_data = mail.fetch(email_id, '(RFC822)')
                
                if result != 'OK' or not message_data or message_data[0] is None:
                    logging.info(f"Failed to fetch email {email_id}: {message_data}")
                    continue
                    
                # Handle the case when message_data[0] might be an integer or other non-sequence type
                if not isinstance(message_data[0], tuple) and not isinstance(message_data[0], list):
                    logging.info(f"Unexpected message data format for email {email_id}: {type(message_data[0])}: {message_data}")
                    continue
                
                # Now safely access the data
                if len(message_data[0]) > 1:
                    raw_email = message_data[0][1]
                    
                    # Parse the email
                    msg = email.message_from_bytes(raw_email)

                    # Iterate through the email parts
                    for part in msg.walk():
                        content_disposition = part.get_content_disposition()
                        if content_disposition and content_disposition == 'attachment':
                            filename = part.get_filename()
                            if filename and (filename.endswith('.xlsx') or filename.endswith('.xls') or filename.endswith('.csv')):
                                sanitized_filename = sanitize_filename(filename)
                                with open(os.path.join(attachments_dir, sanitized_filename), 'wb') as f:
                                    f.write(part.get_payload(decode=True))
                                logging.info(f'Downloaded attachment: {sanitized_filename} from {folder}')
                                print(f'Downloaded attachment: {sanitized_filename} from {folder}')

    except Exception as e:
        logging.error(f'An error occurred: {e}', exc_info=True)
    finally:
        try:
            mail.close()
        except:
            pass
        try:
            mail.logout()
        except:
            pass