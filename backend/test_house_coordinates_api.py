import requests
import json

# Тест нового API endpoint для поиска дома по координатам
def test_house_by_coordinates_api():
    """
    Тестирует API endpoint /house_by_coordinates
    """
    url = 'http://127.0.0.1:5001/house_by_coordinates'
    
    # Пример координат из GeoJSON (координаты дома 15109)
    test_coordinates = [
        {
            'lat': 55.758281,
            'lon': 37.834848,
            'description': 'Координаты дома 15109 из GeoJSON'
        },
        {
            'lat': 55.7578655,
            'lon': 37.835370400763964,
            'description': 'Координаты дома 15109 (начальная точка трубы)'
        }
    ]
    
    for i, coords in enumerate(test_coordinates):
        print(f"\n--- Тест {i+1}: {coords['description']} ---")
        
        params = {
            'lat': coords['lat'],
            'lon': coords['lon'],
            'timestamp': '2025-01-01T12:00:00',  # Используем дату из базы данных
            'radius': 200  # радиус поиска 200 метров
        }
        
        print(f"Запрос к: {url}")
        print(f"Параметры: {params}")
        
        try:
            response = requests.get(url, params=params)
            print(f"Статус код: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("Успешный ответ:")
                print(f"- Найден дом UNOM: {data['search_info']['found_house_unom']}")
                print(f"- ЦТП: {data['house_info']['ctp']}")
                print(f"- Адрес: {data['house_info']['address']}")
                print(f"- Координаты дома: {data['house_info']['coordinates']}")
                print(f"- Количество точек данных: {len(data['consumption_data']['timestamp'])}")
                print(f"- Текущее потребление: {data['statistics']['current_real_consumption']:.2f}")
                print(f"- Среднее потребление: {data['statistics']['average_real_consumption']:.2f}")
                
                # Сохраняем полный ответ в файл для анализа
                with open(f'test_response_{i+1}.json', 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"- Полный ответ сохранен в test_response_{i+1}.json")
                
            else:
                print("Ошибка:")
                print(response.text)
                
        except requests.exceptions.ConnectionError:
            print("Ошибка подключения: Убедитесь, что Flask сервер запущен на порту 5001")
        except Exception as e:
            print(f"Ошибка: {e}")

def test_invalid_coordinates():
    """
    Тестирует API с невалидными координатами
    """
    print("\n--- Тест с невалидными координатами ---")
    
    url = 'http://127.0.0.1:5001/house_by_coordinates'
    
    # Координаты в океане (далеко от Москвы)
    params = {
        'lat': 0.0,
        'lon': 0.0,
        'timestamp': '2025-01-01T12:00:00',
        'radius': 100
    }
    
    try:
        response = requests.get(url, params=params)
        print(f"Статус код: {response.status_code}")
        print("Ответ:", response.text)
        
    except Exception as e:
        print(f"Ошибка: {e}")

def test_missing_parameters():
    """
    Тестирует API с отсутствующими параметрами
    """
    print("\n--- Тест с отсутствующими параметрами ---")
    
    url = 'http://127.0.0.1:5001/house_by_coordinates'
    
    # Только lat, без lon
    params = {
        'lat': 55.758281,
        'timestamp': '2025-01-01T12:00:00'
    }
    
    try:
        response = requests.get(url, params=params)
        print(f"Статус код: {response.status_code}")
        print("Ответ:", response.text)
        
    except Exception as e:
        print(f"Ошибка: {e}")

if __name__ == "__main__":
    print("=== Тестирование API /house_by_coordinates ===")
    print("Убедитесь, что Flask сервер запущен: python backend/app.py")
    
    test_house_by_coordinates_api()
    test_invalid_coordinates()
    test_missing_parameters()
    
    print("\n=== Тестирование завершено ===")
