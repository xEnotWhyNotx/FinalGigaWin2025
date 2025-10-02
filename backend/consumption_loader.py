import os
import json
import sqlite3
import pandas as pd
import numpy as np
import asyncio
from typing import Optional
from datetime import datetime

np.random.seed(42)

def load_excedents_data(csv_path='data/excedents.csv'):
    """
    Загружает данные об утечках из CSV файла.
    """
    try:
        # Если передан относительный путь, делаем его абсолютным
        if not os.path.isabs(csv_path):
            base_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(base_dir, csv_path)
        
        excedents_df = pd.read_csv(csv_path)
        excedents_df['timestamp_start'] = pd.to_datetime(excedents_df['timestamp_start'])
        excedents_df['timestamp_end'] = pd.to_datetime(excedents_df['timestamp_end'])
        return excedents_df
    except FileNotFoundError:
        print(f"Файл {csv_path} не найден. Утечки не будут добавлены.")
        return pd.DataFrame()

def get_leakage_rate_for_timestamp(entity_id, entity_type, timestamp, excedents_df):
    """
    Получает скорость изменения расхода для конкретного объекта (CTP или MCD) в конкретный момент времени.
    
    Возвращает:
    - -1 для полного отключения (значение '-' в CSV)
    - Число (м³/ч) для изменения расхода:
      * Положительное для утечки (для MCD и CTP)
      * Отрицательное для снижения (только для MCD, для CTP игнорируется)
    - 0 для нормальной работы
    
    Примечание: Снижение расхода (отрицательные значения) может происходить только в домах (MCD),
    для ЦТП отрицательные значения игнорируются.
    """
    if excedents_df.empty:
        return 0
    
    timestamp = pd.to_datetime(timestamp)
    
    # Фильтруем утечки по типу и ID
    relevant_excedents = excedents_df[
        (excedents_df['type'] == entity_type) & 
        (excedents_df['id'] == entity_id)
    ]
    
    total_leakage_rate = 0
    has_disconnect = False
    
    for _, excedent in relevant_excedents.iterrows():
        excedent_start = excedent['timestamp_start']
        excedent_end = excedent['timestamp_end']
        
        # Проверяем, попадает ли timestamp в период утечки
        if excedent_start <= timestamp < excedent_end:
            leakage_value = excedent['leakage']
            
            # Проверяем на отключение: значение '-'
            if leakage_value == '-':
                has_disconnect = True
            else:
                # Скорость изменения расхода (м³/ч)
                try:
                    value = float(leakage_value)
                    
                    # Валидация: отрицательные значения (снижение) только для MCD
                    if value < 0 and entity_type == 'ctp':
                        print(f"Предупреждение: игнорируется отрицательное значение {value} для CTP {entity_id}. "
                              f"Снижение расхода возможно только для домов (MCD).")
                        continue
                    
                    total_leakage_rate += value
                except (ValueError, TypeError):
                    pass
    
    # Если есть отключение, возвращаем -1, иначе возвращаем скорость изменения расхода
    return -1 if has_disconnect else total_leakage_rate

def simulate_real_consumption(predicted_series, noise_level=0.02, unom: Optional[int] = None, 
                            start_ts=None, end_ts=None, excedents_df=None):
    """
    Симулирует реальный расход, добавляя пропорциональный Гауссовский шум и утечки.
    Добавляет утечки для MCD (многоквартирных домов) если данные об утечках предоставлены.
    
    Поддерживаемые типы изменений:
    - Полное отключение: значение '-' в CSV → расход = 0
    - Изменение расхода: числовое значение в CSV (м³/ч) → добавляется к расходу
    """
    # Set seed for deterministic results based on unom and timestamp
    
    noise = np.random.normal(loc=0, scale=predicted_series * noise_level)
    simulated = predicted_series + noise
    
    # Добавляем утечку для MCD (многоквартирных домов)
    if unom is not None and excedents_df is not None and not excedents_df.empty:
        # Применяем утечку к каждой точке временного ряда
        for timestamp in simulated.index:
            leakage_rate = get_leakage_rate_for_timestamp(str(unom), 'mcd', timestamp, excedents_df)
            
            if leakage_rate == -1:
                # Полное отключение (расход = 0)
                simulated.loc[timestamp] = 0.0
            elif leakage_rate != 0:
                # Добавляем скорость изменения расхода (может быть положительной или отрицательной)
                simulated.loc[timestamp] += leakage_rate
    
    return simulated.clip(lower=0)

