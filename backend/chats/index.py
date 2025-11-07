import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    '''Создать подключение к БД'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для работы с чатами и сообщениями Telegram-клона
    Args: event с httpMethod, body, queryStringParameters, headers
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'X-User-Id header required'})
        }
    
    conn = get_db_connection()
    
    if method == 'GET':
        action = event.get('queryStringParameters', {}).get('action', 'get_chats')
        
        if action == 'get_chats':
            result = get_user_chats(conn, user_id)
        elif action == 'get_messages':
            chat_id = event.get('queryStringParameters', {}).get('chat_id')
            result = get_chat_messages(conn, chat_id, user_id)
        else:
            result = {'error': 'Unknown action'}
        
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result)
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'send_message':
            result = send_message(conn, user_id, body_data)
        elif action == 'create_chat':
            result = create_chat(conn, user_id, body_data)
        else:
            result = {'error': 'Unknown action'}
        
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result)
        }
    
    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }

def get_user_chats(conn, user_id: str) -> Dict[str, Any]:
    '''Получить список чатов пользователя'''
    cur = conn.cursor()
    
    cur.execute('''
        SELECT DISTINCT ON (c.id)
            c.id,
            c.type,
            c.title,
            c.avatar_url,
            m.text as last_message,
            m.created_at as last_message_time,
            u.username as last_sender,
            (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count
        FROM chats c
        JOIN chat_members cm ON c.id = cm.chat_id
        LEFT JOIN messages m ON c.id = m.chat_id
        LEFT JOIN users u ON m.user_id = u.id
        WHERE cm.user_id = %s
        ORDER BY c.id, m.created_at DESC NULLS LAST
    ''', (user_id,))
    
    chats = []
    for row in cur.fetchall():
        chats.append({
            'id': row['id'],
            'type': row['type'],
            'title': row['title'],
            'avatar_url': row['avatar_url'],
            'lastMessage': row['last_message'],
            'lastMessageTime': row['last_message_time'].isoformat() if row['last_message_time'] else None,
            'lastSender': row['last_sender'],
            'messageCount': row['message_count']
        })
    
    cur.close()
    return {'chats': chats}

def get_chat_messages(conn, chat_id: str, user_id: str) -> Dict[str, Any]:
    '''Получить сообщения чата'''
    cur = conn.cursor()
    
    cur.execute('''
        SELECT cm.user_id 
        FROM chat_members cm 
        WHERE cm.chat_id = %s AND cm.user_id = %s
    ''', (chat_id, user_id))
    
    if not cur.fetchone():
        cur.close()
        return {'error': 'Access denied'}
    
    cur.execute('''
        SELECT 
            m.id,
            m.text,
            m.created_at,
            m.edited,
            m.reply_to,
            u.id as user_id,
            u.username,
            u.avatar_url
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.chat_id = %s
        ORDER BY m.created_at ASC
    ''', (chat_id,))
    
    messages = []
    for row in cur.fetchall():
        messages.append({
            'id': row['id'],
            'text': row['text'],
            'createdAt': row['created_at'].isoformat(),
            'edited': row['edited'],
            'replyTo': row['reply_to'],
            'user': {
                'id': row['user_id'],
                'username': row['username'],
                'avatarUrl': row['avatar_url']
            }
        })
    
    cur.close()
    return {'messages': messages}

def send_message(conn, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    '''Отправить сообщение'''
    chat_id = data.get('chat_id')
    text = data.get('text')
    reply_to = data.get('reply_to')
    
    cur = conn.cursor()
    
    cur.execute('''
        SELECT id FROM users WHERE id = %s
    ''', (user_id,))
    
    if not cur.fetchone():
        cur.close()
        return {'error': 'User not found'}
    
    cur.execute('''
        INSERT INTO messages (chat_id, user_id, text, reply_to, created_at)
        VALUES (%s, %s, %s, %s, NOW())
        RETURNING id, created_at
    ''', (chat_id, user_id, text, reply_to))
    
    result = cur.fetchone()
    conn.commit()
    cur.close()
    
    return {
        'success': True,
        'message_id': result['id'],
        'created_at': result['created_at'].isoformat()
    }

def create_chat(conn, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    '''Создать новый чат'''
    chat_type = data.get('type', 'private')
    title = data.get('title')
    member_ids = data.get('member_ids', [])
    
    cur = conn.cursor()
    
    cur.execute('''
        INSERT INTO chats (type, title, created_at)
        VALUES (%s, %s, NOW())
        RETURNING id
    ''', (chat_type, title))
    
    chat_id = cur.fetchone()['id']
    
    cur.execute('''
        INSERT INTO chat_members (chat_id, user_id, role)
        VALUES (%s, %s, %s)
    ''', (chat_id, user_id, 'owner'))
    
    for member_id in member_ids:
        cur.execute('SELECT id FROM users WHERE id = %s', (member_id,))
        if cur.fetchone():
            cur.execute('''
                INSERT INTO chat_members (chat_id, user_id, role)
                VALUES (%s, %s, %s)
            ''', (chat_id, member_id, 'member'))
    
    conn.commit()
    cur.close()
    
    return {'success': True, 'chat_id': chat_id}