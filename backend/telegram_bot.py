import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters
import pandas as pd

# Импортируем модули проекта
from alert_controller import generate_alerts
from consumption_loader import load_data, get_consumption_for_period_unom, get_consumption_for_period_ctp, load_excedents_data, simulate_real_consumption
from alert_integration import AlertNotifier
from telegram_commands import AdvancedTelegramCommands
from user_auth import auth_manager

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

class TelegramBot:
    def __init__(self, token: str, api_base_url: str = "http://localhost:5001"):
        self.token = token
        self.api_base_url = api_base_url
        self.application = None
        self.ctp_to_unom_map = None
        self.consumption_df = None
        self.excedents_df = None
        self.subscribed_users = set()  # Множество ID подписанных пользователей
        self.alert_notifier = None
        self.advanced_commands = None
        
        # Авторизация пользователей
        self.authorized_users = {}  # {telegram_id: session_info}
        self.auth_pending = {}  # {telegram_id: {'email': ..., 'expires_at': ...}} - ожидающие авторизации
        
    async def initialize_data(self):
        """Инициализация данных при запуске бота"""
        try:
            logger.info("Загрузка данных...")
            # Загружаем данные с утечками
            self.ctp_to_unom_map, self.consumption_df, self.excedents_df = load_data()
            if self.ctp_to_unom_map and self.consumption_df is not None:
                logger.info(f"Данные успешно загружены: {len(self.consumption_df)} записей")
                if not self.excedents_df.empty:
                    logger.info(f"Загружены данные об утечках: {len(self.excedents_df)} записей")
                else:
                    logger.info("Данные об утечках не найдены")
            else:
                logger.error("Не удалось загрузить данные")
                
            # Инициализируем AlertNotifier
            self.alert_notifier = AlertNotifier(self.token, self.api_base_url)
            await self.alert_notifier.initialize_data()
            logger.info("AlertNotifier инициализирован")
            
            # Инициализируем расширенные команды
            self.advanced_commands = AdvancedTelegramCommands(self)
            logger.info("Расширенные команды инициализированы")
            
        except Exception as e:
            logger.error(f"Ошибка при загрузке данных: {e}")

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /start"""
        user = update.effective_user
        welcome_message = f"""
🚰 Добро пожаловать в систему мониторинга водоснабжения, {user.first_name}!

Я помогу вам отслеживать:
• 🔔 Алерты по водоснабжению
• 📊 Статистику потребления
• 🏠 Информацию о домах
• 🗺️ Поиск по координатам

