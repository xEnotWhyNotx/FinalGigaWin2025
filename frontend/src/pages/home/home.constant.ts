export const HOME_TEXTS = {
  LOADING: 'Загрузка карты...',
  ERROR: {
    TITLE: '⚠️ Внимание',
    MESSAGE: 'Карта могла отобразиться частично'
  },
  SIDE_PANEL: {
    TITLE: 'Управление картой',
    DESCRIPTION: 'Настройте отображение элементов на карте',
    MAP_SETTINGS: 'Настройки карты',
    LAYERS: 'Слои',
    LEGEND: 'Легенда',
    DATA_INFO: 'Информация о данных'
  }
};

export const MAP_SETTINGS = {
  ZOOM: {
    MIN: 10,
    MAX: 18,
    DEFAULT: 14
  },
  CENTER: {
    DEFAULT: [55.768064, 37.825213] as [number, number]
  }
};