import asyncio
import aiosmtplib
from email.message import EmailMessage

async def main():
    message = EmailMessage()
    message['From'] = 'hasinbanukadharbasha161214@gmail.com'
    message['To'] = 'hasinbanukadharbasha161214@gmail.com'
    message['Subject'] = 'Test'
    message.set_content('test')
    try:
        await aiosmtplib.send(
            message,
            hostname='smtp.gmail.com',
            port=587,
            start_tls=True,
            username='hasinbanukadharbasha161214@gmail.com',
            password='jczqzlfutkdahyan'
        )
        print('SUCCESS')
    except Exception as e:
        print('ERROR:', str(e))

asyncio.run(main())
