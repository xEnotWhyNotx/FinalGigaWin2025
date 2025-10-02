# Build stage
FROM node:18-alpine as builder

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
FROM node:18-alpine

WORKDIR /app

# Устанавливаем serve для раздачи статических файлов и wget для healthcheck
RUN npm install -g serve && \
    apk add --no-cache wget

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Запускаем сервер для раздачи статических файлов
CMD ["serve", "-s", "dist", "-l", "3000"]