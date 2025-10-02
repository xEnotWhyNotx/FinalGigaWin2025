"""
Дополнительные команды для Telegram бота.
Расширенный функционал для работы с системой мониторинга водоснабжения.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
import pandas as pd

from consumption_loader import get_consumption_for_period_unom, get_consumption_for_period_ctp, load_excedents_data, simulate_real_consumption

logger = logging.getLogger(__name__)

class AdvancedTelegramCommands:
    """Класс с расширенными командами для Telegram бота"""
    
    def __init__(self, bot_instance):
        self.bot = bot_instance
        
    async def ctp_info_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /ctp_info <CTP_ID> - информация о ЦТП"""
        if not context.args:
            await update.message.reply_text("❌ Укажите ID ЦТП.\nПример: /ctp_info ЦТП-1")
            return
            
        ctp_id = context.args[0]
        
        try:
            # Получаем данные за последние 24 часа
            end_ts = pd.Timestamp.now()
            start_ts = end_ts - pd.Timedelta(hours=24)
            
            consumption_data = await get_consumption_for_period_ctp(
                ctp_id, start_ts, end_ts, 
                self.bot.consumption_df, 
                self.bot.ctp_to_unom_map,
                excedents_df=self.bot.excedents_df
            )
            
            if consumption_data.empty:
                await update.message.reply_text(f"❌ Данные для ЦТП {ctp_id} не найдены.")
                return
            
            # Получаем список домов, подключенных к ЦТП
            connected_houses = self.bot.ctp_to_unom_map.get(ctp_id, [])
            
            # Статистика
            real_values = consumption_data['реальный']
            predicted_values = consumption_data['прогноз']
            
            message = f"🏢 **ЦТП {ctp_id}**\n\n"
            message += f"🏠 Подключено домов: {len(connected_houses)}\n"
            message += f"📊 Текущее потребление: {real_values.iloc[-1]:.2f} м³/ч\n"
            message += f"📈 Прогноз: {predicted_values.iloc[-1]:.2f} м³/ч\n"
            message += f"📉 Среднее потребление: {real_values.mean():.2f} м³/ч\n"
            message += f"📊 Максимум: {real_values.max():.2f} м³/ч\n"
            message += f"📊 Минимум: {real_values.min():.2f} м³/ч\n"
            message += f"📈 Отклонение от прогноза: {((real_values - predicted_values).mean() / predicted_values.mean() * 100):.1f}%\n\n"
            
            if connected_houses:
                message += f"🏠 **Подключенные дома:**\n"
                for i, house in enumerate(connected_houses[:10], 1):  # Показываем первые 10
                    message += f"{i}. UNOM {house}\n"
                if len(connected_houses) > 10:
                    message += f"... и еще {len(connected_houses) - 10} домов"
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except Exception as e:
            logger.error(f"Ошибка при получении информации о ЦТП {ctp_id}: {e}")
            await update.message.reply_text("❌ Ошибка при получении информации о ЦТП.")

    async def ctp_stats_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /ctp_stats <CTP_ID> - статистика ЦТП"""
        if not context.args:
            await update.message.reply_text("❌ Укажите ID ЦТП.\nПример: /ctp_stats ЦТП-1")
            return
            
        ctp_id = context.args[0]
        await self.ctp_info_command(update, context)  # Используем ту же логику

    async def compare_houses_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /compare <UNOM1> <UNOM2> - сравнение двух домов"""
        if len(context.args) != 2:
            await update.message.reply_text("❌ Укажите два номера UNOM.\nПример: /compare 12345 67890")
            return
            
        try:
            unom1 = int(context.args[0])
            unom2 = int(context.args[1])
            
            # Получаем данные за последние 24 часа для обоих домов
            end_ts = pd.Timestamp.now()
            start_ts = end_ts - pd.Timedelta(hours=24)
            
            data1 = await get_consumption_for_period_unom(unom1, start_ts, end_ts, self.bot.consumption_df, excedents_df=self.bot.excedents_df)
            data2 = await get_consumption_for_period_unom(unom2, start_ts, end_ts, self.bot.consumption_df, excedents_df=self.bot.excedents_df)
            
            if data1.empty or data2.empty:
                await update.message.reply_text("❌ Данные для одного из домов не найдены.")
                return
            
            # Статистика для первого дома
            real1 = data1['реальный']
            pred1 = data1['прогноз']
            
            # Статистика для второго дома
            real2 = data2['реальный']
            pred2 = data2['прогноз']
            
            message = f"🏠 **Сравнение домов**\n\n"
            message += f"**Дом {unom1}:**\n"
            message += f"📊 Текущее: {real1.iloc[-1]:.2f} м³/ч\n"
            message += f"📈 Прогноз: {pred1.iloc[-1]:.2f} м³/ч\n"
            message += f"📉 Среднее: {real1.mean():.2f} м³/ч\n"
            message += f"📈 Отклонение: {((real1 - pred1).mean() / pred1.mean() * 100):.1f}%\n\n"
            
            message += f"**Дом {unom2}:**\n"
            message += f"📊 Текущее: {real2.iloc[-1]:.2f} м³/ч\n"
            message += f"📈 Прогноз: {pred2.iloc[-1]:.2f} м³/ч\n"
            message += f"📉 Среднее: {real2.mean():.2f} м³/ч\n"
            message += f"📈 Отклонение: {((real2 - pred2).mean() / pred2.mean() * 100):.1f}%\n\n"
            
            # Сравнение
            diff_current = abs(real1.iloc[-1] - real2.iloc[-1])
            diff_avg = abs(real1.mean() - real2.mean())
            
            message += f"**Сравнение:**\n"
            message += f"📊 Разница в текущем потреблении: {diff_current:.2f} м³/ч\n"
            message += f"📉 Разница в среднем потреблении: {diff_avg:.2f} м³/ч"
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except ValueError:
            await update.message.reply_text("❌ Неверный формат UNOM. Укажите числа.")
        except Exception as e:
            logger.error(f"Ошибка при сравнении домов: {e}")
            await update.message.reply_text("❌ Ошибка при сравнении домов.")

    async def top_consumers_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /top_consumers - топ потребителей по текущему потреблению"""
        try:
            # Получаем текущие данные для всех домов
            current_time = pd.Timestamp.now()
            start_time = current_time - pd.Timedelta(hours=1)
            
            top_consumers = []
            
            # Проверяем первые 50 домов для демонстрации
            sample_houses = list(self.bot.ctp_to_unom_map.keys())[:5]  # Берем первые 5 ЦТП
            all_houses = []
            for ctp in sample_houses:
                all_houses.extend(self.bot.ctp_to_unom_map[ctp][:10])  # По 10 домов с каждого ЦТП
            
            for unom in all_houses[:20]:  # Ограничиваем 20 домами для производительности
                try:
                    data = await get_consumption_for_period_unom(
                        unom, start_time, current_time, self.bot.consumption_df, excedents_df=self.bot.excedents_df
                    )
                    if not data.empty:
                        current_consumption = data['реальный'].iloc[-1]
                        top_consumers.append((unom, current_consumption))
                except:
                    continue
            
            # Сортируем по убыванию потребления
            top_consumers.sort(key=lambda x: x[1], reverse=True)
            
            if not top_consumers:
                await update.message.reply_text("❌ Не удалось получить данные о потреблении.")
                return
            
            message = "🏆 **Топ потребителей (текущее потребление):**\n\n"
            for i, (unom, consumption) in enumerate(top_consumers[:10], 1):
                message += f"{i}. 🏠 UNOM {unom}: {consumption:.2f} м³/ч\n"
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except Exception as e:
            logger.error(f"Ошибка при получении топа потребителей: {e}")
            await update.message.reply_text("❌ Ошибка при получении топа потребителей.")

    async def system_health_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /health - проверка здоровья системы"""
        try:
            health_status = {
                "database": "🔴 Недоступна",
                "api": "🔴 Недоступна", 
                "alerts": "🔴 Недоступна",
                "data_quality": "🔴 Плохое"
            }
            
            # Проверка базы данных
            if self.bot.consumption_df is not None and not self.bot.consumption_df.empty:
                health_status["database"] = "🟢 Доступна"
                
                # Проверка качества данных
                recent_data = self.bot.consumption_df.tail(100)
                if len(recent_data) > 50:
                    health_status["data_quality"] = "🟢 Хорошее"
                elif len(recent_data) > 20:
                    health_status["data_quality"] = "🟡 Удовлетворительное"
            
            # Проверка API
            try:
                response = requests.get(f"{self.bot.api_base_url}/alerts", timeout=5)
                if response.status_code == 200:
                    health_status["api"] = "🟢 Доступна"
            except:
                pass
            
            # Проверка системы алертов
            if self.bot.alert_notifier:
                health_status["alerts"] = "🟢 Работает"
            
            # Статистика
            total_records = len(self.bot.consumption_df) if self.bot.consumption_df is not None else 0
            subscribers = self.bot.alert_notifier.get_subscribers_count() if self.bot.alert_notifier else 0
            
            message = "🏥 **Состояние системы:**\n\n"
            message += f"💾 База данных: {health_status['database']}\n"
            message += f"🌐 API: {health_status['api']}\n"
            message += f"🔔 Алерты: {health_status['alerts']}\n"
            message += f"📊 Качество данных: {health_status['data_quality']}\n\n"
            message += f"📈 Всего записей: {total_records:,}\n"
            message += f"👥 Подписчиков: {subscribers}\n"
            message += f"⏰ Проверка: {datetime.now().strftime('%H:%M:%S')}"
            
            await update.message.reply_text(message, parse_mode='Markdown')
            
        except Exception as e:
            logger.error(f"Ошибка при проверке здоровья системы: {e}")
            await update.message.reply_text("❌ Ошибка при проверке состояния системы.")

    async def export_data_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Команда /export <UNOM> - экспорт данных дома в JSON"""
        if not context.args:
            await update.message.reply_text("❌ Укажите номер UNOM.\nПример: /export 12345")
            return
            
        try:
            unom = int(context.args[0])
            
            # Получаем данные за последние 7 дней
            end_ts = pd.Timestamp.now()
            start_ts = end_ts - pd.Timedelta(days=7)
            
            data = await get_consumption_for_period_unom(unom, start_ts, end_ts, self.bot.consumption_df, excedents_df=self.bot.excedents_df)
            
            if data.empty:
                await update.message.reply_text(f"❌ Данные для дома {unom} не найдены.")
                return
            
            # Подготавливаем данные для экспорта
            export_data = {
                "unom": unom,
                "period": {
                    "start": start_ts.isoformat(),
                    "end": end_ts.isoformat()
                },
                "data": []
            }
            
            for timestamp, row in data.iterrows():
                export_data["data"].append({
                    "timestamp": timestamp.isoformat(),
                    "predicted": float(row['прогноз']),
                    "real": float(row['реальный']),
                    "deviation": float(row['реальный'] - row['прогноз'])
                })
            
            # Создаем JSON файл
            json_data = json.dumps(export_data, indent=2, ensure_ascii=False)
            
            # Отправляем как документ
            from io import BytesIO
            file_buffer = BytesIO()
            file_buffer.write(json_data.encode('utf-8'))
            file_buffer.seek(0)
            
            filename = f"house_{unom}_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            await update.message.reply_document(
                document=file_buffer,
                filename=filename,
                caption=f"📊 Данные дома {unom} за последние 7 дней"
            )
            
        except ValueError:
            await update.message.reply_text("❌ Неверный формат UNOM.")
        except Exception as e:
            logger.error(f"Ошибка при экспорте данных: {e}")
            await update.message.reply_text("❌ Ошибка при экспорте данных.")

    async def help_advanced_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Расширенная справка по командам"""
        help_text = """
🔧 **Расширенные команды:**

🏢 **ЦТП:**
/ctp_info <CTP_ID> - Информация о ЦТП
/ctp_stats <CTP_ID> - Статистика ЦТП

🏠 **Анализ домов:**
/compare <UNOM1> <UNOM2> - Сравнение двух домов
/top_consumers - Топ потребителей

📊 **Данные:**
/export <UNOM> - Экспорт данных дома в JSON
/health - Проверка состояния системы

🔍 **Поиск:**
/search_house <UNOM> - Поиск дома по UNOM
/search_coords <lat> <lon> - Поиск по координатам

📈 **Статистика:**
/stats <UNOM> - Статистика дома
/status - Статус системы

🔔 **Уведомления:**
/subscribe - Подписаться на алерты
/unsubscribe - Отписаться от алертов
/alerts - Получить текущие алерты

**Примеры:**
/ctp_info ЦТП-1
/compare 12345 67890
/export 12345
        """
        await update.message.reply_text(help_text, parse_mode='Markdown')
