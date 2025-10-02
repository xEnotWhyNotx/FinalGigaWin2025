# Telegram Bot для системы мониторинга водоснабжения

Telegram бот для отправки алертов и предоставления информации о системе мониторинга водоснабжения.

## Возможности

### 🔔 Уведомления об алертах
- Автоматическая отправка алертов подписанным пользователям
- Различные уровни критичности (Критический, Высокий, Средний, Низкий)
- Подписка/отписка от уведомлений

### 🏠 Работа с домами
- Поиск дома по номеру UNOM
- Поиск дома по координатам
- Статистика потребления воды
- Сравнение двух домов
- Экспорт данных в JSON

### 🏢 Работа с ЦТП
- Информация о ЦТП
- Статистика потребления
- Список подключенных домов

### 📊 Аналитика
- Топ потребителей по текущему потреблению
- Проверка состояния системы
- Статус API и базы данных

## Установка и настройка

### 1. Создание Telegram бота

1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните полученный токен

### 2. Настройка конфигурации

Создайте файл `configs/telegram_config.json`:

```json
{
  "bot_token": "YOUR_BOT_TOKEN_HERE",
  "api_base_url": "http://localhost:5001",
  "check_interval_seconds": 300,
  "max_alerts_per_message": 5
}
```

Замените `YOUR_BOT_TOKEN_HERE` на токен вашего бота.

### 3. Установка зависимостей

```bash
cd backend
pip install -r requirements.txt
```

### 4. Запуск бота

#### Вариант 1: Отдельный процесс
```bash
cd backend
python run_telegram_bot.py
```

#### Вариант 2: Интеграция с основным приложением
Добавьте в `app.py`:

```python
import asyncio
from telegram_bot import TelegramBot

# В функции main или при инициализации
async def start_telegram_bot():
    config_path = 'configs/telegram_config.json'
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    bot = TelegramBot(config['bot_token'])
    await bot.run()

# Запуск в отдельном потоке
import threading
telegram_thread = threading.Thread(target=lambda: asyncio.run(start_telegram_bot()))
telegram_thread.daemon = True
telegram_thread.start()
```

## Команды бота

### Основные команды

- `/start` - Начать работу с ботом
- `/help` - Справка по командам
- `/alerts` - Получить текущие алерты
- `/subscribe` - Подписаться на уведомления
- `/unsubscribe` - Отписаться от уведомлений
- `/status` - Статус системы

### Поиск и информация

- `/search_house <UNOM>` - Найти дом по номеру UNOM
- `/search_coords <lat> <lon>` - Найти дом по координатам
- `/stats <UNOM>` - Статистика потребления дома

### Расширенные команды

- `/ctp_info <CTP_ID>` - Информация о ЦТП
- `/ctp_stats <CTP_ID>` - Статистика ЦТП
- `/compare <UNOM1> <UNOM2>` - Сравнение двух домов
- `/top_consumers` - Топ потребителей
- `/health` - Проверка состояния системы
- `/export <UNOM>` - Экспорт данных дома в JSON
- `/help_advanced` - Расширенная справка

### Примеры использования

```
/search_house 12345
/search_coords 55.7558 37.6176
/stats 12345
/ctp_info ЦТП-1
/compare 12345 67890
/export 12345
```

## Архитектура

### Основные компоненты

1. **TelegramBot** (`telegram_bot.py`) - Основной класс бота
2. **AlertNotifier** (`alert_integration.py`) - Система уведомлений
3. **AdvancedTelegramCommands** (`telegram_commands.py`) - Расширенные команды

### Интеграция с системой

Бот интегрируется с существующей системой через:
- `alert_controller.py` - для получения алертов
- `consumption_loader.py` - для работы с данными потребления
- Flask API - для дополнительных запросов

## Безопасность

- Токен бота хранится в конфигурационном файле
- Конфигурационные файлы исключены из git через `.gitignore`
- Логирование всех операций
- Обработка ошибок и исключений

## Мониторинг

Бот ведет логи всех операций:
- Подключения пользователей
- Отправка алертов
- Ошибки API
- Статистика использования

## Развертывание

### Docker

Добавьте в `docker-compose.yaml`:

```yaml
services:
  telegram-bot:
    build: ./backend
    command: python run_telegram_bot.py
    volumes:
      - ./configs:/app/configs
    depends_on:
      - backend
    environment:
      - PYTHONPATH=/app
```

### Системный сервис

Создайте файл `/etc/systemd/system/telegram-bot.service`:

```ini
[Unit]
Description=Telegram Bot for Water Monitoring
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/GigaWin2025/backend
ExecStart=/usr/bin/python3 run_telegram_bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Устранение неполадок

### Бот не отвечает
1. Проверьте токен бота
2. Убедитесь, что Flask API запущен
3. Проверьте логи бота

### Алерты не приходят
1. Проверьте подписку пользователя
2. Убедитесь, что система алертов работает
3. Проверьте подключение к базе данных

### Ошибки API
1. Проверьте URL API в конфигурации
2. Убедитесь, что Flask приложение запущено
3. Проверьте доступность порта 5001

## Разработка

### Добавление новых команд

1. Создайте метод в `AdvancedTelegramCommands`
2. Добавьте обработчик в `setup_handlers()`
3. Обновите справку

### Кастомизация уведомлений

Измените метод `send_alert_to_user()` в `AlertNotifier` для настройки формата сообщений.

### Тестирование

```bash
# Тест системы алертов
python -m backend.alert_integration

# Тест бота (требует токен)
python -m backend.telegram_bot
```
