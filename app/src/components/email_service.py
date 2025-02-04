import smtplib
from smtplib import SMTP
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

SMTP_SERVER = "smtp.ionos.de"
SMTP_PORT = 465
SENDER_EMAIL = "dashboard-noreply@www.solasolution.de"
SENDER_PASSWORD = "Ecomtask%2024"
# SMTP_SERVER = "smtp.gmail.com" 
# SMTP_PORT = 587
# SENDER_EMAIL = "sabasaeed410@gmail.com"
# SENDER_PASSWORD = "xwfw lkbg uwws ulnt"
ADMIN_EMAIL = "solasolution@ai-mitarbeiter.de"

def send_thank_you_email(recipient_email, subject, body):
    try:
        msg = MIMEMultipart()
        msg["From"] = ADMIN_EMAIL
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



# def send_reset_password_email(recipient_email, subject, body):
#     """
#     Sends a reset password email to the user.
#     """
#     try:
#         msg = MIMEMultipart()
#         msg["From"] = SENDER_EMAIL
#         msg["To"] = recipient_email
#         msg["Subject"] = subject
#         msg.attach(MIMEText(body, "plain"))

#         server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
#         server.starttls()
#         server.login(SENDER_EMAIL, SENDER_PASSWORD)
#         # server.send_message(msg)
#         server.sendmail(SENDER_EMAIL, recipient_email, msg.as_string())
#         server.quit()

#         print("Reset password email sent successfully!")

#     except Exception as e:
#         print(f"Failed to send reset password email: {e}")

def send_reset_password_email(recipient_email, subject, body):
    try:
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = recipient_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        # Use SMTP_SSL instead of SMTP for port 465
        # server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)  
        # server.login(SENDER_EMAIL, SENDER_PASSWORD)
        # server.sendmail(SENDER_EMAIL, recipient_email, msg.as_string())
        # server.quit()
        # with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        with smtplib.SMTP_SSL("smtp.ionos.de", 465)  as server:
            # server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)

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
        # body = f"Dear User,\n\nYour OTP for registration is: {otp}\n\nThis OTP is valid for 5 minutes.\n\nThank you!"
        body = f"Betreff: Ihr Einmalpasswort (OTP) für die Registrierung\n\nSehr geehrter Nutzer,\n\nIhr Einmalpasswort (OTP) für die Registrierung lautet: {otp}\n\nBitte beachten Sie, dass dieses OTP nur 5 Minuten gültig ist.\n\nVielen Dank, dass Sie sich für Solasolution entschieden haben!\n\nMit freundlichen Grüßen\nIhr Solasolution-Team"
        
        # Prepare email message
        msg = MIMEMultipart()
        msg["From"] = ADMIN_EMAIL
        msg["To"] = recipient_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))
        
        # Connect to the SMTP server
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Start TLS for secure connection
            server.login(SENDER_EMAIL, SENDER_PASSWORD)  # Login to the email server
            # server.send_message(msg)  # Send the email
            server.sendmail(SENDER_EMAIL, recipient_email, msg.as_string())
            server.quit()
        
        print("Registration email sent successfully!")

    except smtplib.SMTPException as smtp_err:
        print(f"SMTP error occurred: {smtp_err}")
    except Exception as e:
        print(f"Failed to send registration email: {e}")

        
def send_email_to_admin(user):
    try:
        subject = "New User Registration Request for Approval"
        body = f"""
    Betreff: Neue Registrierungsanfrage

    Sehr geehrter Administratorin,

    ein neuer Benutzer hat eine Registrierungsanfrage im System eingereicht. Bitte überprüfen Sie die folgenden Details:

    - Name: {user.username}
    - E-Mail: {user.email}
    - Registrierungsdatum: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    
    Bitte loggen Sie sich in das Admin-Panel ein, um diese Registrierungsanfrage zu genehmigen oder abzulehnen.

    Mit freundlichen Grüßen
    Ihr Solasolution-Team
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
            # server.send_message(msg)  # Send the email
            server.sendmail(SENDER_EMAIL, user.email, msg.as_string())
            server.quit()
        
        print("Registration email sent successfully!")

    except smtplib.SMTPException as smtp_err:
        print(f"SMTP error occurred: {smtp_err}")
    except Exception as e:
        print(f"Failed to send registration email: {e}")


def send_email_to_user(status: str, email):
    try:
        if status == "approved":
            subject = "Ihre Registrierung wurde erfolgreich bestätigt"
            body = f"""
            Sehr geehrter Nutzer,

