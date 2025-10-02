from GeneratorModel.DayConsumption.DayWaterConsumptionModel import day_consumption_model
from GeneratorModel.HoursDecomposition.ConsumptionDecompositionModel import consumption_decomposition_model
import numpy as np
from datetime import timedelta, datetime


ENG_DATE_TO_RUS = {
    "Monday": "Понедельник",
    "Tuesday": "Вторник",
    "Wednesday": "Среда",
    "Thursday": "Четверг",
    "Friday": "Пятница",
    "Saturday": "Суббота",
    "Sunday": "Воскресенье",
}


def generate_pipeline_x_times(
    X, 
    repeat_for_X, 
    date_week_column, 
):

    day_consumption = day_consumption_model.generate(
        X, 
        repeat_for_X, 
        date_week_column
    )

    result = []
    for i in range(day_consumption.shape[1]):
        # Генерируем индивидуальное отклонение для каждого часа для каждого объекта
        individual_hour_noise = np.random.normal(
            0, 
            consumption_decomposition_model.NOISE_LEVEL, 
            size=24  # 24 часа
        )

        hour_consumption = consumption_decomposition_model.generate_smooth_time_series(
            day_consumption[1, i], 
            day_consumption[0, i],
            individual_noise=individual_hour_noise
        )

        result.append(hour_consumption)

    return np.array(result)


def generate_pipeline_for_date_to_date(
    X, 
    date_week_column, 
    date_begin,
    date_end,
):

    result = []
    current_date = date_begin
    while current_date <= date_end:
        current_day_of_week = ENG_DATE_TO_RUS[current_date.strftime('%A')]

        X[date_week_column] = current_day_of_week

        day_consumption = day_consumption_model.generate(
            X, 
            1, 
            date_week_column
        )

        current_date_result = []
        for i in range(day_consumption.shape[1]):
            # Генерируем индивидуальное отклонение для каждого часа для каждого объекта
            individual_hour_noise = np.random.normal(
                0, 
                consumption_decomposition_model.NOISE_LEVEL, 
                size=24  # 24 часа
            )

            hour_consumption = consumption_decomposition_model.generate_smooth_time_series(
                day_consumption[1, i], 
                day_consumption[0, i],
                individual_noise=individual_hour_noise
            )

            current_date_result.append(hour_consumption)

        result.append(current_date_result)
        current_date += timedelta(days=1)


    return np.array(result)