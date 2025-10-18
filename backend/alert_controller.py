import random
import json
import asyncio
import os
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from small_leakage_model import analyze_leakage_with_consumption_data

# Используем загрузчик данных и симулятор из consumption_loader.py
from consumption_loader import load_data, get_consumption_for_period_unom, get_consumption_for_period_ctp

# --- Load house addresses from GeoJSON ---
def load_house_addresses(geojson_path='data/МКД_полигоны.geojson') -> Dict[int, str]:
    """
    Загружает адреса домов из GeoJSON файла.
    Возвращает словарь {UNOM: address}
    """
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        full_path = os.path.join(base_dir, geojson_path)
        
        with open(full_path, 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)
        
        address_map = {}
        for feature in geojson_data.get('features', []):
            properties = feature.get('properties', {})
            unom = properties.get('UNOM')
            address = properties.get('address')
            
            if unom is not None and address:
                # UNOM может быть float в GeoJSON, конвертируем в int
                address_map[int(unom)] = address
        
        print(f"Загружено {len(address_map)} адресов домов из {geojson_path}")
        return address_map
    except Exception as e:
        print(f"Ошибка загрузки адресов из {geojson_path}: {e}")
        return {}

# Загружаем адреса при импорте модуля
HOUSE_ADDRESSES = load_house_addresses()

# --- Alert Metadata ---
ALERT_METADATA = {
    1: {
        "level": "Высокий",
        "interpretation": "Проблемы на ЦТП (отключили электричество, проблемы с насосами, аварийные работы)",
        "alert_message": "В МКД по адресу {address} отсутствует водоснабжение",
        "dispatcher_actions": "Уточнить статус отключения водоснабжения у Мосводоканала"
    },
    2: {
        "level": "Средний", 
        "interpretation": "Отключение водоснабжения в доме",
        "alert_message": "В МКД по адресу {address} отсутствует водоснабжение (возможно утечка)",
        "dispatcher_actions": "Уточнить статус отключения водоснабжения у Мосводоканала, возможно авария"
    },
    3: {
        "level": "Высокий",
        "interpretation": "На участке трубопровода между ЦТП и домом возможен аварийный прорыв трубы",
        "alert_message": "На участке трубопровода между ЦТП {ctp} и МКД по адресу {address} авария",
        "dispatcher_actions": "Уведомить Мосводоканал. Создать заявку на вызов аварийной бригады"
    },
    4: {
        "level": "Средний",
        "interpretation": "В доме вероятно утечка, требуется вызвать аварийную бригаду",
        "alert_message": "В МКД по адресу {address} утечка воды",
        "dispatcher_actions": "Уведомить управляющую компанию. Создать заявку на вызов аварийной бригады"
    },
    7: {
        "level": "Средний",
        "interpretation": "Дефицит воды в доме",
        "alert_message": "В МКД по адресу {address} дефицит воды",
        "dispatcher_actions": "Проверить давление в сети, уведомить управляющую компанию"
    },
    8: {
        "level": "Высокий",
        "interpretation": "Вероятно утечка",
        "alert_message": "На участке трубопровода между ЦТП {ctp} и МКД утечка воды",
        "dispatcher_actions": "Уведомить Мосводоканал. Создать заявку на вызов аварийной бригады"
    },
    5: {
        "level": "Низкий",
        "interpretation": "Обнаружена маленькая утечка с помощью ML-модели",
        "alert_message": "В МКД по адресу {address} обнаружена маленькая утечка воды",
        "dispatcher_actions": "Проверить состояние водопроводных систем в доме, возможно требуется профилактический ремонт"
    },
    6: {
        "level": "Высокий",
        "interpretation": "Нештатная работа насосов ЦТП. В результате аварии на трубе насосы работают в нештатном режиме и требуется их остановить до устранения проблемы",
        "alert_message": "Кавитация насоса на ЦТП {ctp_name}. Нештатная работа насосов",
        "dispatcher_actions": "Уведомить Мосводоканал. Создать заявку на вызов аварийной службы"
    },
}