wir freuen uns, Ihnen mitteilen zu können, dass Ihre Registrierung **erfolgreich** bestätigt wurde.

Ab sofort können Sie sich mit den bei der Registrierung angegebenen Zugangsdaten einloggen und auf Ihr Konto zugreifen.

Zum Dashboard: [www.dashboard.solasolution.de](http://www.dashboard.solasolution.de/)

Falls Sie Fragen haben oder Unterstützung benötigen, steht Ihnen unser Team gerne unter [support@ecomtask.de](mailto:support@ecomtask.de) zur Verfügung.

**Mit freundlichem Gruß | Kind regards**

**Sascha Nitsche**

**Geschäftsführer | CEO**

**TRAVEL INDUSTRY MANAGER**

solasolution GmbH

Güterstr. 23b

45219 Essen | Germany

[mail@solasolution.de](mailto:mail@solasolution.de)

[www.solasolution.de](http://www.solasolution.de/)

Geschäftsführer: Sascha Peter Nitsche | Amtsgericht Essen HRB 30646 | Steuernummer: 112-57911285

Der Inhalt dieser E-Mail ist ausschließlich fuer den bezeichneten Adressaten bestimmt. Wenn Sie nicht der vorgesehene Adressat dieser E-Mail oder dessen Vertreter sein sollten, so beachten Sie bitte, dass jede Form der Kenntnisnahme, Veroeffentlichung, Vervielfaeltigung oder Weitergabe des Inhalts dieser E-Mail unzulaessig ist. Wir bitten Sie, sich in diesem Fall mit dem Absender der E-Mail in Verbindung zu setzen. The information contained in this email is intended solely for the addressee. Access to this email by anyone else is unauthorized. If you are not the intended recipient, any form of disclosure, reproduction, distribution or any action taken or refrained from in reliance on it, is prohibited and may be unlawful. Please notify the sender immediately.

Impressum: https://solasolution.de/impressum/

Datenschutz: Bitte beachten Sie unsere Hinweise zur Datenverarbeitung gem. Art. 13 DSGVO abrufbar unter: https://solasolution.de/datenschutzhinweise
            """
        elif status == "rejected":
            subject = "Ihr Registrierungsantrag wurde abgelehnt"
            body = f"""
            Sehr geehrter Nutzerin,

            wir bedauern, Ihnen mitteilen zu müssen, dass Ihr Registrierungsantrag geprüft und abgelehnt wurde.
            Sollten Sie der Meinung sein, dass diese Entscheidung irrtümlich getroffen wurde, oder wenn Sie zusätzliche Informationen bereitstellen möchten, wenden Sie sich bitte an unser Support-Team, um eine Klärung zu erhalten.

            Vielen Dank für Ihr Verständnis.

            Mit freundlichen Grüßen
            Ihr Solasolution-Team
            """
        else:
            raise ValueError("Invalid status provided for email notification.")

        
        # Prepare email message
        msg = MIMEMultipart()
        msg["From"] = ADMIN_EMAIL
        msg["To"] = email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))
        
        # Connect to the SMTP server
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Start TLS for secure connection
            server.login(SENDER_EMAIL, SENDER_PASSWORD)  # Login to the email server
            # server.send_message(msg)  # Send the email
            server.sendmail(SENDER_EMAIL, email, msg.as_string())  # Send the email
            server.quit()
        
        print("Registration email sent successfully!")

    except smtplib.SMTPException as smtp_err:
        print(f"SMTP error occurred: {smtp_err}")
    except Exception as e:
        print(f"Failed to send registration email: {e}")
