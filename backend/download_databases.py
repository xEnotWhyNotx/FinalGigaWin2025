#!/usr/bin/env python3
"""
Скрипт для скачивания базы данных из облачного хранилища
"""

import requests
import os
from pathlib import Path

def download_database(url, local_path):
    """Скачивает файл по URL"""
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Создаем директорию если её нет
        Path(local_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"База данных загружена: {local_path}")
        return True
    except Exception as e:
        print(f"Ошибка при загрузке: {e}")
        return False

def download_databases():
    """Скачивает все необходимые БД"""
    
    # Получите эти ссылки после загрузки файлов в облако
    databases = {
        "data/hak2025.db": "https://drive.google.com/file/d/YOUR_FILE_ID/view",  # Замените на реальную ссылку
        "data/users.db": "https://drive.google.com/file/d/USERS_DB_ID/view",      # Замените на реальную ссылку
        "models/catboost_model.cbm": "https://drive.google.com/file/d/MODEL_ID/view"  # Замените на реальную ссылку
    }
    
    for local_path, url in databases.items():
        print(f"Загружаем {local_path}...")
        # download_database(url, local_path)  # Раскомментируйте когда получите ссылки

if __name__ == "__main__":
    download_databases()