# --- Configuration ---
CONFIG = {
    'consumption_tolerance': 0.05,  # 5% tolerance for consumption comparisons
    'zero_consumption_threshold': 0.1,  # Threshold for considering consumption as zero
    'high_consumption_multiplier': 1.3,  # Multiplier for "much higher than predicted" (balanced threshold)
    'event_duration_threshold': 1,  # Hours (reduced from 4 to 1 for faster detection)
    'leak_detection_threshold': 1.2,  # Specific threshold for leak detection (alert 4) - more conservative
    'min_consumption_for_leak': 5.0,  # Minimum consumption to consider for leak detection
    'min_leakage_threshold': 0.5,  # Minimum leakage value to consider significant (from excedents data)
    'small_leakage_excedents_threshold': 0.3,  # Minimum leakage value for small leak detection (alert 5)
    'water_deficit_threshold': 0.5,  # Threshold for water deficit (real < predicted * 0.5 means deficit)
    'small_leakage_threshold': 0.5,  # ML model threshold for small leak detection (alert 5)
    'pump_cavitation_multiplier': 1.5,  # Multiplier for pump cavitation detection (alert 6) - consumption > max_predicted * multiplier
    'pump_cavitation_lookback_hours': 24,  # Hours to look back for max predicted consumption (alert 6)
}

# --- Data Structures ---

# --- Helper Functions ---

def is_zero_consumption(consumption: float) -> bool:
    """Check if consumption is effectively zero"""
    return consumption <= CONFIG['zero_consumption_threshold']

def is_consumption_much_higher(real: float, predicted: float) -> bool:
    """Check if real consumption is much higher than predicted"""
    if predicted <= 0:
        return real > CONFIG['zero_consumption_threshold']
    return real > predicted * CONFIG['high_consumption_multiplier']

def is_consumption_leak_level(real: float, predicted: float) -> bool:
    """Check if real consumption indicates a leak (more sensitive threshold)"""
    if predicted <= 0:
        return real > CONFIG['zero_consumption_threshold']
    
    # Only consider leak if consumption is above minimum threshold
    if real < CONFIG['min_consumption_for_leak']:
        return False
        
    return real > predicted * CONFIG['leak_detection_threshold']


def has_excedents_leak(unom: int, start_ts, end_ts, excedents_df: pd.DataFrame) -> bool:
    """Check if there's a significant leak recorded in excedents data for this house"""
    if excedents_df is None or excedents_df.empty:
        return False
    
    # Filter excedents for this house with significant positive leakage (not -1 and above threshold)
    # First filter by type and id, then check leakage value
    house_excedents = excedents_df[
        (excedents_df['type'] == 'mcd') & 
        (excedents_df['id'] == str(unom))
    ].copy()
    
    # Convert leakage to numeric, coercing errors (like '-') to NaN
    house_excedents['leakage_numeric'] = pd.to_numeric(house_excedents['leakage'], errors='coerce')
    
    # Filter for significant leakage
    house_excedents = house_excedents[house_excedents['leakage_numeric'] > CONFIG['min_leakage_threshold']]
    
    if house_excedents.empty:
        return False
    
    # Check if any excedent overlaps with the time period
    for _, excedent in house_excedents.iterrows():
        excedent_start = pd.to_datetime(excedent['timestamp_start'])
        excedent_end = pd.to_datetime(excedent['timestamp_end'])
        
        # Check for overlap
        if not (end_ts <= excedent_start or start_ts >= excedent_end):
            return True
    
    return False

def is_consumption_approximately_equal(real: float, predicted: float) -> bool:
    """Check if real consumption is approximately equal to predicted (±5%)"""
    if predicted <= 0:
        return is_zero_consumption(real)
    tolerance = CONFIG['consumption_tolerance']
    return abs(real - predicted) / predicted <= tolerance

def get_house_address(unom: int) -> str:
    """Get house address by UNOM from loaded GeoJSON data"""
    # Используем реальный адрес из загруженных данных
    address = HOUSE_ADDRESSES.get(unom)
    if address:
        return address
    # Если адрес не найден, возвращаем UNOM
    return f"УНОМ {unom}"

def get_ctp_name(ctp_id: str) -> str:
    """Get CTP name by ID"""
    return ctp_id if ctp_id else "Неизвестный ЦТП"

# --- Alert Condition Checkers ---

