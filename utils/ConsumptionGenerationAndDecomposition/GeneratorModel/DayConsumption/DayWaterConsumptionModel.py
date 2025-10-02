import numpy as np
from catboost import CatBoostRegressor
import traceback
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'catboost_model.cbm')

class GeneratorDayConsumption:

    NOISE_LEVEL = 1.5
    RANDOM_STATE = 42  

    DAY_TO_NUMBER = {
        "Понедельник": 1,
        "Вторник": 2,
        "Среда": 3,
        "Четверг": 4,
        "Пятница": 5,
        "Суббота": 6,
        "Воскресенье": 7

    } 
    
    def __init__(
        self, 
        path
    ) -> None:
        """Инициализация класса"""

        self.model = None
        self.load_model(path)

    
    def load_model(
        self, 
        filepath
    ) -> None:
        """
        Скачиваем модель из файла
        args:
            filepath
        """

        try:
            self.model = CatBoostRegressor()
            self.model.load_model(filepath)
        except:
            print("ОШИБКА СКАЧИВАНИЯ МОДЕЛИ")
            print(traceback.format_exc())

    
    def predict_with_noise(
        self, 
        X
    ) -> np.array:
        """
        Предсказание с индивидуальным шумом для каждого объекта
        args:
            X: признаки для предсказания (DataFrame)
        
        Возвращает:
        - predictions: предсказания с индивидуальным шумом для каждого объекта
        """

        base_predictions = self.model.predict(X)

        # Генерируем индивидуальный шум для каждого объекта
        individual_noise = np.random.normal(
            0, 
            self.NOISE_LEVEL, 
            size=(X.shape[0],)
        )
        
        # Применяем индивидуальное отклонение для каждого объекта
        predictions = base_predictions * (1 + individual_noise / 100)
        
        return predictions


    def generate(
        self, 
        X,
        repeat_for_X,
        date_week_column
    ) -> np.array:
        """
        Предсказание с индивидуальным шумом для каждого объекта
        args:
            X: признаки для предсказания (DataFrame).
            repeat_for_X: количество повторений предсказания
            date_week_column: название столбца с днем недели
        
        Возвращает:
        - predictions: предсказания с индивидуальным шумом для каждого объекта
        """

        predictions = np.array([[], 
                                []])

        # Генерируем индивидуальное отклонение для каждого объекта один раз
        individual_noise = np.random.normal(
            0, 
            self.NOISE_LEVEL, 
            size=(X.shape[0],)
        )

        for _ in range(repeat_for_X):
            base_predictions = self.model.predict(X)
            
            # Применяем индивидуальное отклонение для каждого объекта
            noisy_predictions = base_predictions * (1 + individual_noise / 100)
            
            current_predictions = np.array([X[date_week_column].apply(lambda x: GeneratorDayConsumption.DAY_TO_NUMBER[x]), 
                                            noisy_predictions])
            predictions = np.concatenate([predictions, current_predictions], axis=1)
        
        return predictions


day_consumption_model = GeneratorDayConsumption(path=MODEL_PATH)
