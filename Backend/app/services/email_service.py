"""Email service for sending emails"""

import logging
from email.message import EmailMessage
from email.utils import make_msgid, formatdate
from typing import Optional
import traceback
import sys

import aiosmtplib

from app.core.config import settings

# Configure detailed logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(handler)


class EmailService:
    """Service for sending emails"""

    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        """Send email"""
        
        logger.info(f"Attempting to send email to {to_email}")
        logger.debug(f"SMTP Config -> HOST: {settings.SMTP_HOST}, PORT: {settings.SMTP_PORT}, USER: {settings.SMTP_USERNAME}")

        try:
            message = EmailMessage()
            
            # Use formatted Sender Name and Email matching the exact authentication email
            # Gmail strictly enforces From to match the authenticated user.
            sender = f"{settings.SENDER_NAME} <{settings.SMTP_USERNAME}>" if settings.SENDER_NAME else settings.SMTP_USERNAME
            message["From"] = sender
            message["To"] = to_email
            message["Subject"] = subject
            
            # Add crucial headers to prevent silent dropping by Gmail/Spam filters
            message["Date"] = formatdate(localtime=True)
            message["Message-ID"] = make_msgid(domain=settings.SMTP_HOST or "civifix.com")

            if html_body:
                message.add_alternative(html_body, subtype="html")
            else:
                message.set_content(body)

            logger.info(f"Connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}")
            
            # Send the email
            send_result = await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                start_tls=True,
                username=settings.SMTP_USERNAME,
                password=settings.SMTP_PASSWORD,
                timeout=10  # Add timeout
            )
            
            logger.info(f"Email sent successfully to {to_email}. Result: {send_result}")
            return True

        except aiosmtplib.SMTPException as smtp_exc:
            logger.error(f"SMTP Exception while sending email to {to_email}: {str(smtp_exc)}")
            logger.error(traceback.format_exc())
            return False
        except Exception as e:
            logger.error(f"Unexpected Exception while sending email to {to_email}: {str(e)}")
            logger.error(traceback.format_exc())
            return False

    @staticmethod
    async def send_otp_email(to_email: str, otp: str) -> bool:
        """Send OTP email"""

        subject = "Civifix - OTP Verification"

        body = f"""
Your Civifix OTP verification code is: {otp}

This code will expire in 5 minutes.

If you did not request this code, please ignore this email.

Best regards,
Civifix Team
"""

        return await EmailService.send_email(to_email, subject, body)

    @staticmethod
    async def send_login_otp_email(to_email: str, otp: str) -> bool:
        """Send login OTP email"""

        subject = "Civifix - Login OTP"

        body = f"""
Your Civifix login OTP is: {otp}

This code will expire in 5 minutes.

If you did not request this code, please ignore this email.

Best regards,
Civifix Team
"""

        return await EmailService.send_email(to_email, subject, body)