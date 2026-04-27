import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import get_settings

settings = get_settings()

def send_password_reset_email_mock(email: str, reset_link: str) -> bool:
    """
    Sends a password reset email.
    If SMTP settings are provided, it sends a real email.
    Otherwise, it prints the link to the console (Mock).
    """
    # 1. Print to console (always do this for development visibility)
    print("\n" + "="*60)
    print("📧 PASSWORD RESET EMAIL (MOCK)")
    print(f"Target: {email}")
    print(f"Link:   {reset_link}")
    print("="*60 + "\n")

    # 2. Try to send real email if SMTP is configured
    if all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        try:
            msg = MIMEMultipart()
            msg['From'] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            msg['To'] = email
            msg['Subject'] = "Reset your VayuPos Password"

            body = f"""
            Hello,

            You requested a password reset for your VayuPos account.
            Click the link below to set a new password:

            {reset_link}

            If you didn't request this, please ignore this email.
            This link will expire in 30 minutes.

            Regards,
            VayuPos Team
            """
            msg.attach(MIMEText(body, 'plain'))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            print(f"✅ Real email sent successfully to {email}")
            return True
        except Exception as e:
            print(f"❌ Failed to send real email: {e}")
            # Fallback to mock (already printed above)
            return True
    
    return True