async def get_consumption_for_period_unom(unom_id, start_ts, end_ts, df, noise_level=0.025, excedents_df=None):
    """
    Возвращает прогнозируемый и симулированный расход для UNOM за определенный период времени.
    """
    if not df.index.is_monotonic_increasing:
        df = df.sort_index()
        
    period_df = df.loc[start_ts:end_ts]
    unom_df = period_df[period_df['UNOM'] == unom_id]

    if unom_df.empty:
        return pd.DataFrame()

    predicted = unom_df['consumption']
    simulated = simulate_real_consumption(predicted, noise_level, unom=unom_id, 
                                        start_ts=start_ts, end_ts=end_ts, excedents_df=excedents_df)
    
    result_df = pd.DataFrame({'прогноз': predicted, 'реальный': simulated})
    return result_df

async def get_consumption_for_period_ctp(ctp_id, start_ts, end_ts, df, ctp_map, noise_level=0.015, excedents_df=None):
    """
    Возвращает прогнозируемый и симулированный расход для ЦТП, используя get_consumption_for_period_unom.
    """
    unoms_for_ctp = ctp_map.get(ctp_id)
    if not unoms_for_ctp:
        print(f"Внимание: ЦТП с ID '{ctp_id}' не найден.")
        return pd.DataFrame()

    # Используем asyncio.gather для параллельного выполнения
    tasks = [get_consumption_for_period_unom(unom_id, start_ts, end_ts, df, noise_level, excedents_df) for unom_id in unoms_for_ctp]
    all_unom_dfs = await asyncio.gather(*tasks)
    
    valid_dfs = [df for df in all_unom_dfs if not df.empty]

    if not valid_dfs:
        print(f"Внимание: Данные для ЦТП '{ctp_id}' в периоде с '{start_ts}' по '{end_ts}' не найдены.")
        return pd.DataFrame()

    combined_df = pd.concat(valid_dfs)
    total_consumption_df = combined_df.groupby(combined_df.index).sum()

    # Применяем утечки на уровне ЦТП к прогнозному расходу
    if excedents_df is not None and not excedents_df.empty:
        for timestamp in total_consumption_df.index:
            leakage_rate = get_leakage_rate_for_timestamp(ctp_id, 'ctp', timestamp, excedents_df)
            
            if leakage_rate == -1:
                # Полное отключение (расход = 0)
                total_consumption_df.loc[timestamp, 'реальный'] = 0.0
            elif leakage_rate != 0:
                # Добавляем утечку ЦТП к реальному расходу
                total_consumption_df.loc[timestamp, 'реальный'] += leakage_rate

    return total_consumption_df

