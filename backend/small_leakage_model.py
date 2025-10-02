"""
Сервис детекции утечек воды в многоквартирных домах
"""

import pandas as pd
import numpy as np
import os
import asyncio
from datetime import datetime
from catboost import CatBoostClassifier
from typing import Dict, Any
from backend import consumption_loader as cl


print("Загрузка данных и модели...")
ctp_to_unom_map, consumption_df, excedents_df = cl.load_data()

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(base_dir, 'backend', 'models', 'catboost_model.cbm')
model = CatBoostClassifier()
model.load_model(model_path)
print("Данные и модель загружены!")


async def analyze_leakage_with_consumption_data(unom: int, start_ts: str, end_ts: str, threshold: float = 0.5) -> Dict[str, Any]:
    """
    Анализ утечек - только инференс:
    1. Получает данные через get_consumption_for_period_unom
    2. Запускает анализ моделью CatBoost
    3. Возвращает результат
    """

    consumption_data = await cl.get_consumption_for_period_unom(
        unom, start_ts, end_ts, consumption_df, excedents_df=excedents_df
    )
    
    if consumption_data.empty:
        return {
            "unom": unom,
            "is_leakage": False,
            "leakage_probability": 0.0,
            "error": "Нет данных о потреблении",
            "timestamp": datetime.now().isoformat()
        }
    
    # Проверяем, достаточно ли данных (минимум 8 часов)
    if len(consumption_data) < 8:
        return {
            "unom": unom,
            "is_leakage": False,
            "leakage_probability": 0.0,
            "error": f"Недостаточно данных: {len(consumption_data)} часов (нужно минимум 8)",
            "data_points": len(consumption_data),
            "timestamp": datetime.now().isoformat()
        }
    
    recent_data = consumption_data.tail(8)
    predicted_values = recent_data['прогноз'].values
    real_values = recent_data['реальный'].values
    features = np.concatenate([predicted_values, real_values]).reshape(1, -1)
    print(features)
    
    probabilities = model.predict_proba(features)
    leakage_prob = float(probabilities[0][1])
    
    return {
        "unom": unom,
        "is_leakage": leakage_prob > threshold,
        "leakage_probability": leakage_prob,
        "threshold": threshold,
        "confidence": "high" if leakage_prob > 0.8 else "medium" if leakage_prob > 0.6 else "low",
        "data_points": len(consumption_data),
        "period": {"start": start_ts, "end": end_ts, "hours": len(consumption_data)},
        "timestamp": datetime.now().isoformat()
    }


async def demo():
    """Демонстрация сервиса детекции утечек"""
    result = await analyze_leakage_with_consumption_data(12183, '2025-09-04 05:00:00', '2025-09-05 05:00:00')
    print(f"Дом {result['unom']}: {'Утечка' if result['is_leakage'] else 'Норма'}")
    print(f"Вероятность: {result['leakage_probability']:.1%}")

if __name__ == "__main__":
    asyncio.run(demo())