async def check_alert_condition_1(unom: int, ctp_id: str, consumption_df: pd.DataFrame, 
                                 ctp_to_unom_map: Dict[str, List[int]], 
                                 alert_time: datetime, excedents_df: pd.DataFrame = None) -> Optional[Dict[str, Any]]:
    """
    Alert Condition 1: расход воды в доме=0 AND расход воды на выходе из ЦТП = 0 
    AND В других домах подключенных к ЦТП расход = 0
    """
    try:
        # Get consumption data for the house
        start_time = alert_time - timedelta(hours=CONFIG['event_duration_threshold'])
        house_data = await get_consumption_for_period_unom(unom, start_time, alert_time, consumption_df, excedents_df=excedents_df)
        
        if house_data.empty:
            return None
            
        # Check if house consumption is zero
        latest_house_consumption = house_data['реальный'].iloc[-1]
        if not is_zero_consumption(latest_house_consumption):
            return None
            
        # Get CTP consumption data
        ctp_data = await get_consumption_for_period_ctp(ctp_id, start_time, alert_time, consumption_df, ctp_to_unom_map, excedents_df=excedents_df)
        
        if ctp_data.empty:
            return None
            
        # Check if CTP outlet consumption is zero
        latest_ctp_consumption = ctp_data['реальный'].iloc[-1]
        if not is_zero_consumption(latest_ctp_consumption):
            return None
            
        # Check other houses connected to the same CTP
        other_houses = [h for h in ctp_to_unom_map.get(ctp_id, []) if h != unom]
        if not other_houses:
            return None
            
        # Check if all other houses also have zero consumption
        for other_unom in other_houses[:5]:  # Limit to first 5 houses for performance
            other_house_data = await get_consumption_for_period_unom(other_unom, start_time, alert_time, consumption_df, excedents_df=excedents_df)
            if not other_house_data.empty:
                other_consumption = other_house_data['реальный'].iloc[-1]
                if not is_zero_consumption(other_consumption):
                    return None
        
        # All conditions met - generate alert
        return {
            'alert_id': 1,
            'unom': unom,
            'ctp_id': ctp_id,
            'address': get_house_address(unom),
            'ctp_name': get_ctp_name(ctp_id),
            'timestamp': alert_time.isoformat(),
            'consumption_data': {
                'house_consumption': float(latest_house_consumption),
                'ctp_consumption': float(latest_ctp_consumption)
            }
        }
        
    except Exception as e:
        print(f"Error in check_alert_condition_1: {e}")
        return None

async def check_alert_condition_2(unom: int, ctp_id: str, consumption_df: pd.DataFrame,
                                 ctp_to_unom_map: Dict[str, List[int]], 
                                 alert_time: datetime, excedents_df: pd.DataFrame = None) -> Optional[Dict[str, Any]]:
    """
    Alert Condition 2: расход воды в доме=0 AND расход воды на выходе из ЦТП > 0 
    AND В других домах подключенных к ЦТП расход > 0
    """
    try:
        start_time = alert_time - timedelta(hours=CONFIG['event_duration_threshold'])
        
        # Get consumption data for the house
        house_data = await get_consumption_for_period_unom(unom, start_time, alert_time, consumption_df, excedents_df=excedents_df)
        if house_data.empty:
            print(f"DEBUG: No house data for {unom}")
            return None
            
        # Check if house consumption is zero
        latest_house_consumption = house_data['реальный'].iloc[-1]
        if not is_zero_consumption(latest_house_consumption):
            return None
            
        # Get CTP consumption data
        ctp_data = await get_consumption_for_period_ctp(ctp_id, start_time, alert_time, consumption_df, ctp_to_unom_map, excedents_df=excedents_df)
        if ctp_data.empty:
            return None
            
        # Check if CTP outlet consumption is greater than zero
        latest_ctp_consumption = ctp_data['реальный'].iloc[-1]
        if is_zero_consumption(latest_ctp_consumption):
            return None
            
        # Check other houses connected to the same CTP
        other_houses = [h for h in ctp_to_unom_map.get(ctp_id, []) if h != unom]
        if not other_houses:
            return None
            
        # Check if at least one other house has consumption > 0
        other_houses_with_consumption = 0
        for other_unom in other_houses[:5]:  # Limit to first 5 houses
            other_house_data = await get_consumption_for_period_unom(other_unom, start_time, alert_time, consumption_df, excedents_df=excedents_df)
            if not other_house_data.empty:
                other_consumption = other_house_data['реальный'].iloc[-1]
                if not is_zero_consumption(other_consumption):
                    other_houses_with_consumption += 1
                    
        if other_houses_with_consumption == 0:
            return None
            
        # All conditions met - generate alert
        return {
            'alert_id': 2,
            'unom': unom,
            'ctp_id': ctp_id,
            'address': get_house_address(unom),
            'ctp_name': get_ctp_name(ctp_id),
            'timestamp': alert_time.isoformat(),
            'consumption_data': {
                'house_consumption': float(latest_house_consumption),
                'ctp_consumption': float(latest_ctp_consumption),
                'other_houses_with_consumption': other_houses_with_consumption
            }
        }
        
    except Exception as e:
        print(f"Error in check_alert_condition_2: {e}")
        return None