Используйте /help для просмотра всех команд.
        """
        
        await update.message.reply_text(welcome_message)
        
        # Проверяем авторизацию
        user_id = update.effective_user.id
        if user_id not in self.authorized_users:
            await update.message.reply_text(
                "🔐 **Требуется авторизация**\n\n"
                "Для использования бота необходимо зарегистрироваться и войти в систему.\n\n"
                "📝 **Регистрация:**\n"
                "/register email@example.com password Имя Фамилия\n\n"
                "🔑 **Вход:**\n"
                "/login email@example.com password\n\n"
                "📋 **Помощь:**\n"
                "/help",
                parse_mode='Markdown'
            )

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /help"""
        user_id = update.effective_user.id
        
        if user_id not in self.authorized_users:
            help_text = """
📋 **Доступные команды без авторизации:**

🔐 **Авторизация:**
/register - Регистрация нового пользователя
/login - Вход в систему
/help - Показать это сообщение

**Для доступа к остальным функциям необходимо авторизоваться.**
            """
        else:
            help_text = """
📋 **Доступные команды:**

🔔 **Алерты:**
/alerts - Получить текущие алерты
/subscribe - Подписаться на уведомления об алертах
/unsubscribe - Отписаться от уведомлений

🏠 **Поиск и информация:**
/search_house <UNOM> - Найти дом по номеру UNOM
/search_coords <lat> <lon> - Найти дом по координатам
/ctp_info <CTP_ID> - Информация о ЦТП

📊 **Статистика:**
/stats <UNOM> - Статистика потребления дома
/ctp_stats <CTP_ID> - Статистика ЦТП

🔐 **Профиль:**
/profile - Мой профиль
/logout - Выход

🛠️ **Утилиты:**
/status - Статус системы
/help - Показать это сообщение

**Примеры:**
/search_house 12345
/search_coords 55.7558 37.6176
/stats 12345
            """
        
        await update.message.reply_text(help_text, parse_mode='Markdown')

    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик нажатий на кнопки"""
        logger.info(f"Получен update: {update}")
        logger.info(f"Update type: {update.update_id}")
        
        query = update.callback_query
        
        if not query:
            logger.error("Получен update без callback_query")
            return
            
        logger.info(f"Callback query data: {query.data}")
        logger.info(f"From user: {query.from_user.id}")
        
        # Отвечаем на callback query
        await query.answer()
        
        logger.info(f"Обработка кнопки: {query.data}")
        
        try:
            if query.data == "subscribe_alerts":
                user_id = query.from_user.id
                if self.alert_notifier:
                    self.alert_notifier.add_subscriber(user_id)
                    await query.edit_message_text("✅ Вы подписались на уведомления об алертах!")
                else:
                    await query.edit_message_text("❌ Система уведомлений недоступна.")
                    
            elif query.data == "get_alerts":
                logger.info("Запуск получения алертов через кнопку")
                await self.send_current_alerts(query)
                
            elif query.data == "search_house":
                await query.edit_message_text(
                    "🏠 **Поиск дома**\n\n"
                    "Отправьте номер UNOM дома или используйте команду:\n"
                    "`/search_house <UNOM>`\n\n"
                    "**Примеры:**\n"
                    "• `/search_house 12345`\n"
                    "• `/search_coords 55.7558 37.6176`\n"
                    "• `/stats 12345`\n\n"
                    "Или используйте другие команды из /help",
                    parse_mode='Markdown'
                )
                
            elif query.data == "status":
                # Создаем фиктивное сообщение для status_command
                class FakeMessage:
                    def __init__(self, edit_func):
                        self.edit_func = edit_func
                        self.effective_user = query.from_user
                    
                    async def reply_text(self, text, **kwargs):
                        await self.edit_func(text, **kwargs)
                
                fake_message = FakeMessage(query.edit_message_text)
                fake_update = type('obj', (object,), {
                    'message': fake_message,
                    'effective_user': query.from_user
                })
                await self.status_command(fake_update, context)
                
            elif query.data == "health":
                if self.advanced_commands:
                    # Создаем фиктивное сообщение для system_health_command
                    class FakeMessage:
                        def __init__(self, edit_func):
                            self.edit_func = edit_func
                            self.effective_user = query.from_user
                        
                        async def reply_text(self, text, **kwargs):
                            await self.edit_func(text, **kwargs)
                    
                    fake_message = FakeMessage(query.edit_message_text)
                    fake_update = type('obj', (object,), {
                        'message': fake_message,
                        'effective_user': query.from_user
                    })
                    await self.advanced_commands.system_health_command(fake_update, context)
                else:
                    await query.edit_message_text("❌ Расширенные команды недоступны.")
                    
            elif query.data == "help":
                # Создаем фиктивное сообщение для help_command
                class FakeMessage:
                    def __init__(self, edit_func):
                        self.edit_func = edit_func
                        self.effective_user = query.from_user
                    
                    async def reply_text(self, text, **kwargs):
                        await self.edit_func(text, **kwargs)
                
                fake_message = FakeMessage(query.edit_message_text)
                fake_update = type('obj', (object,), {
                    'message': fake_message,
                    'effective_user': query.from_user
                })
                await self.help_command(fake_update, context)
                
                
            else:
                logger.warning(f"Неизвестная кнопка: {query.data}")
                await query.edit_message_text("❌ Неизвестная команда.")
                
        except Exception as e:
            logger.error(f"Ошибка при обработке кнопки {query.data}: {e}")
            await query.edit_message_text("❌ Произошла ошибка при обработке команды.")

    async def debug_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Отладочный обработчик для всех сообщений"""
        logger.info(f"DEBUG: Получено сообщение: {update}")
        if update.callback_query:
            logger.info(f"DEBUG: Callback query: {update.callback_query.data}")
        if update.message:
            logger.info(f"DEBUG: Message text: {update.message.text}")

    async def send_current_alerts(self, query):
        """Отправка текущих алертов"""
        try:
            # Показываем индикатор загрузки
            await query.edit_message_text("🔄 Получение алертов...")
            
            # Получаем алерты через API бэкенда
            response = requests.get(f"{self.api_base_url}/alerts", timeout=10)
            
            if response.status_code != 200:
                await query.edit_message_text("❌ Ошибка при получении алертов от API.")
                return
            
            alerts = response.json()
            
            if not alerts:
                await query.edit_message_text("✅ На данный момент активных алертов нет.")
                return
                
            message = "🚨 **Активные алерты:**\n\n"
            for i, alert in enumerate(alerts[:5], 1):  # Показываем максимум 5 алертов
                level_emoji = {
                    "Критический": "🔴",
                    "Высокий": "🟠", 
                    "Средний": "🟡",
                    "Низкий": "🟢"
                }.get(alert.get('level', ''), '⚪')
                
                message += f"{i}. {level_emoji} **{alert.get('level', 'Неизвестно')}**\n"
                message += f"   🏠 {alert.get('type', 'Неизвестно')} {alert.get('object_id', 'N/A')}\n"
                message += f"   📝 {alert.get('alert_message', 'Нет описания')}\n"
                message += f"   💡 {alert.get('comment', 'Нет комментария')}\n\n"
                
            if len(alerts) > 5:
                message += f"... и еще {len(alerts) - 5} алертов"
                
            await query.edit_message_text(message, parse_mode='Markdown')
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Ошибка при запросе к API: {e}")
            await query.edit_message_text("❌ Ошибка подключения к API. Проверьте, что бэкенд запущен.")
        except Exception as e:
            logger.error(f"Ошибка при получении алертов: {e}")
            await query.edit_message_text("❌ Ошибка при получении алертов. Попробуйте позже.")

    async def alerts_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /alerts"""
        user_id = update.effective_user.id
        
        if user_id not in self.authorized_users:
            await update.message.reply_text(
                "🔐 **Требуется авторизация**\n\n"
                "Используйте команду /login для входа в систему",
                parse_mode='Markdown'
            )
            return
            
        try:
            # Получаем алерты через API бэкенда
            response = requests.get(f"{self.api_base_url}/alerts", timeout=10)
            
            if response.status_code != 200:
                await update.message.reply_text("❌ Ошибка при получении алертов от API.")
                return
            
            alerts = response.json()
            
            if not alerts:
                await update.message.reply_text("✅ На данный момент активных алертов нет.")
                return
                
            message = "🚨 **Активные алерты:**\n\n"
            for i, alert in enumerate(alerts, 1):
                level_emoji = {
                    "Критический": "🔴",
                    "Высокий": "🟠", 
                    "Средний": "🟡",
                    "Низкий": "🟢"
                }.get(alert.get('level', ''), '⚪')
                
                message += f"{i}. {level_emoji} **{alert.get('level', 'Неизвестно')}**\n"
                message += f"   🏠 {alert.get('type', 'Неизвестно')} {alert.get('object_id', 'N/A')}\n"
                message += f"   📝 {alert.get('alert_message', 'Нет описания')}\n"
                message += f"   💡 {alert.get('comment', 'Нет комментария')}\n\n"
                
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Ошибка при запросе к API: {e}")
            await update.message.reply_text("❌ Ошибка подключения к API. Проверьте, что бэкенд запущен.")
        except Exception as e:
            logger.error(f"Ошибка при получении алертов: {e}")
            await update.message.reply_text("❌ Ошибка при получении алертов.")

    async def subscribe_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /subscribe"""
        user_id = update.effective_user.id
        
        if user_id not in self.authorized_users:
            await update.message.reply_text(
                "🔐 **Требуется авторизация**\n\n"
                "Используйте команду /login для входа в систему",
                parse_mode='Markdown'
            )
            return
            
        if self.alert_notifier:
            self.alert_notifier.add_subscriber(user_id)
            await update.message.reply_text("✅ Вы подписались на уведомления об алертах!")
        else:
            await update.message.reply_text("❌ Система уведомлений недоступна.")

    async def unsubscribe_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /unsubscribe"""
        user_id = update.effective_user.id
        
        if user_id not in self.authorized_users:
            await update.message.reply_text(
                "🔐 **Требуется авторизация**\n\n"
                "Используйте команду /login для входа в систему",
                parse_mode='Markdown'
            )
            return
            
        if self.alert_notifier:
            self.alert_notifier.remove_subscriber(user_id)
            await update.message.reply_text("❌ Вы отписались от уведомлений об алертах.")
        else:
            await update.message.reply_text("❌ Система уведомлений недоступна.")

    async def search_house_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /search_house <UNOM>"""
        user_id = update.effective_user.id
        
        if user_id not in self.authorized_users:
            await update.message.reply_text(
                "🔐 **Требуется авторизация**\n\n"
                "Используйте команду /login для входа в систему",
                parse_mode='Markdown'
            )
            return
            
        if not context.args:
            await update.message.reply_text("❌ Укажите номер UNOM дома.\nПример: /search_house 12345")
            return
            
        try:
            unom = int(context.args[0])
            await self.get_house_info(update, unom)
        except ValueError:
            await update.message.reply_text("❌ Неверный формат UNOM. Укажите число.")

    async def search_coords_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /search_coords <lat> <lon>"""
        user_id = update.effective_user.id
        
        if user_id not in self.authorized_users:
            await update.message.reply_text(
                "🔐 **Требуется авторизация**\n\n"
                "Используйте команду /login для входа в систему",
                parse_mode='Markdown'
            )
            return
            
        if len(context.args) != 2:
            await update.message.reply_text("❌ Укажите координаты.\nПример: /search_coords 55.7558 37.6176")
            return
            
        try:
            lat = float(context.args[0])
            lon = float(context.args[1])
            
            # Используем API для поиска дома по координатам
            response = requests.get(f"{self.api_base_url}/house_by_coordinates", 
                                  params={'lat': lat, 'lon': lon, 'timestamp': datetime.now().isoformat()})
            
            if response.status_code == 200:
                data = response.json()
                house_info = data.get('house_info', {})
                stats = data.get('statistics', {})
                
                message = f"🏠 **Найденный дом:**\n\n"
                message += f"📍 UNOM: {house_info.get('unom', 'N/A')}\n"
                message += f"🏢 ЦТП: {house_info.get('ctp', 'N/A')}\n"
                message += f"📊 Текущее потребление: {stats.get('current_real_consumption', 0):.2f} м³/ч\n"
                message += f"📈 Прогноз: {stats.get('current_predicted_consumption', 0):.2f} м³/ч\n"
                message += f"📉 Отклонение: {stats.get('deviation_percentage', 0):.1f}%"
                
                await update.message.reply_text(message, parse_mode='Markdown')
            else:
                await update.message.reply_text("❌ Дом не найден в указанном радиусе.")
                
        except ValueError:
            await update.message.reply_text("❌ Неверный формат координат.")

    async def get_house_info(self, update: Update, unom: int):
        """Получение информации о доме по UNOM"""
        try:
            if not self.consumption_df is None:
                # Получаем данные за последние 24 часа
                end_ts = pd.Timestamp.now()
                start_ts = end_ts - pd.Timedelta(hours=24)
                
                consumption_data = await get_consumption_for_period_unom(
                    unom, start_ts, end_ts, self.consumption_df, excedents_df=self.excedents_df
                )
                
                if consumption_data.empty:
                    await update.message.reply_text(f"❌ Данные для дома {unom} не найдены.")
                    return
                
                # Находим ЦТП для этого дома
                ctp_name = None
                for ctp, unoms in self.ctp_to_unom_map.items():
                    if unom in unoms:
                        ctp_name = ctp
                        break
                
                # Статистика
                real_values = consumption_data['реальный']
                predicted_values = consumption_data['прогноз']
                
                message = f"🏠 **Дом {unom}**\n\n"
                message += f"🏢 ЦТП: {ctp_name or 'Неизвестно'}\n"
                message += f"📊 Текущее потребление: {real_values.iloc[-1]:.2f} м³/ч\n"
                message += f"📈 Прогноз: {predicted_values.iloc[-1]:.2f} м³/ч\n"
                message += f"📉 Среднее потребление: {real_values.mean():.2f} м³/ч\n"
                message += f"📊 Максимум: {real_values.max():.2f} м³/ч\n"
                message += f"📊 Минимум: {real_values.min():.2f} м³/ч\n"
                message += f"📈 Отклонение от прогноза: {((real_values - predicted_values).mean() / predicted_values.mean() * 100):.1f}%"
                
                await update.message.reply_text(message, parse_mode='Markdown')
            else:
                await update.message.reply_text("❌ Данные не загружены.")
                
        except Exception as e:
            logger.error(f"Ошибка при получении информации о доме {unom}: {e}")
            await update.message.reply_text("❌ Ошибка при получении информации о доме.")

    async def stats_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /stats <UNOM>"""
        user_id = update.effective_user.id
        
        if user_id not in self.authorized_users:
            await update.message.reply_text(
                "🔐 **Требуется авторизация**\n\n"
                "Используйте команду /login для входа в систему",
                parse_mode='Markdown'
            )
            return
            
        if not context.args:
            await update.message.reply_text("❌ Укажите номер UNOM дома.\nПример: /stats 12345")
            return
            
        try:
            unom = int(context.args[0])
            await self.get_house_info(update, unom)
        except ValueError:
            await update.message.reply_text("❌ Неверный формат UNOM. Укажите число.")

    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /status"""
        user_id = update.effective_user.id
        
        if user_id not in self.authorized_users:
            await update.message.reply_text(
                "🔐 **Требуется авторизация**\n\n"
                "Используйте команду /login для входа в систему",
                parse_mode='Markdown'
            )
            return
            
        try:
            # Проверяем доступность API
            api_status = "🟢 Доступен"
            try:
                response = requests.get(f"{self.api_base_url}/alerts", timeout=5)
                if response.status_code != 200:
                    api_status = "🟡 Частично доступен"
            except:
                api_status = "🔴 Недоступен"
            
            # Статистика данных
            data_status = "🟢 Загружены" if self.consumption_df is not None else "🔴 Не загружены"
            records_count = len(self.consumption_df) if self.consumption_df is not None else 0
            
            # Статистика подписок
            subscribers_count = self.alert_notifier.get_subscribers_count() if self.alert_notifier else 0
            
            message = f"📊 **Статус системы:**\n\n"
            message += f"🌐 API: {api_status}\n"
            message += f"📊 Данные: {data_status}\n"
            message += f"📈 Записей в БД: {records_count:,}\n"
            message += f"👥 Подписчиков: {subscribers_count}\n"
            message += f"⏰ Время: {datetime.now().strftime('%H:%M:%S')}"
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except Exception as e:
            logger.error(f"Ошибка при получении статуса: {e}")
            await update.message.reply_text("❌ Ошибка при получении статуса.")

    async def send_alert_to_subscribers(self, alert: Dict[str, Any]):
        """Отправка алерта всем подписанным пользователям"""
        if not self.subscribed_users:
            return
            
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
        
        for user_id in self.subscribed_users:
            try:
                await self.application.bot.send_message(
                    chat_id=user_id, 
                    text=message, 
                    parse_mode='Markdown'
                )
            except Exception as e:
                logger.error(f"Ошибка отправки алерта пользователю {user_id}: {e}")

    async def check_and_send_alerts(self):
        """Периодическая проверка и отправка новых алертов"""
        try:
            # Получаем алерты через API бэкенда
            response = requests.get(f"{self.api_base_url}/alerts", timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Ошибка при получении алертов от API: {response.status_code}")
                return
            
            alerts = response.json()
            
            # Здесь можно добавить логику сравнения с предыдущими алертами
            # для отправки только новых алертов
            for alert in alerts:
                await self.send_alert_to_subscribers(alert)
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Ошибка при запросе к API: {e}")
        except Exception as e:
            logger.error(f"Ошибка при проверке алертов: {e}")

    async def login_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /login"""
        user_id = update.effective_user.id
        
        try:
            if len(context.args) != 2:
                await update.message.reply_text(
                    "🔐 **Авторизация**\n\n"
                    "Использование: /login <email> <пароль>\n\n"
                    "Пример:\n"
                    "/login user@example.com mypassword",
                    parse_mode='Markdown'
                )
                return
            
            email = context.args[0]
            password = context.args[1]
            
            # Авторизуемся через API
            auth_response = requests.post(f"{self.api_base_url}/auth/login", 
                                        json={
                                            "email": email,
                                            "password": password,
                                            "telegram_id": user_id
                                        })
            
            if auth_response.status_code == 200:
                data = auth_response.json()
                user_info = data['user']
                
                # Сохраняем информацию об авторизации
                self.authorized_users[user_id] = {
                    'session_token': data['session_token'],
                    'user_info': user_info
                }
                
                await update.message.reply_text(
                    f"✅ **Авторизация успешна!**\n\n"
                    f"👤 **{user_info.get('full_name', 'Пользователь')}**\n"
                    f"📧 Email: {user_info['email']}\n"
                    f"🎭 Роль: {user_info['role']}\n\n"
                    f"Теперь вам доступны все функции бота!",
                    parse_mode='Markdown'
                )
            else:
                error_data = auth_response.json()
                await update.message.reply_text(
                    f"❌ **Ошибка авторизации**\n\n{error_data.get('error', 'Неизвестная ошибка')}",
                    parse_mode='Markdown'
                )
                
        except Exception as e:
            logger.error(f"Ошибка при авторизации: {e}")
            await update.message.reply_text("❌ Ошибка при авторизации. Попробуйте позже.")

    async def register_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /register"""
        try:
            if len(context.args) < 2:
                await update.message.reply_text(
                    "📝 **Регистрация**\n\n"
                    "Использование: /register <email> <пароль> [имя]\n\n"
                    "Пример:\n"
                    "/register user@example.com mypassword Иванов Иван",
                    parse_mode='Markdown'
                )
                return
            
            email = context.args[0]
            password = context.args[1]
            full_name = " ".join(context.args[2:]) if len(context.args) > 2 else ""
            
            # Проверяем длину пароля
            if len(password) < 6:
                await update.message.reply_text(
                    "❌ Пароль должен содержать минимум 6 символов",
                    parse_mode='Markdown'
                )
                return
            
            # Регистрируемся через API
            reg_response = requests.post(f"{self.api_base_url}/auth/register", 
                                       json={
                                           "email": email,
                                           "password": password,
                                           "full_name": full_name
                                       })
            
            if reg_response.status_code == 201:
                await update.message.reply_text(
                    "✅ **Регистрация успешна!**\n\n"
                    f"📧 Email: {email}\n"
                    f"👤 Имя: {full_name or 'Не указано'}\n\n"
                    "Теперь вы можете войти командой /login",
                    parse_mode='Markdown'
                )
            else:
                error_data = reg_response.json()
                await update.message.reply_text(
                    f"❌ **Ошибка регистрации**\n\n{error_data.get('error', 'Неизвестная ошибка')}",
                    parse_mode='Markdown'
                )
                
        except Exception as e:
            logger.error(f"Ошибка при регистрации: {e}")
            await update.message.reply_text("❌ Ошибка при регистрации. Попробуйте позже.")

    async def profile_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /profile"""
        user_id = update.effective_user.id
        
        if user_id not in self.authorized_users:
            await update.message.reply_text(
                "❌ **Вы не авторизованы**\n\n"
                "Используйте команду /login для входа в систему",
                parse_mode='Markdown'
            )
            return
        
        try:
            user_info = self.authorized_users[user_id]['user_info']
            
            await update.message.reply_text(
                f"👤 **Ваш профиль**\n\n"
                f"📧 Email: {user_info['email']}\n"
                f"👤 Имя: {user_info.get('full_name', 'Не указано')}\n"
                f"🎭 Роль: {user_info['role']}\n"
                f"🆔 Telegram ID: {user_id}\n\n"
                f"✅ Статус: Авторизован",
                parse_mode='Markdown'
            )
            
        except Exception as e:
            logger.error(f"Ошибка при получении профиля: {e}")
            await update.message.reply_text("❌ Ошибка при получении профиля.")

    async def logout_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /logout"""
        user_id = update.effective_user.id
        
        if user_id not in self.authorized_users:
            await update.message.reply_text(
                "ℹ️ **Вы уже не авторизованы**",
                parse_mode='Markdown'
            )
            return
        
        try:
            session_token = self.authorized_users[user_id]['session_token']
            
            # Выходим через API
            requests.post(f"{self.api_base_url}/auth/logout",
                         headers={'Authorization': f'Bearer {session_token}'})
            
            # Удаляем из локального кэша
            del self.authorized_users[user_id]
            
            await update.message.reply_text(
                "✅ **Выход выполнен успешно**\n\n"
                "Вы можете снова авторизоваться командой /login",
                parse_mode='Markdown'
            )
            
        except Exception as e:
            logger.error(f"Ошибка при выходе: {e}")
            await update.message.reply_text("❌ Ошибка при выходе.")


    def setup_handlers(self):
        """Настройка обработчиков команд"""
        # Основные команды
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("alerts", self.alerts_command))
        self.application.add_handler(CommandHandler("subscribe", self.subscribe_command))
        self.application.add_handler(CommandHandler("unsubscribe", self.unsubscribe_command))
        self.application.add_handler(CommandHandler("search_house", self.search_house_command))
        self.application.add_handler(CommandHandler("search_coords", self.search_coords_command))
        self.application.add_handler(CommandHandler("stats", self.stats_command))
        self.application.add_handler(CommandHandler("status", self.status_command))
        
        # Команды авторизации
        self.application.add_handler(CommandHandler("login", self.login_command))
        self.application.add_handler(CommandHandler("register", self.register_command))
        self.application.add_handler(CommandHandler("profile", self.profile_command))
        self.application.add_handler(CommandHandler("logout", self.logout_command))
        
        # Расширенные команды
        if self.advanced_commands:
            self.application.add_handler(CommandHandler("ctp_info", self.advanced_commands.ctp_info_command))
            self.application.add_handler(CommandHandler("ctp_stats", self.advanced_commands.ctp_stats_command))
            self.application.add_handler(CommandHandler("compare", self.advanced_commands.compare_houses_command))
            self.application.add_handler(CommandHandler("top_consumers", self.advanced_commands.top_consumers_command))
            self.application.add_handler(CommandHandler("health", self.advanced_commands.system_health_command))
            self.application.add_handler(CommandHandler("export", self.advanced_commands.export_data_command))
            self.application.add_handler(CommandHandler("help_advanced", self.advanced_commands.help_advanced_command))
        
        # Обработчик кнопок
        self.application.add_handler(CallbackQueryHandler(self.button_callback, pattern=None))
        
        # Универсальный обработчик для отладки
        self.application.add_handler(MessageHandler(filters.ALL, self.debug_handler))

    async def run(self):
        """Запуск бота"""
        # Создаем приложение
        self.application = Application.builder().token(self.token).build()
        
        # Инициализируем данные
        await self.initialize_data()
        
        # Настраиваем обработчики
        self.setup_handlers()
        
        # Запускаем бота
        logger.info("Запуск Telegram бота...")
        await self.application.run_polling()
    
    def run_sync(self):
        """Синхронный запуск бота"""
        import asyncio
        
        # Проверяем, есть ли уже запущенный event loop
        try:
            loop = asyncio.get_running_loop()
            # Если есть, создаем новый поток
            import threading
            import concurrent.futures
            
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, self.run())
                future.result()
        except RuntimeError:
            # Нет запущенного event loop, можно использовать asyncio.run
            asyncio.run(self.run())

def main():
    """Главная функция для запуска бота"""
    # Загружаем конфигурацию
    config_path = os.path.join(os.path.dirname(__file__), '..', 'configs', 'telegram_config.json')
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        bot_token = config.get('bot_token')
        if not bot_token:
            logger.error("Токен бота не найден в конфигурации")
            return
            
        # Создаем и запускаем бота
        bot = TelegramBot(bot_token)
        asyncio.run(bot.run())
        
    except FileNotFoundError:
        logger.error(f"Файл конфигурации не найден: {config_path}")
        logger.error("Создайте файл configs/telegram_config.json с токеном бота")
    except json.JSONDecodeError:
        logger.error("Ошибка в формате файла конфигурации")
    except Exception as e:
        logger.error(f"Ошибка при запуске бота: {e}")

if __name__ == '__main__':
    main()
