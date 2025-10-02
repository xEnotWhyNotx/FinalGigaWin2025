// utils/alert-utils.ts
// Функция для преобразования уровня серьезности
export const mapServerLevelToSeverity = (level: string): 'high' | 'medium' | 'low' => {
  if (!level) return 'medium';
  
  switch (level.toLowerCase()) {
    case 'высокий':
    case 'high':
      return 'high';
    case 'средний':
    case 'medium':
      return 'medium';
    case 'низкий':
    case 'low':
      return 'low';
    default:
      return 'medium';
  }
};

// Функция для получения цвета по уровню серьезности
export const getSeverityColor = (severity: 'high' | 'medium' | 'low'): string => {
  switch (severity) {
    case 'high':
      return '#ff4444'; // Красный
    case 'medium':
      return '#ffaa00'; // Оранжевый
    case 'low':
      return '#0099cc'; // Синий
    default:
      return '#0099cc';
  }
};

// Функция для нормализации ID (убирает .0)
export const normalizeId = (id: string | number): string => {
  if (!id) return '';
  const strId = id.toString();
  return strId.endsWith('.0') ? strId.slice(0, -2) : strId;
};

// Функция для поиска алерта по object_id
export const findAlertForObject = (alerts: any[], objectId: string | number) => {
  const normalizedObjectId = normalizeId(objectId);
  return alerts.find(alert => normalizeId(alert.object_id) === normalizedObjectId);
};