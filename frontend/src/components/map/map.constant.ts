export const MAP_CONSTANTS = {
  DEFAULT_CENTER: [55.768064, 37.825213] as [number, number],
  DEFAULT_ZOOM: 14,
  ZOOM_RANGE: {
    MIN: 10,
    MAX: 18
  },
  OPACITY: {
    MIN: 0.1,
    MAX: 1,
    STEP: 0.1
  },
  COLORS: {
    HOUSES_FILL: '#3388ff40',
    HOUSES_STROKE: '#3388ff',
    CTP_ICON: '#ff6b35',
    PIPES_STROKE: '#48BB78'  // Новый цвет для труб
  },
  PRESETS: {
    HOUSES: 'islands#blueHomeIcon',
    CTP: 'islands#redEnergyCircleIcon'
  }
};

export const MAP_TEXTS = {
  LEGEND: {
    TITLE: 'Легенда',
    HOUSES: 'Жилые дома',
    CTP: 'ЦТП'
  },
  DATA: {
    LOADING: 'Загрузка данных...',
    PARTIAL_LOADING: 'Часть данных не загружена',
    HOUSES_COUNT: (count: number) => `Загружено домов: ${count}`,
    CTP_COUNT: (count: number) => `Загружено ЦТП: ${count}`,
    PIPES_COUNT: (count: number) => `Труб: ${count}`  // Новый текст
  }
};