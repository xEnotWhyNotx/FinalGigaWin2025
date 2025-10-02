from flask import Flask, jsonify, request
from flask_cors import CORS
from alert_controller import generate_alerts
from consumption_loader import load_data, load_ctp_points, get_consumption_for_period_unom, get_consumption_for_period_ctp, simulate_real_consumption, build_ctp_pressure_payload
from user_auth import auth_manager
import json
import os
from typing import List, Tuple, Optional, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
import asyncio
import math
import requests
import time
from functools import wraps


app = Flask(__name__)
CORS(app)  # Включаем CORS для всех доменов


# --- Load data once on startup ---
print("--- Загрузка данных о потреблении и карты ЦТП ---")
ctp_to_unom_map, consumption_df, excedents_df = load_data()

if consumption_df is None or ctp_to_unom_map is None:
    print("Не удалось загрузить данные. API может возвращать пустые результаты.")
else:
    print(f"Успешно загружено {len(consumption_df)} записей.")

    print("--- Используем все доступные данные ---")
    print(f"Доступно {len(consumption_df)} записей.")

# --- Загрузка GeoJSON данных для поиска домов по координатам ---
print("--- Загрузка GeoJSON данных ---")
try:
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    geojson_path = os.path.join(base_dir, 'data', 'Трубы_v2.geojson')
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    print(f"Загружено {len(geojson_data['features'])} объектов из GeoJSON")
except Exception as e:
    print(f"Ошибка загрузки GeoJSON: {e}")
    geojson_data = None

print("--- Загрузка мета-данных о ЦТП ---")
ctp_points_df = load_ctp_points()

