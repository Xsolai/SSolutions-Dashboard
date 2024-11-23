import imaplib
import email
import os
import re
from datetime import datetime

# Define your Outlook account credentials
outlook_email = 'solasolution@ai-mitarbeiter.de'
outlook_password = 'spCUA3imf82Uju'

# Connect to the Outlook IMAP server
imap_server = 'imap.ionos.de'

def sanitize_filename(filename):
    # Remove or replace characters that are not allowed in filenames
    return re.sub(r'[<>:"/\\|?*]', '_', filename)

def download_attachments():
    # Create a directory to save today's Excel attachments
    today_date = datetime.now().strftime('%d-%b-%Y')  # Format: DD-Mon-YYYY
    attachments_dir = f'attachments/{today_date}'
    os.makedirs(attachments_dir, exist_ok=True)

    try:
        # Connect to the IMAP server
        mail = imaplib.IMAP4_SSL(imap_server)
        mail.login(outlook_email, outlook_password)

        # Select the mailbox you want to check (INBOX in this case)
        mail.select('inbox')

        # Search for all emails from today
        search_criteria = f'SINCE {today_date}'
        result, data = mail.search(None, search_criteria)
        email_ids = data[0].split()

        # Check if there are any emails for today
        if not email_ids or email_ids == [b'']:
            print("No emails found for today.")
        else:
            for email_id in email_ids:
                # Fetch the email by ID
                result, message_data = mail.fetch(email_id, '(RFC822)')
                raw_email = message_data[0][1]

                # Parse the email content
                msg = email.message_from_bytes(raw_email)

                # Iterate through the email parts
                for part in msg.walk():
                    # If the part is an attachment and an Excel file
                    if part.get_content_disposition() == 'attachment':
                        filename = part.get_filename()
                        if filename and (filename.endswith('.xlsx') or filename.endswith('.xls') or filename.endswith('.csv')):
                            # Sanitize the filename
                            sanitized_filename = sanitize_filename(filename)
                            # Save the attachment to the specified directory
                            with open(os.path.join(attachments_dir, sanitized_filename), 'wb') as f:
                                f.write(part.get_payload(decode=True))
                            print(f'Downloaded attachment: {sanitized_filename}')

    except Exception as e:
        print(f'An error occurred: {e}')
    finally:
        mail.logout()  # Logout from the email server

# if __name__ == "__main__":
#     download_attachments()