async def check_alert_condition_3(unom: int, ctp_id: str, consumption_df: pd.DataFrame,
                                 ctp_to_unom_map: Dict[str, List[int]], 
                                 alert_time: datetime, excedents_df: pd.DataFrame = None) -> Optional[Dict[str, Any]]:
    """
    Alert Condition 3: расход воды в доме=0 AND расход воды на выходе из ЦТП > 0 
    AND если п.2 не подтвердилось отключение
    """
    try:
        start_time = alert_time - timedelta(hours=CONFIG['event_duration_threshold'])
        
        # Get consumption data for the house
        house_data = await get_consumption_for_period_unom(unom, start_time, alert_time, consumption_df)
        if house_data.empty:
            return None
            
        # Check if house consumption is zero
        latest_house_consumption = house_data['реальный'].iloc[-1]
        if not is_zero_consumption(latest_house_consumption):
            return None
            
        # Get CTP consumption data
        ctp_data = await get_consumption_for_period_ctp(ctp_id, start_time, alert_time, consumption_df, ctp_to_unom_map)
        if ctp_data.empty:
            return None
            
        # Check if CTP outlet consumption is greater than zero
        latest_ctp_consumption = ctp_data['реальный'].iloc[-1]
        if is_zero_consumption(latest_ctp_consumption):
            return None
            
        # Check if condition 2 would not be met (i.e., other houses don't have consumption)
        other_houses = [h for h in ctp_to_unom_map.get(ctp_id, []) if h != unom]
        other_houses_with_consumption = 0
        
        for other_unom in other_houses[:5]:  # Limit to first 5 houses
            other_house_data = await get_consumption_for_period_unom(other_unom, start_time, alert_time, consumption_df)
            if not other_house_data.empty:
                other_consumption = other_house_data['реальный'].iloc[-1]
                if not is_zero_consumption(other_consumption):
                    other_houses_with_consumption += 1
                    
        # Condition 3 is met if condition 2 would NOT be met (no other houses with consumption)
        if other_houses_with_consumption > 0:
            return None
            
        # All conditions met - generate alert
        return {
            'alert_id': 3,
            'unom': unom,
            'ctp_id': ctp_id,
            'address': get_house_address(unom),
            'ctp_name': get_ctp_name(ctp_id),
            'timestamp': alert_time.isoformat(),
            'consumption_data': {
                'house_consumption': float(latest_house_consumption),
                'ctp_consumption': float(latest_ctp_consumption)
            }
        }
        
    except Exception as e:
        print(f"Error in check_alert_condition_3: {e}")
        return None