async def build_ctp_pressure_payload(ctp_id, end_ts, result_df, ctp_points_df):
    """
    Формирует данные о состоянии системы, характеристиках и кривых для ЦТП
    на основе последнего значения расхода и метаданных насосов/труб.

    Параметры:
        ctp_id: идентификатор ЦТП
        end_ts: конечный timestamp периода (используется как текущий момент)
        result_df: DataFrame с колонками 'прогноз' и 'реальный' по времени
        ctp_points_df: DataFrame с метаданными по ЦТП (коэффициенты полиномов и пр.)

    Возвращает:
        dict с ключами: system_state, system_characteristic, cunsumption_data,
        pressure_data, power_data, kpd_data
    """
    ctp_metadata = ctp_points_df[ctp_points_df['ctp'] == ctp_id]
    system_characteristic = ctp_metadata[['pump_name', 'pump_count', 'pump_max_flow', 'pipe_length', 'pipe_diameter']].to_dict(orient='records')[0]

    h_poly_coefs = ctp_metadata[['h1', 'h2', 'h3', 'h4', 'h5']].to_numpy()[0]
    p_poly_coefs = ctp_metadata[['p1', 'p2', 'p3', 'p4', 'p5']].to_numpy()[0]
    kpd_poly_coefs = ctp_metadata[['e1', 'e2', 'e3', 'e4', 'e5']].to_numpy()[0]

    pump_max_flow = ctp_metadata['pump_max_flow'].to_list()[0]
    source_pressure = ctp_metadata['static_pressure'].iloc[0] - ctp_metadata['source_pressure'].iloc[0]

    currect_cons = result_df.loc[end_ts, 'реальный'].round(2)
    pumps_working = min(system_characteristic['pump_count'], max(1, int(np.ceil(currect_cons / (pump_max_flow * 0.666)))))

    Q = np.linspace(0, pump_max_flow, 21).round(2)
    H = np.polyval(h_poly_coefs, Q).round(2)
    P = np.polyval(p_poly_coefs, Q).round(2)
    KPD = np.polyval(kpd_poly_coefs, Q).round(2)

    x_point = currect_cons
    y_point = np.polyval(h_poly_coefs, currect_cons / pumps_working).round(1)

    # Добавляем проверку для предотвращения плохо обусловленной полиномиальной регрессии
    try:
        pipe_cfc = np.polyfit([x_point, 0], [y_point, source_pressure], deg=2)
    except np.linalg.LinAlgError:
        # Если полиномиальная регрессия неудачна, используем линейную интерполяцию
        pipe_cfc = np.polyfit([x_point, 0], [y_point, source_pressure], deg=1)

    pipe_Q = np.linspace(0, x_point, 21)
    pipe_H = np.polyval(pipe_cfc, pipe_Q)

    measured_pressure = np.polyval(h_poly_coefs, currect_cons / pumps_working).round(1)

    consumption_per_pump = currect_cons / pumps_working
    current_power = np.polyval(p_poly_coefs, consumption_per_pump).round(1)

    current_kpd = np.polyval(kpd_poly_coefs, consumption_per_pump).round(1)

    system_state = {
        'current_consumtion': float(currect_cons),
        'pumps_working': int(pumps_working),
        'measured_pressure': float(measured_pressure),
        'current_power': float(current_power * pumps_working),
        'unit_power': float((current_power / consumption_per_pump).round(2)),
        'current_kpd': float(current_kpd)
    }

    cunsumption_data = {
        "predicted": result_df['прогноз'].round(2).tolist(),
        "real": result_df['реальный'].round(2).tolist(),
        "timestamp": result_df.index.strftime('%Y-%m-%d %H:%M:%S').tolist()
    }

    pressure_data = {
        'pump_curve': {
            'pump_consumption': (Q * pumps_working).tolist(),
            'pump_pressure': H.tolist()
        },
        'pipe_curve': {
            'pipe_consumption': pipe_Q.round(2).tolist(),
            'pipe_pressure': pipe_H.round(2).tolist()
        },
        'current_state': {
            'consumption': float(currect_cons.round(2)),
            'pressure': float(measured_pressure.round(2))
        }
    }

    power_data = {
        'pump_curve': {
            'pump_consumption': Q.tolist(),
            'pump_power': P.tolist()
        },
        'current_state': {
            'consumption': float(consumption_per_pump.round(2)),
            'power': float(current_power.round(2))
        }
    }

    kpd_data = {
        'pump_curve': {
            'pump_consumption': Q.tolist(),
            'pump_kpd': KPD.tolist()
        },
        'current_state': {
            'consumption': float(consumption_per_pump.round(2)),
            'kpd': float(current_kpd.round(2))
        }
    }

    response_data = {
        "system_state": system_state,
        "system_characteristic": system_characteristic,
        "cunsumption_data": cunsumption_data,
        "pressure_data": pressure_data,
        "power_data": power_data,
        "kpd_data": kpd_data
    }

    return response_data
# --- Asynchronous versions for concurrent execution ---


def load_data(db_path='data/hak2025.db', map_path='data/ctp_to_unom.json', excedents_path='data/excedents.csv'):
    """
    Загружает карту ЦТП-UNOM, данные о потреблении и данные об утечках.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Используем абсолютные пути по умолчанию
    if db_path is None:
        db_path = os.path.join(base_dir, 'data', 'hak2025.db')
    if map_path is None:
        map_path = os.path.join(base_dir, 'data', 'ctp_to_unom.json')
    if excedents_path is None:
        excedents_path = os.path.join(base_dir, 'data', 'excedents.csv')
    
    # Если передан относительный путь, делаем его абсолютным
    if not os.path.isabs(map_path):
        map_path = os.path.join(base_dir, map_path)
    if not os.path.isabs(db_path):
        db_path = os.path.join(base_dir, db_path)
    # Загрузка карты ЦТП -> UNOM
    with open(map_path, 'r', encoding='utf-8') as f:
        ctp_to_unom_map = json.load(f)

    # Загрузка данных о расходе из БД
    con = sqlite3.connect(db_path)
    try:
        # Попытка загрузить уже очищенную таблицу
        consumption_df = pd.read_sql_query("SELECT date, UNOM, consumption from synt_data", con)
        consumption_df['timestamp'] = pd.to_datetime(consumption_df['date'])
        consumption_df.set_index('timestamp', inplace=True)
    except sqlite3.OperationalError:
        # Загрузка исходной таблицы, если очищенная не найдена
        consumption_df = pd.read_sql_query("SELECT * from synt_data", con)
        consumption_df['timestamp'] = pd.to_datetime(consumption_df['date'].str[:10] + ' ' + consumption_df['time'])
        consumption_df.set_index('timestamp', inplace=True)
    finally:
        con.close()

    consumption_df.sort_index(inplace=True)
    
    # Загрузка данных об утечках
    excedents_df = load_excedents_data(excedents_path)
    
    return ctp_to_unom_map, consumption_df, excedents_df

def load_ctp_points(db_path='data/hak2025.db'):
    """
    Загружает мета-данные о ЦТП.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, db_path)

    con = sqlite3.connect(db_path)
    try:
        ctp_points = pd.read_sql("SELECT * FROM ctp_points;", con)

    except Exception as e:
        print(f"Failed to load CTP points metadata {e}")
        raise e
    finally:
        con.close()
    
    return ctp_points

