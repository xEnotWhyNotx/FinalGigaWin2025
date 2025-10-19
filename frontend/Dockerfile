# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY tsconfig*.json ./

# Устанавливаем зависимости с legacy-peer-deps
RUN npm install --legacy-peer-deps

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Production stage - используем простой сервер на Node.js
FROM node:20-alpine

WORKDIR /app

# Устанавливаем serve для раздачи статических файлов и curl для healthcheck
RUN npm install -g serve && \
    apk add --no-cache curl

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

# Настройка переменной окружения для слушания на всех интерфейсах
ENV HOST=0.0.0.0

EXPOSE 3000

# Запускаем сервер для раздачи статических файлов
CMD ["serve", "-s", "dist", "-l", "3000"]