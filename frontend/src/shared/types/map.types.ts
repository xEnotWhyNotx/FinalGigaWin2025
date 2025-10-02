export interface MapControls {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onCenterToHouses: () => void;
  onCenterToCTP: () => void;
  onCenterToPipes: () => void;
}

export interface MapSettings {
  center: [number, number];
  zoom: number;
  showHouses: boolean;
  showCTP: boolean;
  housesOpacity: number;
  ctpOpacity: number;
  showLegend: boolean;
  showDataInfo: boolean;
  pipesOpacity: number;
  showPipes: boolean;
  mapType: 'yandex#map' | 'yandex#satellite' | 'yandex#hybrid';
}

// types/map.types.ts
export interface YandexMapProps {
  housesData?: GeoJSONData | null;
  ctpData?: GeoJSONData | null;
  pipesData?: GeoJSONData | null;  // Новый пропс
  center?: [number, number];
  zoom?: number;
  mapType?: string;
  housesOpacity?: number;
  ctpOpacity?: number;
  pipesOpacity?: number;  // Новый параметр
  showLegend?: boolean;
  showDataInfo?: boolean;
}

export interface FeatureProperties {
  address?: string;
  name?: string;
  floors?: number;
  appartments?: number;
  live_area?: number;
  ctp?: string;
  UNOM?: string;
  osm_id?: string;
  capacity?: string;
  status?: string;
  id?: string;
}

export interface Geometry {
  type: 'Point' | 'Polygon' | 'MultiPolygon';
  coordinates: any;
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: FeatureProperties;
  geometry: Geometry;
}

export interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// Добавьте тип для ключей настроек
export type MapSettingsKey = keyof MapSettings;