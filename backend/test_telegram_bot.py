#!/usr/bin/env python3
"""
Тестовый скрипт для проверки работы Telegram бота.
Проверяет основные функции без отправки сообщений.
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path

# Добавляем путь к модулям проекта
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from alert_integration import AlertNotifier
from consumption_loader import load_data

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def test_alert_system():
    """Тест системы алертов"""
    logger.info("=== Тест системы алертов ===")
    
    try:
        # Загружаем данные
        ctp_to_unom_map, consumption_df = load_data()
        
        if consumption_df is None or ctp_to_unom_map is None:
            logger.error("Не удалось загрузить данные")
            return False
            
        logger.info(f"Данные загружены: {len(consumption_df)} записей")
        
        # Создаем тестовый AlertNotifier
        notifier = AlertNotifier("test_token", "http://localhost:5001")
        await notifier.initialize_data()
        
        # Получаем сводку алертов
        summary = await notifier.get_current_alerts_summary()
        logger.info(f"Сводка алертов: {json.dumps(summary, indent=2, ensure_ascii=False)}")
        
        return True
        
    except Exception as e:
        logger.error(f"Ошибка в тесте системы алертов: {e}")
        return False

async def test_data_loading():
    """Тест загрузки данных"""
    logger.info("=== Тест загрузки данных ===")
    
    try:
        ctp_to_unom_map, consumption_df = load_data()
        
        if consumption_df is None:
            logger.error("DataFrame пуст")
            return False
            
        if ctp_to_unom_map is None:
            logger.error("Карта ЦТП пуста")
            return False
            
        logger.info(f"Загружено {len(consumption_df)} записей потребления")
        logger.info(f"Найдено {len(ctp_to_unom_map)} ЦТП")
        
        # Проверяем структуру данных
        logger.info(f"Колонки DataFrame: {list(consumption_df.columns)}")
        logger.info(f"Диапазон дат: {consumption_df.index.min()} - {consumption_df.index.max()}")
        
        # Проверяем несколько ЦТП
        for i, (ctp, houses) in enumerate(list(ctp_to_unom_map.items())[:3]):
            logger.info(f"ЦТП {ctp}: {len(houses)} домов")
            
        return True
        
    except Exception as e:
        logger.error(f"Ошибка в тесте загрузки данных: {e}")
        return False

async def test_consumption_functions():
    """Тест функций работы с потреблением"""
    logger.info("=== Тест функций потребления ===")
    
    try:
        from consumption_loader import get_consumption_for_period_unom, get_consumption_for_period_ctp
        import pandas as pd
        
        ctp_to_unom_map, consumption_df = load_data()
        
        if consumption_df is None or ctp_to_unom_map is None:
            logger.error("Данные не загружены")
            return False
            
        # Тестируем получение данных для дома
        test_unom = list(ctp_to_unom_map.values())[0][0]  # Первый дом из первого ЦТП
        end_ts = pd.Timestamp.now()
        start_ts = end_ts - pd.Timedelta(hours=24)
        
        house_data = await get_consumption_for_period_unom(
            test_unom, start_ts, end_ts, consumption_df
        )
        
        if house_data.empty:
            logger.warning(f"Нет данных для дома {test_unom}")
        else:
            logger.info(f"Данные для дома {test_unom}: {len(house_data)} записей")
            
        # Тестируем получение данных для ЦТП
        test_ctp = list(ctp_to_unom_map.keys())[0]
        ctp_data = await get_consumption_for_period_ctp(
            test_ctp, start_ts, end_ts, consumption_df, ctp_to_unom_map
        )
        
        if ctp_data.empty:
            logger.warning(f"Нет данных для ЦТП {test_ctp}")
        else:
            logger.info(f"Данные для ЦТП {test_ctp}: {len(ctp_data)} записей")
            
        return True
        
    except Exception as e:
        logger.error(f"Ошибка в тесте функций потребления: {e}")
        return False

async def test_config_loading():
    """Тест загрузки конфигурации"""
    logger.info("=== Тест загрузки конфигурации ===")
    
    try:
        config_path = Path(__file__).parent.parent / 'configs' / 'telegram_config.json'
        
        if not config_path.exists():
            logger.warning(f"Файл конфигурации не найден: {config_path}")
            logger.info("Создайте файл configs/telegram_config.json с токеном бота")
            return False
            
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            
        bot_token = config.get('bot_token')
        if not bot_token or bot_token == "YOUR_BOT_TOKEN_HERE":
            logger.warning("Токен бота не настроен")
            return False
            
        logger.info("Конфигурация загружена успешно")
        return True
        
    except Exception as e:
        logger.error(f"Ошибка в тесте конфигурации: {e}")
        return False

async def main():
    """Главная функция тестирования"""
    logger.info("Запуск тестов Telegram бота...")
    
    tests = [
        ("Загрузка данных", test_data_loading),
        ("Функции потребления", test_consumption_functions),
        ("Система алертов", test_alert_system),
        ("Конфигурация", test_config_loading),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        logger.info(f"\n--- {test_name} ---")
        try:
            result = await test_func()
            results.append((test_name, result))
            if result:
                logger.info(f"✅ {test_name}: ПРОЙДЕН")
            else:
                logger.error(f"❌ {test_name}: ПРОВАЛЕН")
        except Exception as e:
            logger.error(f"❌ {test_name}: ОШИБКА - {e}")
            results.append((test_name, False))
    
    # Итоговый отчет
    logger.info("\n" + "="*50)
    logger.info("ИТОГОВЫЙ ОТЧЕТ")
    logger.info("="*50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ ПРОЙДЕН" if result else "❌ ПРОВАЛЕН"
        logger.info(f"{test_name}: {status}")
    
    logger.info(f"\nПройдено: {passed}/{total}")
    
    if passed == total:
        logger.info("🎉 Все тесты пройдены успешно!")
        return 0
    else:
        logger.error("⚠️ Некоторые тесты провалены")
        return 1

if __name__ == '__main__':
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.info("Тестирование прервано пользователем")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Критическая ошибка: {e}")
        sys.exit(1)
