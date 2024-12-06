import smtplib
from smtplib import SMTP
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "sabasaeed410@gmail.com"
SENDER_PASSWORD = "bzns rnnc yaic jjko"
ADMIN_EMAIL = "sabasaeed410@gmail.com"

def send_thank_you_email(recipient_email, subject, body):
    try:
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = recipient_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()

        print("Thank-you email sent successfully!")

    except Exception as e:
        print(f"Failed to send thank-you email: {e}")



def send_reset_password_email(recipient_email, subject, body):
    """
    Sends a reset password email to the user.
    """
    try:
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = recipient_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()

        print("Reset password email sent successfully!")

    except Exception as e:
        print(f"Failed to send reset password email: {e}")
        
        
def send_registration_otp(recipient_email, subject, otp):
    """
    Sends a registration OTP email to the recipient.

    Args:
        recipient_email (str): The recipient's email address.
        subject (str): The subject of the email.
        otp (str): The OTP to include in the email body.

    Returns:
        None
    """
    try:
        # Create the email body with OTP
        body = f"Dear User,\n\nYour OTP for registration is: {otp}\n\nThis OTP is valid for 5 minutes.\n\nThank you!"
        
        # Prepare email message
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = recipient_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))
        
        # Connect to the SMTP server
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Start TLS for secure connection
            server.login(SENDER_EMAIL, SENDER_PASSWORD)  # Login to the email server
            server.send_message(msg)  # Send the email
        
        print("Registration email sent successfully!")

    except smtplib.SMTPException as smtp_err:
        print(f"SMTP error occurred: {smtp_err}")
    except Exception as e:
        print(f"Failed to send registration email: {e}")

        
def send_email_to_admin(user):
    try:
        subject = "New User Registration Request for Approval"
        body = f"""
     Dear Admin,

     A new user has submitted a registration request on the system. Please review their details below:

     - Name: {user.username}
     - Email: {user.email}
     - Registration Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    
     Kindly log in to the admin panel to approve or reject this registration request.

     Best regards,
     The System
     """
        
        # Prepare email message
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = ADMIN_EMAIL
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))
        
        # Connect to the SMTP server
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Start TLS for secure connection
            server.login(SENDER_EMAIL, SENDER_PASSWORD)  # Login to the email server
            server.send_message(msg)  # Send the email
        
        print("Registration email sent successfully!")

    except smtplib.SMTPException as smtp_err:
        print(f"SMTP error occurred: {smtp_err}")
    except Exception as e:
        print(f"Failed to send registration email: {e}")


def send_email_to_user(status: str, email):
    try:
        if status == "approved":
            subject = "Your Registration Has Been Approved"
            body = f"""
            Dear User,

            We are pleased to inform you that your registration request has been approved. 
            You can now log in and access your account using the credentials provided during registration.

            If you have any questions or need further assistance, please feel free to contact us.

            Best regards,  
            The Support Team
            """
        elif status == "rejected":
            subject = "Your Registration Request Has Been Rejected"
            body = f"""
            Dear User,

            We regret to inform you that your registration request has been reviewed and rejected. 
            If you believe this decision was made in error or if you have additional details to provide, 
            please contact our support team for clarification.

            Thank you for your understanding.

            Best regards,  
            The Support Team
            """
        else:
            raise ValueError("Invalid status provided for email notification.")

        
        # Prepare email message
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))
        
        # Connect to the SMTP server
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Start TLS for secure connection
            server.login(SENDER_EMAIL, SENDER_PASSWORD)  # Login to the email server
            server.send_message(msg)  # Send the email
        
        print("Registration email sent successfully!")

    except smtplib.SMTPException as smtp_err:
        print(f"SMTP error occurred: {smtp_err}")
    except Exception as e:
        print(f"Failed to send registration email: {e}")
