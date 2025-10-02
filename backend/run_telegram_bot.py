#!/usr/bin/env python3
"""
Скрипт для запуска Telegram бота.
Можно запускать отдельно от основного Flask приложения.
"""

import json
import logging
import os
import sys
from pathlib import Path

# Добавляем путь к модулям проекта
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from telegram_bot import TelegramBot

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def load_config():
    """Загрузка конфигурации бота"""
    config_path = Path(__file__).parent.parent / 'configs' / 'telegram_config.json'
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        logger.error(f"Файл конфигурации не найден: {config_path}")
        logger.error("Создайте файл configs/telegram_config.json с токеном бота")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Ошибка в формате файла конфигурации: {e}")
        return None

def main():
    """Главная функция"""
    logger.info("Запуск Telegram бота...")
    
    # Загружаем конфигурацию
    config = load_config()
    if not config:
        return
    
    bot_token = config.get('bot_token')
    if not bot_token or bot_token == "YOUR_BOT_TOKEN_HERE":
        logger.error("Токен бота не настроен в конфигурации")
        logger.error("Установите токен в файле configs/telegram_config.json")
        return
    
    api_base_url = config.get('api_base_url', 'http://localhost:5001')
    
    try:
        # Создаем и запускаем бота в отдельном потоке
        import threading
        import asyncio
        
        def run_bot():
            """Запуск бота в отдельном потоке"""
            try:
                # Создаем новый event loop для этого потока
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                # Создаем и запускаем бота
                bot = TelegramBot(bot_token, api_base_url)
                
                # Инициализируем данные синхронно
                loop.run_until_complete(bot.initialize_data())
                
                # Создаем приложение
                from telegram.ext import Application
                bot.application = Application.builder().token(bot.token).build()
                
                # Настраиваем обработчики
                bot.setup_handlers()
                
                # Запускаем бота
                logger.info("Запуск Telegram бота...")
                loop.run_until_complete(bot.application.run_polling())
                
            except Exception as e:
                logger.error(f"Ошибка в потоке бота: {e}")
            finally:
                try:
                    loop.close()
                except:
                    pass
        
        # Запускаем бота в отдельном потоке
        bot_thread = threading.Thread(target=run_bot, daemon=True)
        bot_thread.start()
        
        logger.info("Telegram бот запущен в отдельном потоке")
        logger.info("Нажмите Ctrl+C для остановки")
        
        # Ждем завершения потока
        bot_thread.join()
        
    except KeyboardInterrupt:
        logger.info("Получен сигнал остановки")
    except Exception as e:
        logger.error(f"Ошибка при запуске бота: {e}")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Бот остановлен пользователем")
    except Exception as e:
        logger.error(f"Критическая ошибка: {e}")
        sys.exit(1)
