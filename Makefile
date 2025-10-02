# Makefile для управления GigaWin2025 сервисами

.PHONY: help build start stop restart logs clean all

help: ## Показать справку
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Собрать все контейнеры
	docker-compose build

build-backend: ## Собрать только backend
	docker-compose build backend

build-frontend: ## Собрать только frontend
	docker-compose build frontend

build-telegram: ## Собрать только telegram bot
	docker-compose build telegram-bot

start: ## Запустить все сервисы
	docker-compose up -d

start-backend: ## Запустить только backend
	docker-compose up -d backend

start-frontend: ## Запустить только frontend
	docker-compose up -d frontend

start-telegram: ## Запустить только telegram bot
	docker-compose up -d telegram-bot

stop: ## Остановить все сервисы
	docker-compose down

stop-all: ## Остановить все сервисы и удалить volumes
	docker-compose down -v

restart: ## Перезапустить все сервисы
	docker-compose restart

restart-backend: ## Перезапустить только backend
	docker-compose restart backend

restart-frontend: ## Перезапустить только frontend  
	docker-compose restart frontend

restart-telegram: ## Перезапустить только telegram bot
	docker-compose restart telegram-bot

logs: ## Показать логи всех сервисов
	docker-compose logs -f

logs-backend: ## Показать логи backend
	docker-compose logs -f backend

logs-frontend: ## Показать логи frontend
	docker-compose logs -f frontend

logs-telegram: ## Показать логи telegram bot
	docker-compose logs -f telegram-bot

status: ## Показать статус контейнеров
	docker-compose ps

clean: ## Удалить все контейнеры и images
	docker-compose down --rmi all --volumes --remove-orphans

all: build start ## Полная сборка и запуск (по умолчанию)

dev: ## Запуск в режиме разработки с пересборкой
	docker-compose up --build

frontend-dev: ## Запуск frontend в режиме разработки (без docker)
	cd frontend && npm run dev

backend-dev: ## Запуск backend в режиме разработки
	cd backend && python app.py

telegram-dev: ## Запуск telegram bot в режиме разработки
	cd backend && python run_telegram_bot.py

# Debug commands
debug-frontend: ## Тестирование установки зависимостей frontend
	docker-compose --profile debug build frontend-debug

build-frontend-optimized: ## Сборка frontend с оптимизированным Dockerfile
	docker-compose -f docker-compose.yaml build --build-arg DOCKERFILE=Dockerfile.optimized frontend

build-frontend-yarn: ## Сборка frontend с Yarn
	docker-compose -f docker-compose.yaml build --build-arg DOCKERFILE=Dockerfile.yarn frontend

# Performance monitoring
monitor-build: ## Мориторинг сборки с временными метками
	time docker-compose build frontend --no-cache --progress=plain

# Rollup fix alternatives
build-frontend-force: ## Принудительная установка rollup бинариев
	DOCKERFILE=Dockerfile.force docker-compose build frontend --no-cache

build-frontend-simple: ## Простое решение с готовым образом
	DOCKERFILE=Dockerfile.simple docker-compose build frontend --no-cache

build-frontend-pnpm: ## Сборка с pnpm
	DOCKERFILE=Dockerfile.pnpm docker-compose build frontend --no-cache

build-frontend-fixed: ## Исправленная версия без optional dependencies
	DOCKERFILE=Dockerfile.fixed docker-compose build frontend --no-cache
