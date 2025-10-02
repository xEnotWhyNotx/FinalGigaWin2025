// types/alert.types.ts
export interface Alert {
  id?: string; // object_id может быть строкой
  alert_message: string;
  comment: string;
  level: string; // 'Средний', 'Высокий' и т.д.
  object_id: string;
  type: string;
  // Дополнительные поля которые могут быть
  severity?: 'high' | 'medium' | 'low';
  timestamp?: string;
  duration?: number;
}

export interface AlertFilters {
  timestamp: string;
}