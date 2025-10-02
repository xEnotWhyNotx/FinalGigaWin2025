"""
Модуль авторизации и аутентификации пользователей для телеграм-бота.
"""

import json
import sqlite3
import hashlib
import secrets
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import pandas as pd

logger = logging.getLogger(__name__)

class UserAuth:
    """Класс для управления авторизацией и аутентификацией пользователей"""
    
    def __init__(self, db_path: str = 'data/users.db'):
        self.db_path = db_path
        # Создаем директорию, если она не существует
        import os
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.init_database()
    
    def init_database(self):
        """Инициализация базы данных пользователей"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Создание таблицы пользователей
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        telegram_id INTEGER UNIQUE,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        full_name TEXT,
                        role TEXT DEFAULT 'user',
                        is_active BOOLEAN DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_login TIMESTAMP
                    )
                ''')
                
                # Создание таблицы сессий
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS user_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER,
                        telegram_id INTEGER,
                        session_token TEXT UNIQUE,
                        expires_at TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                ''')
                
                # Создание таблицы разрешений
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS user_permissions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER,
                        permission TEXT NOT NULL,
                        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                ''')
                
                conn.commit()
                logger.info("База данных пользователей инициализирована")
                
        except Exception as e:
            logger.error(f"Ошибка инициализации базы данных: {e}")
            raise
    
    def hash_password(self, password: str) -> str:
        """Хеширование пароля"""
        salt = secrets.token_hex(16)
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return f"{salt}:{password_hash.hex()}"
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Проверка пароля"""
        try:
            salt, hash_part = password_hash.split(':')
            computed_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return secrets.compare_digest(hash_part, computed_hash.hex())
        except:
            return False
    
    def create_user(self, email: str, password: str, full_name: str = None, telegram_id: int = None, role: str = 'user') -> int:
        """Создание нового пользователя"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Проверяем, существует ли пользователь с таким email
                cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
                if cursor.fetchone():
                    raise ValueError("Пользователь с таким email уже существует")
                
                # Проверяем telegram_id, если указан
                if telegram_id:
                    cursor.execute('SELECT id FROM users WHERE telegram_id = ?', (telegram_id,))
                    if cursor.fetchone():
                        raise ValueError("Пользователь с таким Telegram ID уже существует")
                
                password_hash = self.hash_password(password)
                
                cursor.execute('''
                    INSERT INTO users (email, password_hash, full_name, telegram_id, role)
                    VALUES (?, ?, ?, ?, ?)
                ''', (email, password_hash, full_name, telegram_id, role))
                
                user_id = cursor.lastrowid
                conn.commit()
                
                logger.info(f"Пользователь создан с ID: {user_id}")
                return user_id
                
        except Exception as e:
            logger.error(f"Ошибка создания пользователя: {e}")
            raise
    
    def login(self, email: str, password: str, telegram_id: int = None) -> Optional[Dict[str, Any]]:
        """Авторизация пользователя"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Ищем пользователя по email
                cursor.execute('''
                    SELECT id, email, password_hash, full_name, role, telegram_id, is_active
                    FROM users WHERE email = ?
                ''', (email,))
                
                user_data = cursor.fetchone()
                if not user_data:
                    return None
                
                user_id, db_email, password_hash, full_name, role, db_telegram_id, is_active = user_data
                
                # Проверяем активность пользователя
                if not is_active:
                    return None
                
                # Проверяем пароль
                if not self.verify_password(password, password_hash):
                    return None
                
                # Обновляем telegram_id, если нужно
                if telegram_id and not db_telegram_id:
                    cursor.execute('UPDATE users SET telegram_id = ? WHERE id = ?', (telegram_id, user_id))
                
                # Обновляем время последнего входа
                cursor.execute('UPDATE users SET last_login = ? WHERE id = ?', (datetime.now().isoformat(), user_id))
                
                conn.commit()
                
                # Создаем сессию
                session_token = self.create_session(user_id, telegram_id)
                
                return {
                    'user_id': user_id,
                    'email': db_email,
                    'full_name': full_name,
                    'role': role,
                    'telegram_id': telegram_id or db_telegram_id,
                    'session_token': session_token
                }
                
        except Exception as e:
            logger.error(f"Ошибка авторизации: {e}")
            return None
    
    def create_session(self, user_id: int, telegram_id: int = None) -> str:
        """Создание сессии пользователя"""
        try:
            session_token = secrets.token_urlsafe(32)
            expires_at = datetime.now() + timedelta(hours=24)  # Сессия на 24 часа
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO user_sessions (user_id, telegram_id, session_token, expires_at)
                    VALUES (?, ?, ?, ?)
                ''', (user_id, telegram_id, session_token, expires_at.isoformat()))
                conn.commit()
            
            return session_token
            
        except Exception as e:
            logger.error(f"Ошибка создания сессии: {e}")
            raise
    
    def verify_session(self, session_token: str) -> Optional[Dict[str, Any]]:
        """Проверка сессии пользователя"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT us.user_id, us.telegram_id, us.expires_at, u.email, u.full_name, u.role, u.is_active
                    FROM user_sessions us
                    JOIN users u ON us.user_id = u.id
                    WHERE us.session_token = ?
                ''', (session_token,))
                
                session_data = cursor.fetchone()
                if not session_data:
                    return None
                
                user_id, telegram_id, expires_at_str, email, full_name, role, is_active = session_data
                
                # Проверяем активность пользователя
                if not is_active:
                    return None
                
                # Проверяем срок действия сессии
                expires_at = datetime.fromisoformat(expires_at_str)
                if datetime.now() > expires_at:
                    # Удаляем просроченную сессию
                    cursor.execute('DELETE FROM user_sessions WHERE session_token = ?', (session_token,))
                    conn.commit()
                    return None
                
                return {
                    'user_id': user_id,
                    'telegram_id': telegram_id,
                    'email': email,
                    'full_name': full_name,
                    'role': role
                }
                
        except Exception as e:
            logger.error(f"Ошибка проверки сессии: {e}")
            return None
    
    def logout(self, session_token: str):
        """Выход пользователя (удаление сессии)"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM user_sessions WHERE session_token = ?', (session_token,))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Ошибка выхода: {e}")
            raise
    
    def get_user_by_telegram_id(self, telegram_id: int) -> Optional[Dict[str, Any]]:
        """Получение пользователя по Telegram ID"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT id, email, full_name, role, telegram_id, is_active, created_at, last_login
                    FROM users WHERE telegram_id = ?
                ''', (telegram_id,))
                
                user_data = cursor.fetchone()
                if not user_data:
                    return None
                
                user_id, email, full_name, role, db_telegram_id, is_active, created_at, last_login = user_data
                
                return {
                    'user_id': user_id,
                    'email': email,
                    'full_name': full_name,
                    'role': role,
                    'telegram_id': db_telegram_id,
                    'is_active': bool(is_active),
                    'created_at': created_at,
                    'last_login': last_login
                }
                
        except Exception as e:
            logger.error(f"Ошибка получения пользователя: {e}")
            return None
    
    def update_user(self, user_id: int, **kwargs) -> bool:
        """Обновление данных пользователя"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Формируем SQL запрос
                fields = []
                values = []
                
                for field, value in kwargs.items():
                    if field in ['email', 'full_name', 'role', 'telegram_id', 'is_active']:
                        fields.append(f"{field} = ?")
                        values.append(value)
                
                if not fields:
                    return False
                
                values.append(user_id)
                sql = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
                
                cursor.execute(sql, values)
                conn.commit()
                
                return cursor.rowcount > 0
                
        except Exception as e:
            logger.error(f"Ошибка обновления пользователя: {e}")
            return False
    
    def grant_permission(self, user_id: int, permission: str) -> bool:
        """Предоставление разрешения пользователю"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Проверяем, есть ли уже такое разрешение
                cursor.execute('SELECT id FROM user_permissions WHERE user_id = ? AND permission = ?', 
                             (user_id, permission))
                
                if cursor.fetchone():
                    return True  # Разрешение уже есть
                
                cursor.execute('INSERT INTO user_permissions (user_id, permission) VALUES (?, ?)',
                             (user_id, permission))
                conn.commit()
                
                return True
                
        except Exception as e:
            logger.error(f"Ошибка предоставления разрешения: {e}")
            return False
    
    def check_permission(self, user_id: int, permission: str) -> bool:
        """Проверка наличия разрешения у пользователя"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('SELECT id FROM user_permissions WHERE user_id = ? AND permission = ?',
                             (user_id, permission))
                
                return cursor.fetchone() is not None
                
        except Exception as e:
            logger.error(f"Ошибка проверки разрешения: {e}")
            return False
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Получение списка всех пользователей"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT id, email, full_name, role, telegram_id, is_active, created_at, last_login
                    FROM users ORDER BY created_at DESC
                ''')
                
                users = []
                for row in cursor.fetchall():
                    user_id, email, full_name, role, telegram_id, is_active, created_at, last_login = row
                    users.append({
                        'user_id': user_id,
                        'email': email,
                        'full_name': full_name,
                        'role': role,
                        'telegram_id': telegram_id,
                        'is_active': bool(is_active),
                        'created_at': created_at,
                        'last_login': last_login
                    })
                
                return users
                
        except Exception as e:
            logger.error(f"Ошибка получения списка пользователей: {e}")
            return []

# Глобальный экземпляр для использования в других модулях
auth_manager = UserAuth()
