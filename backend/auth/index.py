'''
Business: Отправка SMS/Email кодов авторизации и их проверка
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с кодом статуса и телом ответа
'''

import json
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
import os
import psycopg2

codes_storage: Dict[str, str] = {}

def get_db_connection():
    '''Создать подключение к БД'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def send_email_code(email: str, code: str) -> bool:
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    if not all([smtp_host, smtp_user, smtp_password]):
        return False
    
    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = email
    msg['Subject'] = 'Telegram - Код авторизации'
    
    body = f'''
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Код авторизации</h2>
        <p>Ваш код для входа в Telegram:</p>
        <h1 style="color: #0088cc; letter-spacing: 5px;">{code}</h1>
        <p>Если вы не запрашивали этот код, проигнорируйте это письмо.</p>
      </body>
    </html>
    '''
    msg.attach(MIMEText(body, 'html'))
    
    server = smtplib.SMTP(smtp_host, smtp_port)
    server.starttls()
    server.login(smtp_user, smtp_password)
    server.send_message(msg)
    server.quit()
    
    return True

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'send_code':
            phone = body_data.get('phone', '')
            code = str(random.randint(10000, 99999))
            
            codes_storage[phone] = code
            
            if phone == '+888 8888 88' or phone == '+8888888888':
                send_email_code('ggtebe01@gmail.com', code)
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'success': True,
                        'message': 'Код отправлен на email',
                        'phone': phone
                    })
                }
            else:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'success': True,
                        'message': f'SMS код: {code}',
                        'phone': phone
                    })
                }
        
        elif action == 'verify_code':
            phone = body_data.get('phone', '')
            code = body_data.get('code', '')
            
            stored_code = codes_storage.get(phone)
            
            if stored_code and stored_code == code:
                del codes_storage[phone]
                
                conn = get_db_connection()
                cur = conn.cursor()
                
                cur.execute('''
                    INSERT INTO users (phone, username, created_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (phone) DO UPDATE SET last_seen = NOW()
                    RETURNING id
                ''', (phone, phone))
                
                user_id = cur.fetchone()[0]
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'success': True,
                        'verified': True,
                        'user_id': user_id,
                        'phone': phone
                    })
                }
            else:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'success': True,
                        'verified': False,
                        'message': 'Неверный код'
                    })
                }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }