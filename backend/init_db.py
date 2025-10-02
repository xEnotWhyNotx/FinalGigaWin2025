#!/usr/bin/env python3
"""
Скрипт для инициализации пустой базы данных
Вызывается при первом запуске контейнера
"""

import sqlite3
import os
from pathlib import Path

def init_database():
    """Создает пустую базу данных если она не существует"""
    db_path = Path("data/hak2025.db")
    
    if db_path.exists():
        print(f"База данных уже существует: {db_path}")
        return
    
    # Создаем директорию
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Создаем пустую базу данных
    conn = sqlite3.connect(db_path)
    
    # Создаем базовые таблицы (пример)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS consumption (
            id INTEGER PRIMARY KEY,
            date TEXT,
            consumption REAL,
            unom TEXT
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY,
            timestamp TEXT,
            message TEXT,
            severity TEXT
        )
    """)
    
    conn.commit()
    conn.close()
    
    print(f"Создана пустая база данных: {db_path}")

if __name__ == "__main__":
    init_database()
