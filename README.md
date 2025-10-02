# GigaWin2025
Система мониторинга водоснабжения с использованием Telegram бота

## Описание проекта

GigaWin2025 - это система мониторинга и прогнозирования утечек воды в системе водоснабжения Москвы, включающая в себя:

- **Backend API** (Flask) - основной сервер для обработки данных и API
- **Frontend** (React + TypeScript) - веб-интерфейс для визуализации данных
- **Telegram Bot** - бот для получения уведомлений об авариях
- **Nginx** - обратный прокси для объединения компонентов

## Архитектура системы

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Telegram Bot   │    │   Nginx Proxy   │
│   (Port 80)     │    │   (Background)   │    │   (Port 8080)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────────────┐
                    │   Backend API      │
                    │   (Port 5001)      │
                    └────────────────────┘
```

## Установка и запуск

### Предварительные требования

- Docker
- Docker Compose

### Быстрый запуск

```bash
# Клонирование репозитория
git clone <repository-url>
cd GigaWin2025

# Запуск всех сервисов
make start
# или альтернативно:
docker-compose up --build -d
```

### Доступные команды

Используйте `make help` для просмотра всех доступных команд:

```bash
# Основные команды
make build          # Собрать все контейнеры
make start          # Запустить все сервисы
make stop           # Остановить сервисы
make restart        # Перезапустить сервисы
make logs           # Показать логи
make status         # Проверить статус

# Индивидуальные сервисы
make start-backend   # Только backend
make start-frontend  # Только frontend
make start-telegram  # Только telegram bot
make logs-backend    # Логи backend
make logs-telegram   # Логи telegram bot

# Режим разработки
make dev            # Запуск с пересборкой для разработки
make clean          # Полная очистка контейнеров и образов
```

## Доступ к сервисам

После запуска услуги доступны по следующим адресам:

- **Frontend (React)** - http://localhost:80
- **Backend API** - http://localhost:5001
- **Nginx Proxy** - http://localhost:8080
- **Telegram Bot** - работает в фоновом режиме

### API Endpoints

*   `GET` [http://localhost:5001/alerts](http://localhost:5001/alerts): Retrieves a list of alerts.
*   `POST` [http://localhost:5001/ml_predict](http://localhost:5001/ml_predict): Accepts data for machine learning prediction.
*   `GET` [http://localhost:5001/ctp_data](http://localhost:5001/ctp_data): Retrieves CTP data.
*   `GET` [http://localhost:5001/mcd_data](http://localhost:5001/mcd_data): Retrieves MCD data.
*   `POST` [http://localhost:5001/add_incedent](http://localhost:5001/add_incedent): Adds a new incident.

### Telegram Bot

The project includes a Telegram bot for real-time alerts and system monitoring. See [TELEGRAM_BOT_README.md](TELEGRAM_BOT_README.md) for detailed setup and usage instructions.

**Quick Start:**
1. Create a bot with [@BotFather](https://t.me/botfather)
2. Copy `configs/telegram_config.example.json` to `configs/telegram_config.json`
3. Add your bot token to the config file
4. Run: `cd backend && python run_telegram_bot.py`

### Stopping the application

To stop the service, run:
```