async def check_alert_condition_4(unom: int, ctp_id: str, consumption_df: pd.DataFrame,
                                 ctp_to_unom_map: Dict[str, List[int]], 
                                 alert_time: datetime, excedents_df: pd.DataFrame = None) -> Optional[Dict[str, Any]]:
    """
    Alert Condition 4: расход воды намного больше прогнозируемого AND 
    расход воды на выходе из ЦТП ≈ сумме расходов воды на входе в дома (+/-5%) AND
    В других домах подключенных к ЦТП расход ≈ прогнозируемому
    """
    try:
        start_time = alert_time - timedelta(hours=CONFIG['event_duration_threshold'])
        
        # Get consumption data for the house
        house_data = await get_consumption_for_period_unom(unom, start_time, alert_time, consumption_df)
        if house_data.empty:
            return None
            
        # Check if house consumption is much higher than predicted (leak level)
        latest_house_real = house_data['реальный'].iloc[-1]
        latest_house_predicted = house_data['прогноз'].iloc[-1]
        
        # Check for leak either by consumption pattern or excedents data
        has_consumption_leak = is_consumption_leak_level(latest_house_real, latest_house_predicted)
        has_excedents_leak_data = has_excedents_leak(unom, start_time, alert_time, excedents_df)
        
        if not (has_consumption_leak or has_excedents_leak_data):
            return None
            
        # Get CTP consumption data
        ctp_data = await get_consumption_for_period_ctp(ctp_id, start_time, alert_time, consumption_df, ctp_to_unom_map)
        if ctp_data.empty:
            return None
            
        latest_ctp_real = ctp_data['реальный'].iloc[-1]
        latest_ctp_predicted = ctp_data['прогноз'].iloc[-1]
        
        # Calculate sum of house consumptions
        all_houses = ctp_to_unom_map.get(ctp_id, [])
        total_house_consumption = 0
        total_house_predicted = 0
        
        for house_unom in all_houses[:10]:  # Limit to first 10 houses for performance
            house_data_temp = await get_consumption_for_period_unom(house_unom, start_time, alert_time, consumption_df)
            if not house_data_temp.empty:
                total_house_consumption += house_data_temp['реальный'].iloc[-1]
                total_house_predicted += house_data_temp['прогноз'].iloc[-1]
        
        # Check if CTP consumption is approximately equal to sum of house consumptions
        if not is_consumption_approximately_equal(latest_ctp_real, total_house_consumption):
            return None
            
        # Check other houses (excluding current house)
        other_houses = [h for h in all_houses if h != unom]
        other_houses_normal = 0
        
        for other_unom in other_houses[:5]:  # Limit to first 5 houses
            other_house_data = await get_consumption_for_period_unom(other_unom, start_time, alert_time, consumption_df)
            if not other_house_data.empty:
                other_real = other_house_data['реальный'].iloc[-1]
                other_predicted = other_house_data['прогноз'].iloc[-1]
                if is_consumption_approximately_equal(other_real, other_predicted):
                    other_houses_normal += 1
                    
        # At least some other houses should have normal consumption
        if other_houses_normal == 0:
            return None
            
        # All conditions met - generate alert
        return {
            'alert_id': 4,
            'unom': unom,
            'ctp_id': ctp_id,
            'address': get_house_address(unom),
            'ctp_name': get_ctp_name(ctp_id),
            'timestamp': alert_time.isoformat(),
            'consumption_data': {
                'house_consumption': float(latest_house_real),
                'house_predicted': float(latest_house_predicted),
                'ctp_consumption': float(latest_ctp_real),
                'total_houses_consumption': float(total_house_consumption),
                'other_houses_normal': other_houses_normal
            }
        }
        
    except Exception as e:
        print(f"Error in check_alert_condition_4: {e}")
        return None

async def check_alert_condition_7(unom: int, ctp_id: str, consumption_df: pd.DataFrame,
                                 ctp_to_unom_map: Dict[str, List[int]], 
                                 alert_time: datetime, excedents_df: pd.DataFrame = None) -> Optional[Dict[str, Any]]:
    """
    Alert Condition 7: Дефицит воды в доме - расход более чем в 2 раза меньше прогнозируемого
    """
    try:
        start_time = alert_time - timedelta(hours=CONFIG['event_duration_threshold'])
        
        # Get consumption data for the house
        house_data = await get_consumption_for_period_unom(unom, start_time, alert_time, consumption_df, excedents_df=excedents_df)
        if house_data.empty:
            return None
            
        # Check if house consumption is much lower than predicted (water deficit)
        latest_house_real = house_data['реальный'].iloc[-1]
        latest_house_predicted = house_data['прогноз'].iloc[-1]
        
        # Проверяем: реальный расход не должен быть нулевым (это другой тип алерта)
        if is_zero_consumption(latest_house_real):
            return None
        
        # Проверяем: реальный расход должен быть более чем в 2 раза меньше прогнозируемого
        if latest_house_predicted <= 0:
            return None
            
        if latest_house_real >= latest_house_predicted * CONFIG['water_deficit_threshold']:
            return None
        # Условие выполнено - генерируем алерт
        return {
            'alert_id': 7,
            'unom': unom,
            'ctp_id': ctp_id,
            'address': get_house_address(unom),
            'ctp_name': get_ctp_name(ctp_id),
            'timestamp': alert_time.isoformat(),
            'consumption_data': {
                'house_consumption': float(latest_house_real),
                'house_predicted': float(latest_house_predicted),
                'deficit_ratio': float(latest_house_real / latest_house_predicted) if latest_house_predicted > 0 else 0
            }
        }
        
    except Exception as e:
        print(f"Error in check_alert_condition_7: {e}")
        return None

