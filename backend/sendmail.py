import schedule
import time
from datetime import datetime
from models import db, Todo
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app as app
from threading import Thread
import os
from dotenv import load_dotenv
import logging

# Nạp các biến môi trường từ tệp .env
load_dotenv()

# Cấu hình logging
logging.basicConfig(level=logging.INFO)

def send_email(subject, body, to):
    logging.info("send_email function called")
    try:
        print(f"Connecting to {os.getenv('MAIL_SERVER')} on port {os.getenv('MAIL_PORT')}")
        server = smtplib.SMTP(os.getenv('MAIL_SERVER'), int(os.getenv('MAIL_PORT')))
        print("Connection established")
        if os.getenv('MAIL_USE_TLS') == 'True':
            print("Starting TLS")
            server.starttls()
        server.login(os.getenv('MAIL_USERNAME'), os.getenv('MAIL_PASSWORD'))
        print("Logged in to email server")
        
        msg = MIMEMultipart()
        msg['From'] = os.getenv('MAIL_USERNAME')
        msg['To'] = to
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(os.getenv('MAIL_SERVER'), int(os.getenv('MAIL_PORT')))
        if os.getenv('MAIL_USE_TLS') == 'True':
            server.starttls()
        server.login(os.getenv('MAIL_USERNAME'), os.getenv('MAIL_PASSWORD'))
        server.send_message(msg)
        server.quit()
        print("Email sent successfully")
    except Exception as e:
        print(f"Failed to send email: {e}")
        logging.info(f"Failed to send email: {e}")
    
    # try:
    #     msg = MIMEText('This is a test email')
    #     msg['Subject'] = 'Test Email'
    #     msg['From'] = os.getenv('MAIL_USERNAME')
    #     msg['To'] = os.getenv('MAIL_USERNAME')
        
    #     with smtplib.SMTP(os.getenv('MAIL_SERVER'), int(os.getenv('MAIL_PORT'))) as server:
    #         if os.getenv('MAIL_USE_TLS') == 'True':
    #             server.starttls()
    #         server.login(os.getenv('MAIL_USERNAME'), os.getenv('MAIL_PASSWORD'))
    #         server.send_message(msg)
    #     print("Test email sent successfully")
    # except Exception as e:
    #     print(f"Failed to send test email: {e}")

def check_due_tasks(app):
    print("every 1")
    with app.app_context():  # アプリケーションコンテキストを設定
        now = datetime.now()
        tasks = Todo.query.all()
        for task in tasks:
            if not task.email_sent and task.due_date and task.due_date <= now :
                subject = "Task Due Reminder"
                body = f"Task : '{task.content}'\nDescription : {task.description} is due now!"
                to = "soncuc182304@gmail.com"
                send_email(subject, body, to)
                # メール送信後にフラグを更新
                task.email_sent = True
                db.session.commit()
