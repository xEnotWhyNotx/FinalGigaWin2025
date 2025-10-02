#!/usr/bin/env python3
"""
Скрипт для проверки доступных данных в базе
"""
import pandas as pd
import sqlite3
import json
import os
from datetime import datetime

def check_database_data():
    """Проверяет доступные данные в базе"""
    print("=== Проверка данных в базе ===")
    
    # Подключение к базе
    con = sqlite3.connect('data/hak2025.db')
    
    try:
        # Проверяем структуру таблицы
        cursor = con.cursor()
        cursor.execute("PRAGMA table_info(synt_data)")
        columns = cursor.fetchall()
        print("Структура таблицы synt_data:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        
        # Проверяем количество записей
        cursor.execute("SELECT COUNT(*) FROM synt_data")
        total_count = cursor.fetchone()[0]
        print(f"\nОбщее количество записей: {total_count}")
        
        # Проверяем диапазон дат
        cursor.execute("SELECT MIN(date), MAX(date) FROM synt_data")
        date_range = cursor.fetchone()
        print(f"Диапазон дат: {date_range[0]} - {date_range[1]}")
        
        # Проверяем уникальные UNOM
        cursor.execute("SELECT COUNT(DISTINCT UNOM) FROM synt_data")
        unique_unoms = cursor.fetchone()[0]
        print(f"Уникальных UNOM: {unique_unoms}")
        
        # Показываем несколько примеров записей
        cursor.execute("SELECT * FROM synt_data LIMIT 5")
        sample_records = cursor.fetchall()
        print(f"\nПримеры записей:")
        for record in sample_records:
            print(f"  {record}")
            
        # Проверяем есть ли данные для UNOM 15109
        cursor.execute("SELECT COUNT(*) FROM synt_data WHERE UNOM = 15109")
        unom_15109_count = cursor.fetchone()[0]
        print(f"\nЗаписей для UNOM 15109: {unom_15109_count}")
        
        if unom_15109_count > 0:
            cursor.execute("SELECT date, time, consumption FROM synt_data WHERE UNOM = 15109 LIMIT 5")
            unom_15109_records = cursor.fetchall()
            print("Примеры записей для UNOM 15109:")
            for record in unom_15109_records:
                print(f"  {record}")
                
    finally:
        con.close()

def check_geojson_data():
    """Проверяет данные в GeoJSON"""
    print("\n=== Проверка GeoJSON данных ===")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    geojson_path = os.path.join(base_dir, 'data', 'Трубы_v2.geojson')

    try:
        with open(geojson_path, 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)
        
        print(f"Количество объектов: {len(geojson_data['features'])}")
        
        # Ищем UNOM 15109
        unom_15109_found = False
        for feature in geojson_data['features']:
            if feature['properties'].get('Конец') == 15109:
                unom_15109_found = True
                coords = feature['geometry']['coordinates']
                print(f"UNOM 15109 найден в GeoJSON:")
                print(f"  Координаты: {coords[-1]}")
                break
        
        if not unom_15109_found:
            print("UNOM 15109 не найден в GeoJSON")
            
    except Exception as e:
        print(f"Ошибка чтения GeoJSON: {e}")

def check_ctp_mapping():
    """Проверяет маппинг ЦТП-UNOM"""
    print("\n=== Проверка маппинга ЦТП-UNOM ===")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ctp_to_unom_path = os.path.join(base_dir, 'data', 'ctp_to_unom.json')
    try:
        with open(ctp_to_unom_path, 'r', encoding='utf-8') as f:
            ctp_map = json.load(f)
        
        print(f"Количество ЦТП: {len(ctp_map)}")
        
        # Ищем UNOM 15109
        unom_15109_ctp = None
        for ctp, unoms in ctp_map.items():
            if 15109 in unoms:
                unom_15109_ctp = ctp
                break
        
        if unom_15109_ctp:
            print(f"UNOM 15109 подключен к ЦТП: {unom_15109_ctp}")
        else:
            print("UNOM 15109 не найден в маппинге ЦТП")
            
    except Exception as e:
        print(f"Ошибка чтения маппинга: {e}")

if __name__ == "__main__":
    check_database_data()
    check_geojson_data()
    check_ctp_mapping()