async def check_alert_condition_5(unom: int, ctp_id: str, consumption_df: pd.DataFrame,
                                 ctp_to_unom_map: Dict[str, List[int]], 
                                 alert_time: datetime, excedents_df: pd.DataFrame = None) -> Optional[Dict[str, Any]]:
    """
    Alert Condition 5: Маленькая утечка, обнаруженная ML-моделью
    Использует оптимизированную модель из small_leakage_model.py
    """
    try:
        
        start_time = alert_time - timedelta(hours=CONFIG['event_duration_threshold'])
        
        # Используем ML-модель для анализа утечек
        analysis_result = await analyze_leakage_with_consumption_data(
            unom=unom,
            start_ts=start_time.isoformat(),
            end_ts=alert_time.isoformat(),
            threshold=CONFIG['small_leakage_threshold']
        )
        
        # Проверяем, обнаружена ли утечка ML-моделью
        ml_leakage = analysis_result.get('is_leakage', False)
        ml_probability = analysis_result.get('leakage_probability', 0.0)
        
        # Проверяем условия для маленькой утечки
        is_small_leak = False
        detection_method = 'unknown'
        
        if 'error' not in analysis_result and ml_leakage and ml_probability < 0.7:
            # ML-модель обнаружила маленькую утечку
            is_small_leak = True
            detection_method = 'ml_model'
        elif excedents_df is not None and not excedents_df.empty:
            # Проверяем excedents.csv напрямую
            house_excedents = excedents_df[
                (excedents_df['type'] == 'mcd') & 
                (excedents_df['id'] == str(unom))
            ].copy()
            
            if not house_excedents.empty:
                house_excedents['leakage_numeric'] = pd.to_numeric(house_excedents['leakage'], errors='coerce')
                small_leaks = house_excedents[
                    (house_excedents['leakage_numeric'] >= CONFIG['small_leakage_excedents_threshold']) &
                    (house_excedents['leakage_numeric'] < CONFIG['min_leakage_threshold'])
                ]
                
                # Проверяем пересечение с периодом
                for _, excedent in small_leaks.iterrows():
                    excedent_start = pd.to_datetime(excedent['timestamp_start'])
                    excedent_end = pd.to_datetime(excedent['timestamp_end'])
                    
                    if not (alert_time <= excedent_start or start_time >= excedent_end):
                        is_small_leak = True
                        detection_method = 'excedents_data'
                        break
            
        if not is_small_leak:
            return None
            
        # Проверяем, что у нас достаточно данных для надежного анализа (только для ML)
        data_points = analysis_result.get('data_points', 0)
        if detection_method == 'ml_model' and data_points < 8:
            return None
            
        # Все условия выполнены - генерируем алерт
        return {
            'alert_id': 5,
            'unom': unom,
            'ctp_id': ctp_id,
            'address': get_house_address(unom),
            'ctp_name': get_ctp_name(ctp_id),
            'timestamp': alert_time.isoformat(),
            'ml_analysis': {
                'leakage_probability': float(ml_probability),
                'confidence': analysis_result.get('confidence', 'unknown'),
                'data_points': data_points,
                'threshold_used': CONFIG['small_leakage_threshold'],
                'detection_method': detection_method
            }
        }
        
    except Exception as e:
        print(f"Error in check_alert_condition_5: {e}")
        return None

async def check_alert_condition_6(ctp_id: str, consumption_df: pd.DataFrame,
                                 ctp_to_unom_map: Dict[str, List[int]], 
                                 alert_time: datetime, excedents_df: pd.DataFrame = None) -> Optional[Dict[str, Any]]:
    """
    Alert Condition 6: Нештатная работа насосов ЦТП (кавитация).
    Срабатывает когда расход воды на ЦТП * multiplier > максимального прогнозируемого расхода за последние 24 часа
    """
    try:
        # Get last 24 hours of CTP consumption data to find max predicted
        lookback_start = alert_time - timedelta(hours=CONFIG['pump_cavitation_lookback_hours'])
        ctp_data_24h = await get_consumption_for_period_ctp(ctp_id, lookback_start, alert_time, consumption_df, ctp_to_unom_map, excedents_df=excedents_df)
        
        if ctp_data_24h.empty:
            return None
        
        # Find maximum predicted consumption in the last 24 hours
        max_predicted_consumption = ctp_data_24h['прогноз'].max()
        
        if max_predicted_consumption <= 0:
            return None
        
        # Get current consumption
        latest_ctp_consumption = ctp_data_24h['реальный'].iloc[-1]
        
        # Calculate dynamic threshold
        dynamic_threshold = max_predicted_consumption * CONFIG['pump_cavitation_multiplier']
        
        # Check if current consumption exceeds the dynamic threshold
        if latest_ctp_consumption <= dynamic_threshold:
            return None
        
        # All conditions met - generate alert (CTP-level only, no specific house)
        return {
            'alert_id': 6,
            'ctp_id': ctp_id,
            'ctp_name': get_ctp_name(ctp_id),
            'timestamp': alert_time.isoformat(),
            'consumption_data': {
                'ctp_consumption': float(latest_ctp_consumption),
                'max_predicted_24h': float(max_predicted_consumption),
                'dynamic_threshold': float(dynamic_threshold),
                'multiplier': CONFIG['pump_cavitation_multiplier']
            }
        }
        
    except Exception as e:
        print(f"Error in check_alert_condition_6: {e}")
        return None

