# 🎯 НАЧНИТЕ ЗДЕСЬ!

## Вы хотите запустить проект локально с HTTPS? Вот как:

### ⚡ 3 простых шага:

```bash
# Шаг 1: Запустите Docker Compose
docker-compose up -d --build

# Шаг 2: Откройте браузер
# → https://localhost:3017

# Шаг 3: Примите SSL сертификат
# (Нажмите "Дополнительно" → "Перейти на localhost")
```

### 🎉 Готово!

Ваше приложение работает на **https://localhost:3017**

---

## 📍 Основные адреса

| URL | Описание |
|-----|----------|
| **https://localhost:3017** | 🌐 Главная страница (HTTPS) |
| **https://localhost:3017/api/health** | ✅ Проверка API |
| **http://localhost:3080** | ↗️ Редирект на HTTPS |

---

## 🔍 Как принять SSL сертификат

### Chrome/Edge:
1. Откройте https://localhost:3017
2. Увидите предупреждение "Ваше подключение не защищено"
3. Нажмите **"Дополнительно"**
4. Нажмите **"Перейти на localhost (небезопасно)"**

### Firefox:
1. Откройте https://localhost:3017
2. Увидите "Предупреждение: потенциальная угроза безопасности"
3. Нажмите **"Дополнительно..."**
4. Нажмите **"Принять риск и продолжить"**

⚠️ Это нормально для локальной разработки - мы используем самоподписанный сертификат!

---

## ❓ Не работает?

### Проблема: Не могу подключиться

```bash
# Проверьте статус
docker-compose ps

# Все 3 контейнера должны быть "Up" и "healthy"
```

### Проблема: Порт занят

```bash
# Windows PowerShell - проверьте порт
netstat -ano | findstr :3017

# Остановите другие контейнеры
docker-compose down
```

### Проблема: Backend не отвечает

```bash
# Посмотрите логи
docker-compose logs backend

# Перезапустите backend
docker-compose restart backend
```

### Другие проблемы?

📖 Читайте **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - там 10+ решений частых проблем!

---

## 📚 Хотите узнать больше?

| Документ | Для чего |
|----------|----------|
| **[QUICKSTART.md](QUICKSTART.md)** | Подробный quick start |
| **[LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md)** | Полная инструкция |
| **[HTTPS_SETUP.md](HTTPS_SETUP.md)** | Как работает HTTPS |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Решение проблем |
| **[DOCS_INDEX.md](DOCS_INDEX.md)** | Вся документация |

---

## 🎓 Что делать дальше?

1. ✅ Запустите проект (см. выше)
2. 📖 Изучите функционал приложения
3. 🔧 Читайте логи: `docker-compose logs -f`
4. 🛑 Остановите: `docker-compose down`

---

## 💡 Полезные команды

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Логи (все сервисы)
docker-compose logs -f

# Логи (один сервис)
docker-compose logs -f backend

# Перезапуск
docker-compose restart

# Статус
docker-compose ps

# Проверка API
curl -k https://localhost:3017/api/health
```

---

## 🎨 Архитектура (простыми словами)

```
Вы открываете → https://localhost:3017
                        ↓
                   Nginx (SSL)
                   /          \
                  /            \
         Backend (API)    Frontend (React)
              ↓                  ↓
        База данных        Красивый UI
```

---

## ⚡ Быстрая помощь

**Q: Порт 3017 занят?**  
A: Измените в `docker-compose.yaml`: `"3018:443"`

**Q: Долго запускается?**  
A: Первый раз может занять 2-3 минуты (скачивание образов)

**Q: SSL ошибка?**  
A: Это нормально! Просто примите сертификат (см. инструкцию выше)

**Q: Все сломалось?**  
A: `docker-compose down && docker-compose up -d --build`

---

# 🚀 Все готово! Запускайте и работайте!

```bash
docker-compose up -d --build
```

Затем откройте: **https://localhost:3017**

---

**Вопросы? Проблемы? → [TROUBLESHOOTING.md](TROUBLESHOOTING.md)** 📖

