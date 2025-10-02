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
    # Возможные пути к конфигурации, проверяем по порядку
    possible_paths = [
        Path('/app/configs/telegram_config.json'),  # Docker контейнер путь
        Path(__file__).parent.parent / 'configs' / 'telegram_config.json',  # Локальный путь
        Path(__file__).parent / 'configs' / 'telegram_config.json',  # Альтернативный локальный путь
    ]
    
    config_path = None
    for path in possible_paths:
        if path.exists():
            config_path = path
            break
    
    if not config_path:
        logger.error(f"Файл конфигурации не найден ни в одном из путей:")
        for path in possible_paths:
            logger.error(f"  - {path}")
        logger.error("Создайте файл configs/telegram_config.json с токеном бота")
        return None
    
    try:
        logger.info(f"Загружаем конфигурацию из: {config_path}")
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except json.JSONDecodeError as e:
        logger.error(f"Ошибка в формате файла конфигурации: {e}")
        return None

def main():
    """Главная функция"""
    logger.info("Запуск Telegram бота...")
    
    # Проверяем, не запущен ли уже бот (защита от нескольких экземпляров)
    import fcntl
    import sys
    
    # Попытка создать lock файл
    lock_file_path = "/tmp/telegram_bot.lock"
    try:
        lock_fd = open(lock_file_path, 'w')
        fcntl.flock(lock_fd.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        lock_fd.write(str(os.getpid()))
        lock_fd.flush()
        logger.info(f"Заблокирован процесс бота с PID {os.getpid()}")
    except IOError:
        logger.error("Telegram бот уже запущен в другом процессе!")
        logger.error("Закройте предыдущий экземпляр перед запуском нового")
        return
    
    # Загружаем конфигурацию
    config = load_config()
    if not config:
        try:
            lock_fd.close()
            os.unlink(lock_file_path)
        except:
            pass
        return
    
    bot_token = config.get('bot_token')
    if not bot_token or bot_token == "YOUR_BOT_TOKEN_HERE":
        logger.error("Токен бота не настроен в конфигурации")
        logger.error("Установите токен в файле configs/telegram_config.json")
        try:
            lock_fd.close()
            os.unlink(lock_file_path)
        except:
            pass
        return
    
    api_base_url = config.get('api_base_url', 'http://localhost:5001')
    
    try:
        # Создаем и запускаем бота
        bot = TelegramBot(bot_token, api_base_url)
        
        # Инициализируем данные
        logger.info("Инициализация данных бота...")
        import asyncio
        
        # Создаем главный event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
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
            logger.error(f"Ошибка при запуске бота: {e}")
        finally:
            try:
                loop.close()
            except:
                pass
        
    except KeyboardInterrupt:
        logger.info("Получен сигнал остановки")
    except Exception as e:
        logger.error(f"Ошибка при запуске бота: {e}")
    finally:
        # Освобождаем lock файл
        try:
            lock_fd.close()
            os.unlink(lock_file_path)
            logger.info("Освобожден lock файл процесса")
        except:
            pass

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Бот остановлен пользователем")
    except Exception as e:
        logger.error(f"Критическая ошибка: {e}")
        sys.exit(1)
