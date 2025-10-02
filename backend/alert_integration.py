"""
Модуль для интеграции системы алертов с Telegram ботом.
Позволяет отправлять алерты в реальном времени подписанным пользователям.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Set, Optional, Any
import requests
from telegram import Bot
from alert_controller import generate_alerts
from consumption_loader import load_data

logger = logging.getLogger(__name__)

class AlertNotifier:
    """Класс для уведомления о новых алертах через Telegram"""
    
    def __init__(self, bot_token: str, api_base_url: str = "http://localhost:5001"):
        self.bot_token = bot_token
        self.api_base_url = api_base_url
        self.bot = Bot(token=bot_token)
        self.subscribed_users: Set[int] = set()
        self.last_alerts: List[Dict[str, Any]] = []
        self.ctp_to_unom_map = None
        self.consumption_df = None
        
    async def initialize_data(self):
        """Инициализация данных"""
        try:
            logger.info("Загрузка данных для AlertNotifier...")
            self.ctp_to_unom_map, self.consumption_df = load_data()
            if self.ctp_to_unom_map and self.consumption_df is not None:
                logger.info(f"Данные успешно загружены: {len(self.consumption_df)} записей")
            else:
                logger.error("Не удалось загрузить данные")
        except Exception as e:
            logger.error(f"Ошибка при загрузке данных: {e}")

    def add_subscriber(self, user_id: int):
        """Добавить подписчика"""
        self.subscribed_users.add(user_id)
        logger.info(f"Пользователь {user_id} подписался на алерты")

    def remove_subscriber(self, user_id: int):
        """Удалить подписчика"""
        self.subscribed_users.discard(user_id)
        logger.info(f"Пользователь {user_id} отписался от алертов")

    def get_subscribers_count(self) -> int:
        """Получить количество подписчиков"""
        return len(self.subscribed_users)

    async def send_alert_to_user(self, user_id: int, alert: Dict[str, Any]):
        """Отправить алерт конкретному пользователю"""
        try:
            level_emoji = {
                "Критический": "🔴",
                "Высокий": "🟠", 
                "Средний": "🟡",
                "Низкий": "🟢"
            }.get(alert.get('level', ''), '⚪')
            
            message = f"🚨 **Новый алерт!**\n\n"
            message += f"{level_emoji} **{alert.get('level', 'Неизвестно')}**\n"
            message += f"🏠 {alert.get('type', 'Неизвестно')} {alert.get('object_id', 'N/A')}\n"
            message += f"📝 {alert.get('alert_message', 'Нет описания')}\n"
            message += f"💡 {alert.get('comment', 'Нет комментария')}\n"
            message += f"⏰ {datetime.now().strftime('%H:%M:%S')}"
            
            await self.bot.send_message(
                chat_id=user_id, 
                text=message, 
                parse_mode='Markdown'
            )
            logger.info(f"Алерт отправлен пользователю {user_id}")
            
        except Exception as e:
            logger.error(f"Ошибка отправки алерта пользователю {user_id}: {e}")

    async def send_alert_to_all_subscribers(self, alert: Dict[str, Any]):
        """Отправить алерт всем подписчикам"""
        if not self.subscribed_users:
            return
            
        tasks = [self.send_alert_to_user(user_id, alert) for user_id in self.subscribed_users]
        await asyncio.gather(*tasks, return_exceptions=True)

    def _alerts_are_different(self, new_alerts: List[Dict], old_alerts: List[Dict]) -> List[Dict]:
        """Определить новые алерты, сравнивая с предыдущими"""
        if not old_alerts:
            return new_alerts
            
        # Создаем ключи для сравнения алертов
        old_keys = set()
        for alert in old_alerts:
            key = f"{alert.get('type', '')}_{alert.get('object_id', '')}_{alert.get('alert_message', '')}"
            old_keys.add(key)
            
        new_alerts_only = []
        for alert in new_alerts:
            key = f"{alert.get('type', '')}_{alert.get('object_id', '')}_{alert.get('alert_message', '')}"
            if key not in old_keys:
                new_alerts_only.append(alert)
                
        return new_alerts_only

    async def check_and_notify_new_alerts(self):
        """Проверить новые алерты и уведомить подписчиков"""
        try:
            if not self.ctp_to_unom_map or self.consumption_df is None:
                logger.warning("Данные не загружены, пропускаем проверку алертов")
                return
                
            config = {'event_duration_threshold': 4}
            current_alerts = await generate_alerts(
                self.ctp_to_unom_map, 
                self.consumption_df, 
                config=config
            )
            
            # Определяем новые алерты
            new_alerts = self._alerts_are_different(current_alerts, self.last_alerts)
            
            if new_alerts:
                logger.info(f"Обнаружено {len(new_alerts)} новых алертов")
                
                # Отправляем новые алерты всем подписчикам
                for alert in new_alerts:
                    await self.send_alert_to_all_subscribers(alert)
                    
            # Обновляем список последних алертов
            self.last_alerts = current_alerts
            
        except Exception as e:
            logger.error(f"Ошибка при проверке алертов: {e}")

    async def get_current_alerts_summary(self) -> Dict[str, Any]:
        """Получить сводку текущих алертов"""
        try:
            if not self.ctp_to_unom_map or self.consumption_df is None:
                return {"error": "Данные не загружены"}
                
            config = {'event_duration_threshold': 4}
            alerts = await generate_alerts(
                self.ctp_to_unom_map, 
                self.consumption_df, 
                config=config
            )
            
            # Группируем алерты по уровням
            levels_count = {}
            for alert in alerts:
                level = alert.get('level', 'Неизвестно')
                levels_count[level] = levels_count.get(level, 0) + 1
                
            return {
                "total_alerts": len(alerts),
                "levels_count": levels_count,
                "subscribers_count": len(self.subscribed_users),
                "last_check": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Ошибка при получении сводки алертов: {e}")
            return {"error": str(e)}

    async def start_monitoring(self, check_interval: int = 300):
        """Запустить мониторинг алертов"""
        logger.info(f"Запуск мониторинга алертов с интервалом {check_interval} секунд")
        
        while True:
            try:
                await self.check_and_notify_new_alerts()
                await asyncio.sleep(check_interval)
            except Exception as e:
                logger.error(f"Ошибка в цикле мониторинга: {e}")
                await asyncio.sleep(60)  # Ждем минуту перед повтором

# Глобальный экземпляр для использования в других модулях
alert_notifier: Optional[AlertNotifier] = None

def get_alert_notifier() -> Optional[AlertNotifier]:
    """Получить глобальный экземпляр AlertNotifier"""
    return alert_notifier

def initialize_alert_notifier(bot_token: str, api_base_url: str = "http://localhost:5001"):
    """Инициализировать глобальный экземпляр AlertNotifier"""
    global alert_notifier
    alert_notifier = AlertNotifier(bot_token, api_base_url)
    return alert_notifier

async def main():
    """Тестовая функция для проверки работы AlertNotifier"""
    import os
    
    # Загружаем конфигурацию
    config_path = os.path.join(os.path.dirname(__file__), '..', 'configs', 'telegram_config.json')
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        bot_token = config.get('bot_token')
        if not bot_token or bot_token == "YOUR_BOT_TOKEN_HERE":
            logger.error("Токен бота не настроен в конфигурации")
            return
            
        # Создаем и инициализируем notifier
        notifier = AlertNotifier(bot_token)
        await notifier.initialize_data()
        
        # Добавляем тестового подписчика (замените на реальный ID)
        # notifier.add_subscriber(123456789)
        
        # Получаем сводку алертов
        summary = await notifier.get_current_alerts_summary()
        print("Сводка алертов:", json.dumps(summary, indent=2, ensure_ascii=False))
        
        # Запускаем мониторинг (в реальном приложении это будет в отдельном потоке)
        # await notifier.start_monitoring(60)  # Проверка каждую минуту для теста
        
    except FileNotFoundError:
        logger.error(f"Файл конфигурации не найден: {config_path}")
    except Exception as e:
        logger.error(f"Ошибка: {e}")

if __name__ == '__main__':
    asyncio.run(main())