async def run_tests(ctp_map, df, excedents_df):
    """
    Запускает тестовые примеры для функций симуляции с учетом утечек.
    """
    start_timestamp = '2025-09-05 05:00:00'  # Используем дату из excedents.csv
    end_timestamp = '2025-09-06 05:00:00'
    
    if not ctp_map:
        print("Карта ЦТП пуста, тестирование невозможно.")
        return

    example_ctp = next(iter(ctp_map))

    # Тест для ЦТП с утечками
    ctp_results = await get_consumption_for_period_ctp(example_ctp, start_timestamp, end_timestamp, df, ctp_map, excedents_df=excedents_df)
    print(f"--- Расход для ЦТП '{example_ctp}' с {start_timestamp} по {end_timestamp} (с учетом утечек) ---")
    print(ctp_results)

    # Тест для UNOM с утечками
    if ctp_map.get(example_ctp):
        example_unom = ctp_map[example_ctp][0]
        unom_results = await get_consumption_for_period_unom(example_unom, start_timestamp, end_timestamp, df, excedents_df=excedents_df)
        print(f"\n--- Расход для UNOM '{example_unom}' с {start_timestamp} по {end_timestamp} (с учетом утечек) ---")
        print(unom_results)
    
    # Тест конкретно для данных из excedents.csv
    if not excedents_df.empty:
        print(f"\n--- Тестирование с конкретными данными из excedents.csv ---")
        
        # Тест для MCD 12183 с разными типами изменений
        test_mcd = 12183
        test_start = '2025-09-04 05:00:00'
        test_end = '2025-09-06 18:00:00'
        mcd_test_results = await get_consumption_for_period_unom(test_mcd, test_start, test_end, df, excedents_df=excedents_df)
        print(f"\nРезультаты для MCD {test_mcd}:")
        print("  2025-09-04 05:00-2025-09-05 05:00: +0.35 м³/ч (добавление к расходу)")
        print("  2025-09-05 05:00-2025-09-06 16:00: +1.27 м³/ч (добавление к расходу)")
        print("  2025-09-06 16:00-2025-09-06 18:00: отключение ('-')")
        print(mcd_test_results)
        
        # Тест для MCD 22815 с отрицательным значением (снижение расхода)
        test_mcd_negative = 22815
        test_start_neg = '2025-09-07 17:00:00'
        test_end_neg = '2025-09-07 20:00:00'
        mcd_negative_results = await get_consumption_for_period_unom(test_mcd_negative, test_start_neg, test_end_neg, df, excedents_df=excedents_df)
        print(f"\nРезультаты для MCD {test_mcd_negative} (снижение на -2 м³/ч):")
        print(mcd_negative_results)


if __name__ == "__main__":
    print("Загрузка данных...")
    
    db_path = 'data/hak2025.db'
    map_path = 'data/ctp_to_unom.json'
    excedents_path = 'data/excedents.csv'
    ctp_to_unom_map, consumption_df, excedents_df = load_data(db_path, map_path, excedents_path)
    print("Данные успешно загружены.\n")
    
    if not excedents_df.empty:
        print("Загружены данные об утечках:")
        print(excedents_df)
        print()
    
    print("Запуск тестов...")
    asyncio.run(run_tests(ctp_to_unom_map, consumption_df, excedents_df))
    print("\nТестирование завершено.")