# --- Декоратор для авторизации ---
def require_auth(f):
    """Декоратор для проверки авторизации"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token авторизации отсутствует'}), 401
        
        # Убираем "Bearer " из заголовка
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_data = auth_manager.verify_session(token)
        if not user_data:
            return jsonify({'error': 'Недействительный токен авторизации'}), 401
        
        request.current_user = user_data
        return f(*args, **kwargs)
    return decorated_function

def require_permission(permission):
    """Декоратор для проверки разрешений"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'current_user'):
                return jsonify({'error': 'Пользователь не авторизован'}), 401
            
            if not auth_manager.check_permission(request.current_user['user_id'], permission):
                return jsonify({'error': 'Недостаточно прав доступа'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


@app.route('/alerts', methods=['GET'])
def get_alerts():
    """
    This endpoint generates and returns alerts based on the loaded data.
    Each alert now includes a timestamp.
    It can be customized with query parameters.
    
    Query Parameters:
        - duration_threshold (int, optional): Sets the event duration threshold in hours. Defaults to 4.
        - timestamp (str, optional): ISO format timestamp (e.g., "2023-10-27T10:00:00") or "NOW". Defaults to current time.
    """
    if consumption_df.empty:
        return jsonify({"error": "Данные о потреблении не загружены, невозможно сгенерировать алерты."}), 500

    try:
        duration_threshold = request.args.get('duration_threshold', 4, type=int)
        timestamp_str = request.args.get('timestamp')

        alert_time = None
        if timestamp_str and timestamp_str.upper() != 'NOW':
            try:
                alert_time = datetime.fromisoformat(timestamp_str)
            except ValueError:
                return jsonify({"error": "Invalid timestamp format. Please use ISO format (YYYY-MM-DDTHH:MM:SS) or 'NOW'."}), 400

    except ValueError:
        return jsonify({"error": "Invalid query parameter. 'duration_threshold' must be an integer."}), 400

    config = {'event_duration_threshold': duration_threshold}
    
    # generate_alerts returns a list of dictionaries
    alerts_data = asyncio.run(generate_alerts(ctp_to_unom_map, consumption_df, config=config, alert_time=alert_time, excedents_df=excedents_df))
    
    return jsonify(alerts_data)

@app.route('/ml_predict', methods=['POST'])
def ml_predict():
    # TODO: Implement machine learning prediction logic
    pass

@app.route('/ctp_data', methods=['GET'])
def ctp_data():
    ctp_id = request.args.get('ctp_id')
    timestamp_str = request.args.get('timestamp')

    if not ctp_id or not timestamp_str:
        return jsonify({"error": "Missing 'ctp_id' or 'timestamp' parameter"}), 400

    try:
        end_ts = pd.to_datetime(timestamp_str)
        end_ts = end_ts.floor('H')
    except Exception:
        return jsonify({"error": "Invalid timestamp format. Use ISO format like YYYY-MM-DDTHH:MM:SS"}), 400

    start_ts = end_ts - timedelta(hours=24)

    result_df = asyncio.run(get_consumption_for_period_ctp(ctp_id, start_ts, end_ts, consumption_df, ctp_to_unom_map, excedents_df=excedents_df))

    if result_df.empty:
        return jsonify({"error": "No data found for the given CTP and period"}), 404

    response_data = {
        "predicted": result_df['прогноз'].tolist(),
        "real": result_df['реальный'].tolist(),
        "timestamp": result_df.index.strftime('%Y-%m-%d %H:%M:%S').tolist()
    }

    return jsonify(response_data)


@app.route('/ctp_data_pressure', methods=['GET'])
def ctp_data_pressure():
    ctp_id = request.args.get('ctp_id')
    timestamp_str = request.args.get('timestamp')

    if not ctp_id or not timestamp_str:
        return jsonify({"error": "Missing 'ctp_id' or 'timestamp' parameter"}), 400

    try:
        end_ts = pd.to_datetime(timestamp_str)
        end_ts = end_ts.floor('H')
    except Exception:
        return jsonify({"error": "Invalid timestamp format. Use ISO format like YYYY-MM-DDTHH:MM:SS"}), 400

    start_ts = end_ts - timedelta(hours=24)

    result_df = asyncio.run(get_consumption_for_period_ctp(ctp_id, start_ts, end_ts, consumption_df, ctp_to_unom_map, excedents_df=excedents_df))

    if result_df.empty:
        return jsonify({"error": "No data found for the given CTP and period"}), 404

    response_data = asyncio.run(build_ctp_pressure_payload(ctp_id, end_ts, result_df, ctp_points_df))
    return jsonify(response_data)

@app.route('/mcd_data', methods=['GET'])
def mcd_data():
    unom = request.args.get('unom', type=int)
    timestamp_str = request.args.get('timestamp')

    if not unom or not timestamp_str:
        return jsonify({"error": "Missing 'unom' or 'timestamp' parameter"}), 400

    try:
        end_ts = pd.to_datetime(timestamp_str)
        end_ts = end_ts.floor('H')
    except Exception:
        return jsonify({"error": "Invalid timestamp format. Use ISO format like YYYY-MM-DDTHH:MM:SS"}), 400

    start_ts = end_ts - timedelta(hours=24)
    
    result_df = asyncio.run(get_consumption_for_period_unom(unom, start_ts, end_ts, consumption_df, excedents_df=excedents_df))

    if result_df.empty:
        return jsonify({"error": "No data found for the given UNOM and period"}), 404
        
    response_data = {
        "predicted": result_df['прогноз'].tolist(),
        "real": result_df['реальный'].tolist(),
        "timestamp": result_df.index.strftime('%Y-%m-%d %H:%M:%S').tolist()
    }

    return jsonify(response_data)

@app.route('/house_by_coordinates', methods=['GET'])
def house_by_coordinates():
    """
    API endpoint для поиска дома по координатам и получения данных для графиков и статистики.
    
    Query Parameters:
        - lat (float): Широта точки
        - lon (float): Долгота точки
        - timestamp (str): Временная метка в формате ISO (YYYY-MM-DDTHH:MM:SS)
        - radius (float, optional): Радиус поиска в метрах. По умолчанию 100 метров
    """
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    timestamp_str = request.args.get('timestamp')
    radius = request.args.get('radius', 100, type=float)  # радиус в метрах
    
    if not all([lat, lon, timestamp_str]):
        return jsonify({"error": "Missing required parameters: 'lat', 'lon', 'timestamp'"}), 400
    
    try:
        end_ts = pd.to_datetime(timestamp_str)
    except Exception:
        return jsonify({"error": "Invalid timestamp format. Use ISO format like YYYY-MM-DDTHH:MM:SS"}), 400
    
    # Поиск ближайшего дома по координатам
    closest_unom = find_closest_house_by_coordinates(lat, lon, radius)
    
    if not closest_unom:
        return jsonify({"error": f"No houses found within {radius}m radius"}), 404
    
    # Получение данных потребления за последние 24 часа
    start_ts = end_ts - timedelta(hours=24)
    consumption_data = asyncio.run(get_consumption_for_period_unom(closest_unom, start_ts, end_ts, consumption_df, excedents_df=excedents_df))
    
    if consumption_data.empty:
        return jsonify({"error": "No consumption data found for the house"}), 404
    
    # Получение дополнительной информации о доме
    house_info = get_house_info(closest_unom)
    
    # Расчет статистики
    stats = calculate_house_statistics(consumption_data)
    
    response_data = {
        "house_info": house_info,
        "consumption_data": {
            "predicted": consumption_data['прогноз'].tolist(),
            "real": consumption_data['реальный'].tolist(),
            "timestamp": consumption_data.index.strftime('%Y-%m-%d %H:%M:%S').tolist()
        },
        "statistics": stats,
        "search_info": {
            "search_coordinates": {"lat": lat, "lon": lon},
            "search_radius_meters": radius,
            "found_house_unom": closest_unom
        }
    }
    
    return jsonify(response_data)

# --- Вспомогательные функции ---

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Вычисляет расстояние между двумя точками на Земле в метрах
    используя формулу Haversine.
    """
    R = 6371000  # Радиус Земли в метрах
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def find_closest_house_by_coordinates(lat: float, lon: float, radius: float = 100) -> Optional[int]:
    """
    Находит ближайший дом по координатам в заданном радиусе.
    Возвращает UNOM найденного дома или None.
    """
    if not geojson_data:
        return None
    
    closest_unom = None
    min_distance = float('inf')
    
    for feature in geojson_data['features']:
        if feature['geometry']['type'] == 'LineString':
            # Берем координаты конца трубы (координаты дома)
            coordinates = feature['geometry']['coordinates']
            if len(coordinates) >= 2:
                house_lon, house_lat = coordinates[-1]  # Последняя точка - дом
                unom = feature['properties'].get('Конец')
                
                if unom and isinstance(unom, (int, float)):
                    distance = haversine_distance(lat, lon, house_lat, house_lon)
                    
                    if distance <= radius and distance < min_distance:
                        min_distance = distance
                        closest_unom = int(unom)
    
    return closest_unom

def get_house_info(unom: int) -> Dict[str, Any]:
    """
    Получает информацию о доме по UNOM.
    """
    # Поиск ЦТП для данного дома
    ctp_name = None
    for ctp, unoms in ctp_to_unom_map.items():
        if unom in unoms:
            ctp_name = ctp
            break
    
    # Поиск координат дома в GeoJSON
    house_coordinates = None
    if geojson_data:
        for feature in geojson_data['features']:
            if (feature['geometry']['type'] == 'LineString' and 
                feature['properties'].get('Конец') == unom):
                coordinates = feature['geometry']['coordinates']
                if len(coordinates) >= 2:
                    house_coordinates = {
                        'lon': coordinates[-1][0],
                        'lat': coordinates[-1][1]
                    }
                break
    
    return {
        'unom': unom,
        'ctp': ctp_name or f"ЦТП-{unom % 10}",
        'address': None,  # Адрес будет получаться через геокодинг
        'coordinates': house_coordinates
    }

def calculate_house_statistics(consumption_data: pd.DataFrame) -> Dict[str, Any]:
    """
    Рассчитывает статистику потребления воды для дома.
    """
    if consumption_data.empty:
        return {}
    
    real_values = consumption_data['реальный']
    predicted_values = consumption_data['прогноз']
    
    # Основная статистика
    stats = {
        'total_real_consumption': float(real_values.sum()),
        'total_predicted_consumption': float(predicted_values.sum()),
        'average_real_consumption': float(real_values.mean()),
        'average_predicted_consumption': float(predicted_values.mean()),
        'max_real_consumption': float(real_values.max()),
        'min_real_consumption': float(real_values.min()),
        'max_predicted_consumption': float(predicted_values.max()),
        'min_predicted_consumption': float(predicted_values.min()),
    }
    
    # Расчет отклонений
    if len(real_values) > 0 and len(predicted_values) > 0:
        differences = real_values - predicted_values
        stats['average_deviation'] = float(differences.mean())
        stats['max_deviation'] = float(differences.max())
        stats['min_deviation'] = float(differences.min())
        stats['deviation_percentage'] = float((differences / predicted_values * 100).mean())
    
    # Текущие значения (последние записи)
    if len(real_values) > 0:
        stats['current_real_consumption'] = float(real_values.iloc[-1])
    if len(predicted_values) > 0:
        stats['current_predicted_consumption'] = float(predicted_values.iloc[-1])
    
    return stats

def get_address_by_coordinates(lat: float, lon: float) -> Optional[str]:
    """
    Получает адрес по координатам используя Nominatim API (OpenStreetMap).
    """
    try:
        # Добавляем задержку для соблюдения лимитов API
        time.sleep(1)
        
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            'format': 'json',
            'lat': lat,
            'lon': lon,
            'zoom': 18,
            'addressdetails': 1,
            'accept-language': 'ru'
        }
        
        headers = {
            'User-Agent': 'GigaWin2025/1.0 (water management system)'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if 'display_name' in data:
                # Извлекаем основные компоненты адреса
                address_parts = []
                
                if 'address' in data:
                    addr = data['address']
                    
                    # Собираем адрес из компонентов
                    if 'house_number' in addr:
                        house_num = addr['house_number']
                        if 'road' in addr:
                            address_parts.append(f"{addr['road']}, д. {house_num}")
                        elif 'street' in addr:
                            address_parts.append(f"{addr['street']}, д. {house_num}")
                        else:
                            address_parts.append(f"д. {house_num}")
                    elif 'road' in addr:
                        address_parts.append(addr['road'])
                    elif 'street' in addr:
                        address_parts.append(addr['street'])
                    
                    if 'suburb' in addr:
                        address_parts.append(addr['suburb'])
                    elif 'city_district' in addr:
                        address_parts.append(addr['city_district'])
                    
                    if 'city' in addr:
                        address_parts.append(addr['city'])
                    elif 'town' in addr:
                        address_parts.append(addr['town'])
                    elif 'village' in addr:
                        address_parts.append(addr['village'])
                
                if address_parts:
                    return ', '.join(address_parts)
                else:
                    # Если не удалось собрать адрес из компонентов, используем display_name
                    return data['display_name']
        
        return None
        
    except Exception as e:
        print(f"Ошибка получения адреса для координат {lat}, {lon}: {e}")
        return None

@app.route('/geocoding', methods=['GET'])
def geocoding():
    """
    API endpoint для получения адреса по координатам.
    
    Query Parameters:
        - lat (float): Широта
        - lon (float): Долгота
    """
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    
    if not lat or not lon:
        return jsonify({"error": "Missing 'lat' or 'lon' parameter"}), 400
    
    address = get_address_by_coordinates(lat, lon)
    
    if address:
        return jsonify({
            "address": address,
            "coordinates": {"lat": lat, "lon": lon}
        })
    else:
        return jsonify({"error": "Address not found"}), 404

@app.route('/geojson', methods=['GET'])
def get_geojson():
    """
    API endpoint для получения GeoJSON данных о домах и трубопроводах.
    """
    if not geojson_data:
        return jsonify({"error": "GeoJSON data not loaded"}), 500
    
    return jsonify(geojson_data)

@app.route('/houses', methods=['GET'])
def get_houses():
    """
    API endpoint для получения списка всех домов с координатами и информацией.
    """
    if not geojson_data:
        return jsonify({"error": "GeoJSON data not loaded"}), 500
    
    houses = []
    
    for feature in geojson_data['features']:
        if feature['geometry']['type'] == 'LineString':
            coordinates = feature['geometry']['coordinates']
            if len(coordinates) >= 2:
                # Берем координаты конца трубы (координаты дома)
                house_lon, house_lat = coordinates[-1]
                unom = feature['properties'].get('Конец')
                ctp = feature['properties'].get('Начало')
                
                if unom and isinstance(unom, (int, float)):
                    # Получаем дополнительную информацию о доме
                    house_info = get_house_info(int(unom))
                    
                    house_data = {
                        'unom': int(unom),
                        'ctp': ctp or house_info.get('ctp', f"ЦТП-{int(unom) % 10}"),
                        'address': None,  # Адрес будет получаться через геокодинг
                        'coordinates': {
                            'lat': house_lat,
                            'lon': house_lon
                        },
                        'properties': feature['properties']
                    }
                    houses.append(house_data)
    
    return jsonify({
        'houses': houses,
        'total_count': len(houses)
    })

@app.route('/add_incedent', methods=['POST'])
def add_incedent():
    # TODO: Implement logic to add a new incident
    pass

# --- Эндпоинты авторизации ---

@app.route('/auth/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Данные не предоставлены'}), 400
        
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name', '')
        
        if not email or not password:
            return jsonify({'error': 'Email и пароль обязательны'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Пароль должен содержать минимум 6 символов'}), 400
        
        user_id = auth_manager.create_user(email, password, full_name)
        
        return jsonify({
            'message': 'Пользователь успешно зарегистрирован',
            'user_id': user_id
        }), 201
        
    except ValueError as e:
        return jsonify({'error': 'Пользователь с таким email уже существует'}), 400
    except Exception as e:
        return jsonify({'error': 'Ошибка регистрации пользователя'}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    """Авторизация пользователя"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Данные не предоставлены'}), 400
        
        email = data.get('email')
        password = data.get('password')
        telegram_id = data.get('telegram_id')
        
        if not email or not password:
            return jsonify({'error': 'Email и пароль обязательны'}), 400
        
        user_data = auth_manager.login(email, password, telegram_id)
        
        if not user_data:
            return jsonify({'error': 'Неверный email или пароль'}), 401
        
        return jsonify({
            'message': 'Авторизация успешна',
            'user': {
                'user_id': user_data['user_id'],
                'email': user_data['email'],
                'full_name': user_data['full_name'],
                'role': user_data['role'],
                'telegram_id': user_data.get('telegram_id')
            },
            'session_token': user_data['session_token']
        })
        
    except Exception as e:
        return jsonify({'error': 'Ошибка авторизации'}), 500

@app.route('/auth/logout', methods=['POST'])
@require_auth
def logout():
    """Выход пользователя"""
    try:
        token = request.headers.get('Authorization')
        if token.startswith('Bearer '):
            token = token[7:]
        
        auth_manager.logout(token)
        
        return jsonify({'message': 'Выход выполнен успешно'})
        
    except Exception as e:
        return jsonify({'error': 'Ошибка выхода'}), 500

@app.route('/auth/profile', methods=['GET'])
@require_auth
def get_profile():
    """Получение профиля пользователя"""
    try:
        user_data = request.current_user
        
        return jsonify({
            'user': {
                'user_id': user_data['user_id'],
                'email': user_data['email'],
                'full_name': user_data['full_name'],
                'role': user_data['role'],
                'telegram_id': user_data.get('telegram_id')
            }
        })
        
    except Exception as e:
        return jsonify({'error': 'Ошибка получения профиля'}), 500

@app.route('/auth/profile', methods=['PUT'])
@require_auth
def update_profile():
    """Обновление профиля пользователя"""
    try:
        data = request.get_json()
        current_user = request.current_user
        
        if not data:
            return jsonify({'error': 'Данные не предоставлены'}), 400
        
        update_data = {}
        
        if 'email' in data:
            update_data['email'] = data['email']
        if 'full_name' in data:
            update_data['full_name'] = data['full_name']
        
        success = auth_manager.update_user(current_user['user_id'], **update_data)
        
        if success:
            return jsonify({'message': 'Профиль обновлен успешно'})
        else:
            return jsonify({'error': 'Ошибка обновления профиля'}), 400
        
    except Exception as e:
        return jsonify({'error': 'Ошибка обновления профиля'}), 500

@app.route('/auth/telegram_login', methods=['POST'])
def telegram_login():
    """Привязка Telegram аккаунта к существующему пользователю"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Данные не предоставлены'}), 400
        
        email = data.get('email')
        password = data.get('password')
        telegram_id = data.get('telegram_id')
        
        if not email or not password or not telegram_id:
            return jsonify({'error': 'Email, пароль и Telegram ID обязательны'}), 400
        
        user_data = auth_manager.login(email, password, telegram_id)
        
        if not user_data:
            return jsonify({'error': 'Неверный email или пароль'}), 401
        
        return jsonify({
            'message': 'Telegram аккаунт успешно привязан',
            'user': {
                'user_id': user_data['user_id'],
                'email': user_data['email'],
                'full_name': user_data['full_name'],
                'role': user_data['role'],
                'telegram_id': user_data.get('telegram_id')
            },
            'session_token': user_data['session_token']
        })
        
    except Exception as e:
        return jsonify({'error': 'Ошибка привязки Telegram аккаунта'}), 500

@app.route('/auth/users', methods=['GET'])
@require_auth
@require_permission('admin_access')
def get_users():
    """Получение списка всех пользователей (только для админов)"""
    try:
        current_user = request.current_user
        users = auth_manager.get_all_users()
        
        return jsonify({
            'users': users,
            'admin_info': {
                'user_id': current_user['user_id'],
                'email': current_user['email']
            }
        })
        
    except Exception as e:
        return jsonify({'error': 'Ошибка получения списка пользователей'}), 500

if __name__ == '__main__':
    # Setting debug=True enables auto-reloading and provides helpful error messages
    app.run(debug=True, port=5001)
