import numpy as np
import json
import os
from scipy import interpolate

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'WaterConsumptionModel.json')

class ConsumptionDecompositionModel:
    """
    Модель суточного водопотребления
    
    generate_time_series - Генерация временного ряда водопотребления
    generate_smooth_time_series - Генерация сглаженного временного ряда водопотребления
    """
    
    NOISE_LEVEL = 1.5  # Уровень шума для индивидуального отклонения по часам
    
    def __init__(self, model_path=MODEL_PATH):
        """Инициализация модели с предобученными паттернами"""
        json_path = model_path
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.weekday_patterns = {int(k): v for k, v in data['weekday_patterns'].items()}
            self.weekend_patterns = {int(k): v for k, v in data['weekend_patterns'].items()}
        except (FileNotFoundError, json.JSONDecodeError, KeyError) as e:
            print(f"Ошибка загрузки паттернов из {json_path}: {e}")
            self.weekday_patterns = {}
            self.weekend_patterns = {}
    
    def generate_time_series(self, total_consumption, day_of_week, num_points=24):
        """
        Генерация временного ряда водопотребления
        
        Args:
            total_consumption (float): Общее потребление за сутки в м³
            day_of_week (int): День недели (1-7, где 1-Пн, 7-Вс)
            num_points (int): Количество точек от 0 до 23 часов (по умолчанию 24)
        
        Returns:
            numpy.ndarray: Временной ряд потребления
        """
        is_weekend = day_of_week in [5, 6, 7]
        patterns = self.weekend_patterns if is_weekend else self.weekday_patterns
        hours = np.linspace(0, 23, num_points)
        base_pattern = []
        for hour in hours:
            hour_int = int(hour)
            if hour_int in patterns:
                base_pattern.append(patterns[hour_int]['median'])
            else:
                base_pattern.append(0)
        base_pattern = np.array(base_pattern)
        if np.sum(base_pattern) > 0:
            normalized_pattern = base_pattern / np.sum(base_pattern)
        else:
            normalized_pattern = np.ones_like(base_pattern) / len(base_pattern)
        time_series = normalized_pattern * total_consumption
        if len(patterns) > 0:
            avg_std = np.mean([patterns[h]['std'] for h in patterns.keys()])
            if avg_std > 0:
                noise = np.random.normal(0, avg_std * 0.1, len(time_series))
                time_series = np.maximum(0, time_series + noise)
        return time_series
    
    def generate_smooth_time_series(self, total_consumption, day_of_week, num_points=24, individual_noise=None):
        """
        Генерация сглаженного временного ряда с интерполяцией и индивидуальным отклонением
        
        Args:
            total_consumption (float): Общее потребление за сутки в м³
            day_of_week (int): День недели (1-7, где 1-Пн, 7-Вс)
            num_points (int): Количество точек от 0 до 23 часов (по умолчанию 24)
            individual_noise (numpy.ndarray, optional): Индивидуальное отклонение для каждого часа
        
        Returns:
            numpy.ndarray: Сглаженный временной ряд потребления с индивидуальным отклонением
        """
        is_weekend = day_of_week in [5, 6, 7]
        patterns = self.weekend_patterns if is_weekend else self.weekday_patterns
        hours = list(range(24))
        values = []
        for hour in hours:
            if hour in patterns:
                values.append(patterns[hour]['median'])
            else:
                values.append(0)
        
        if np.sum(values) > 0:
            values = np.array(values)
            normalized_values = values / np.sum(values)
            f = interpolate.interp1d(
                hours, 
                normalized_values, 
                kind='cubic', 
                bounds_error=False, 
                fill_value='extrapolate'
            )
            new_hours = np.linspace(0, 23, num_points)
            interpolated_pattern = f(new_hours)
            interpolated_pattern = np.maximum(0, interpolated_pattern)
            if np.sum(interpolated_pattern) > 0:
                interpolated_pattern = interpolated_pattern / np.sum(interpolated_pattern)
            time_series = interpolated_pattern * total_consumption
        else:
            time_series = np.full(num_points, total_consumption/num_points)
        
        if individual_noise is not None:
            if len(individual_noise) == num_points:
                time_series = time_series * (1 + individual_noise / 100)
            else:
                individual_noise = np.random.normal(0, self.NOISE_LEVEL, num_points)
                time_series = time_series * (1 + individual_noise / 100)
        
        return time_series


consumption_decomposition_model = ConsumptionDecompositionModel(model_path=MODEL_PATH)