async def check_alert_condition_8(ctp_id: str, consumption_df: pd.DataFrame,
                                 ctp_to_unom_map: Dict[str, List[int]], 
                                 alert_time: datetime, excedents_df: pd.DataFrame = None) -> Optional[Dict[str, Any]]:
    """
    Alert Condition 8: Расход воды в ЦТП > суммы расхода воды в домах
    """
    try:
        start_time = alert_time - timedelta(hours=CONFIG['event_duration_threshold'])
        
        # Check if there's a significant leak recorded in excedents data for this CTP
        has_excedents_ctp_leak = False
        if excedents_df is not None and not excedents_df.empty:
            # First filter by type and id
            ctp_excedents = excedents_df[
                (excedents_df['type'] == 'ctp') & 
                (excedents_df['id'] == ctp_id)
            ].copy()
            
            # Convert leakage to numeric, coercing errors (like '-') to NaN
            ctp_excedents['leakage_numeric'] = pd.to_numeric(ctp_excedents['leakage'], errors='coerce')
            
            # Filter for significant leakage
            ctp_excedents = ctp_excedents[ctp_excedents['leakage_numeric'] > CONFIG['min_leakage_threshold']]
            
            if not ctp_excedents.empty:
                # Check if any excedent overlaps with the time period
                for _, excedent in ctp_excedents.iterrows():
                    excedent_start = pd.to_datetime(excedent['timestamp_start'])
                    excedent_end = pd.to_datetime(excedent['timestamp_end'])
                    
                    # Check for overlap
                    if not (alert_time <= excedent_start or start_time >= excedent_end):
                        has_excedents_ctp_leak = True
                        break
        
        # Get CTP consumption data
        ctp_data = await get_consumption_for_period_ctp(ctp_id, start_time, alert_time, consumption_df, ctp_to_unom_map, excedents_df=excedents_df)
        if ctp_data.empty:
            return None
            
        latest_ctp_consumption = ctp_data['реальный'].iloc[-1]
        
        # Calculate sum of house consumptions
        all_houses = ctp_to_unom_map.get(ctp_id, [])
        if not all_houses:
            return None
            
        total_house_consumption = 0
        house_count = 0
        
        for house_unom in all_houses[:15]:  # Limit to first 15 houses for performance
            house_data = await get_consumption_for_period_unom(house_unom, start_time, alert_time, consumption_df, excedents_df=excedents_df)
            if not house_data.empty:
                total_house_consumption += house_data['реальный'].iloc[-1]
                house_count += 1
        
        if house_count == 0:
            return None
            
        # Check if CTP consumption is significantly higher than sum of house consumptions OR if there's excedents leak
        consumption_condition = latest_ctp_consumption > total_house_consumption * 1.1  # 10% tolerance
        
        if not (consumption_condition or has_excedents_ctp_leak):
            return None
            
        # All conditions met - generate alert
        return {
            'alert_id': 8,
            'ctp_id': ctp_id,
            'ctp_name': get_ctp_name(ctp_id),
            'timestamp': alert_time.isoformat(),
            'consumption_data': {
                'ctp_consumption': float(latest_ctp_consumption),
                'total_houses_consumption': float(total_house_consumption),
                'house_count': house_count,
                'consumption_difference': float(latest_ctp_consumption - total_house_consumption)
            }
        }
        
    except Exception as e:
        print(f"Error in check_alert_condition_8: {e}")
        return None

# --- Main Alert Generation Function ---

