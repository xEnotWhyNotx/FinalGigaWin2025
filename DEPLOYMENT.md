# GigaWin 2025 - Инструкция по деплою в Portainer

## Архитектура

```
Внешний запрос (gigawin.unicorns-group.ru)
    ↓
Автоматический прокси на 10.8.0.17:3017
    ↓
Nginx (HTTPS на порту 443)
    ↓
    ├─→ Frontend (порт 3000) - статические файлы React
    └─→ Backend API (порт 5001 HTTPS) - Flask API
         └─→ Telegram Bot - подключен к Backend API
```

## Требования

- Docker и Docker Compose установлены на сервере
- Portainer доступен и настроен
- VPN настроен на 10.8.0.17
- Домен gigawin.unicorns-group.ru настроен на проксирование

## Деплой в Portainer

### Шаг 1: Создание Stack в Portainer

1. Откройте Portainer Web UI
2. Перейдите в раздел "Stacks"
3. Нажмите "Add stack"
4. Выберите "Git Repository" или "Web editor"

### Шаг 2: Загрузка кода

**Вариант A: Из Git Repository**
```
Repository URL: https://github.com/your-org/GigaWin2025
Reference: main
Compose path: docker-compose.yaml
```

**Вариант B: Web Editor**
- Скопируйте содержимое `docker-compose.yaml`
- Вставьте в Web Editor

### Шаг 3: Environment Variables (опционально)

Можно задать дополнительные переменные окружения:

```env
FLASK_ENV=production
CORS_ALLOWED_ORIGINS=https://gigawin.unicorns-group.ru,https://10.8.0.17:3017,https://10.8.0.17
```

### Шаг 4: Деплой

1. Нажмите "Deploy the stack"
2. Дождитесь завершения сборки и запуска всех сервисов
3. Проверьте статус контейнеров в Portainer

## Проверка работоспособности

### 1. Проверка контейнеров

Все контейнеры должны быть в статусе "Running":
- `gigawin-nginx`
- `gigawin-backend`
- `gigawin-frontend`
- `gigawin-telegram-bot`

### 2. Проверка доступности

**Frontend:**
```bash
curl -k https://gigawin.unicorns-group.ru/
curl -k https://10.8.0.17:3017/
```

**Backend API:**
```bash
curl -k https://gigawin.unicorns-group.ru/api/health
curl -k https://10.8.0.17:3017/api/health
```

**Nginx Health:**
```bash
curl -k https://gigawin.unicorns-group.ru/health
```

### 3. Проверка логов

В Portainer:
1. Выберите контейнер
2. Перейдите в "Logs"
3. Проверьте отсутствие критических ошибок

## Порты

- **3017** → 443 (HTTPS) - основной вход через VPN
- **3080** → 80 (HTTP) - редирект на HTTPS
- Внутренние порты (не экспонированы наружу):
  - Backend: 5001 (HTTPS)
  - Frontend: 3000 (HTTP)

## SSL Сертификаты

Проект использует самоподписанные SSL сертификаты, которые автоматически генерируются при сборке Docker образов:

- **Nginx**: `/etc/nginx/ssl/cert.pem` и `/etc/nginx/ssl/key.pem`
- **Backend**: `/app/ssl/cert.pem` и `/app/ssl/key.pem`

Эти сертификаты используются для внутренней коммуникации между сервисами. Внешний SSL (gigawin.unicorns-group.ru) обрабатывается на уровне вашего прокси-сервера.

## Volumes

Создаются автоматически:
- `backend_data` - данные бекенда (БД, модели)
- `configs_volume` - конфигурационные файлы

## Обновление приложения

### Через Portainer UI

1. Перейдите в "Stacks"
2. Выберите stack "gigawin2025"
3. Нажмите "Update"
4. Выберите "Pull latest image" или обновите конфигурацию
5. Нажмите "Update the stack"

### Через Git (если используется Git repository)

1. Сделайте push изменений в репозиторий
2. В Portainer: Stack → Pull and redeploy

## Troubleshooting

### Проблема: Контейнер не запускается

**Решение:**
1. Проверьте логи контейнера в Portainer
2. Убедитесь, что порты не заняты другими процессами
3. Проверьте наличие всех необходимых файлов

### Проблема: 502 Bad Gateway

**Решение:**
1. Проверьте, что backend и frontend контейнеры запущены
2. Проверьте логи nginx контейнера
3. Убедитесь, что healthcheck проходит успешно

### Проблема: CORS ошибки

**Решение:**
1. Проверьте переменную окружения `CORS_ALLOWED_ORIGINS` в backend
2. Убедитесь, что URL в браузере совпадает с разрешенными origins
3. Проверьте настройки nginx (CORS headers)

### Проблема: SSL сертификат не доверенный

**Решение:**
Это нормально для самоподписанных сертификатов. В браузере нужно добавить исключение безопасности или настроить доверенный SSL на уровне прокси-сервера.

## Мониторинг

### Healthcheck endpoints

- **Nginx**: `https://gigawin.unicorns-group.ru/health`
- **Backend**: `https://gigawin.unicorns-group.ru/api/health`

### Метрики

Проверяйте через Portainer:
- CPU usage
- Memory usage
- Network traffic
- Container restarts

## Безопасность

1. **SSL/TLS**: Все соединения используют HTTPS
2. **CORS**: Настроен whitelist разрешенных origins
3. **Volumes**: Данные изолированы в Docker volumes
4. **Network**: Все контейнеры в изолированной сети `gigawin-network`

## Контакты

При возникновении проблем:
1. Проверьте логи контейнеров
2. Проверьте статус healthcheck
3. Обратитесь к документации проекта

