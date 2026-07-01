import asyncio
from app.services.email_service import EmailService
from app.core.config import settings

async def main():
    print("SMTP_HOST:", settings.SMTP_HOST)
    print("SENDER_EMAIL:", settings.SENDER_EMAIL)
    print("SMTP_PORT:", settings.SMTP_PORT)
    success = await EmailService.send_otp_email("hasinbanukadharbasha161214@gmail.com", "123456")
    print("Success:", success)

if __name__ == "__main__":
    asyncio.run(main())