async def generate_alerts(ctp_to_unom_map: Dict[str, List[int]], 
                         consumption_df: pd.DataFrame,
                         config: Dict[str, Any] = None,
                         alert_time: datetime = None,
                         excedents_df: pd.DataFrame = None) -> List[Dict[str, Any]]:
    """
    Main function to generate alerts based on the decision matrix.
    
    Args:
        ctp_to_unom_map: Mapping of CTP IDs to lists of UNOMs
        consumption_df: DataFrame with consumption data
        config: Configuration dictionary
        alert_time: Time to check for alerts (defaults to current time)
    
    Returns:
        List of alert dictionaries
    """
    if alert_time is None:
        alert_time = datetime.now()
        
    if config:
        CONFIG.update(config)
    
    alerts = []
    
    try:
        # Check individual house alerts (conditions 1-4)
        for ctp_id, unoms in ctp_to_unom_map.items():
            for unom in unoms[:20]:  # Limit to first 20 houses per CTP for performance
                try:
                    # Check condition 1
                    alert_1 = await check_alert_condition_1(unom, ctp_id, consumption_df, ctp_to_unom_map, alert_time, excedents_df)
                    if alert_1:
                        alerts.append(create_alert_object(alert_1))
                        continue  # Don't check other conditions if condition 1 is met
                    
                    # Check condition 2
                    alert_2 = await check_alert_condition_2(unom, ctp_id, consumption_df, ctp_to_unom_map, alert_time, excedents_df)
                    if alert_2:
                        alerts.append(create_alert_object(alert_2))
                        continue
                    
                    # Check condition 3
                    alert_3 = await check_alert_condition_3(unom, ctp_id, consumption_df, ctp_to_unom_map, alert_time, excedents_df)
                    if alert_3:
                        alerts.append(create_alert_object(alert_3))
                        continue
                    
                    # Check condition 4
                    alert_4 = await check_alert_condition_4(unom, ctp_id, consumption_df, ctp_to_unom_map, alert_time, excedents_df)
                    if alert_4:
                        alerts.append(create_alert_object(alert_4))
                        continue
                    
                    # Check condition 5 (small leak detection with ML)
                    alert_5 = await check_alert_condition_5(unom, ctp_id, consumption_df, ctp_to_unom_map, alert_time, excedents_df)
                    if alert_5:
                        alerts.append(create_alert_object(alert_5))
                        continue
                    
                    # Check condition 7
                    alert_7 = await check_alert_condition_7(unom, ctp_id, consumption_df, ctp_to_unom_map, alert_time, excedents_df)
                    if alert_7:
                        alerts.append(create_alert_object(alert_7))
                        
                except Exception as e:
                    print(f"Error checking alerts for house {unom}: {e}")
                    continue
        
        # Check CTP-level alerts (conditions 6 and 8)
        for ctp_id in ctp_to_unom_map.keys():
            try:
                # Check condition 6 (pump cavitation)
                alert_6 = await check_alert_condition_6(ctp_id, consumption_df, ctp_to_unom_map, alert_time, excedents_df)
                if alert_6:
                    alerts.append(create_alert_object(alert_6))
                
                # Check condition 8 (CTP leak)
                alert_8 = await check_alert_condition_8(ctp_id, consumption_df, ctp_to_unom_map, alert_time, excedents_df)
                if alert_8:
                    alerts.append(create_alert_object(alert_8))
            except Exception as e:
                print(f"Error checking CTP alert for {ctp_id}: {e}")
                continue
                
    except Exception as e:
        print(f"Error in generate_alerts: {e}")
    
    return alerts

def create_alert_object(alert_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a complete alert object with metadata and formatted message.
    Returns the old API format.
    """
    alert_id = alert_data['alert_id']
    metadata = ALERT_METADATA[alert_id]
    
    # Format the alert message
    alert_message = metadata['alert_message'].format(
        address=alert_data.get('address', 'Неизвестный адрес'),
        ctp=alert_data.get('ctp_name', 'Неизвестный ЦТП'),
        ctp_name=alert_data.get('ctp_name', 'Неизвестный ЦТП')
    )
    
    # Determine entity type and ID
    if 'unom' in alert_data:
        entity_type = 'дом'
        entity_id = alert_data['unom']
    else:
        entity_type = 'цтп'
        entity_id = alert_data.get('ctp_id', 'unknown')
    
    return {
        'alert_id': alert_id,
        'type': entity_type,
        'object_id': entity_id,
        'alert_message': alert_message,
        'comment': metadata['dispatcher_actions'],
        'level': metadata['level'],
    }
