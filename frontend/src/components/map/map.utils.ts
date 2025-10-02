import type { GeoJSONData, GeoJSONFeature } from "../../shared/types/map.types";


export const isValidGeoJSON = (data: any): data is GeoJSONData => {
  return data &&
         data.type === 'FeatureCollection' &&
         Array.isArray(data.features);
};

export const isValidFeature = (feature: any): feature is GeoJSONFeature => {
  return feature &&
         feature.type === 'Feature' &&
         feature.geometry &&
         feature.geometry.coordinates;
};

export const flipCoordinates = (coords: any): any => {
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return [coords[1], coords[0]];
  } else if (Array.isArray(coords)) {
    return coords.map(flipCoordinates);
  }
  return coords;
};

export const getFeatureId = (feature: GeoJSONFeature): string => {
  return feature.properties?.UNOM ??
         feature.properties?.osm_id ??
         feature.properties?.id ??
         `coords-${JSON.stringify(feature.geometry.coordinates)}`;
};

export const createHouseBalloonContent = (properties: any): string => {
  if (!properties) return '<div>Нет информации</div>';

  return `
    <div style="padding: 8px; max-width: 250px;">
      <h3 style="margin: 0 0 8px 0; color: #3388ff;">Жилой дом</h3>
      <p style="margin: 4px 0;"><strong>Адрес:</strong> ${properties.address || 'Не указан'}</p>
      ${properties.floors ? `<p style="margin: 4px 0;"><strong>Этажность:</strong> ${properties.floors}</p>` : ''}
      ${properties.appartments ? `<p style="margin: 4px 0;"><strong>Квартир:</strong> ${properties.appartments}</p>` : ''}
      ${properties.live_area ? `<p style="margin: 4px 0;"><strong>Жилая площадь:</strong> ${properties.live_area} м²</p>` : ''}
      ${properties.ctp ? `<p style="margin: 4px 0;"><strong>ЦТП:</strong> ${properties.ctp}</p>` : ''}
      ${properties.UNOM ? `<p style="margin: 4px 0;"><strong>UNOM:</strong> ${properties.UNOM}</p>` : ''}
    </div>
  `;
};

// map.utils.ts
export const createCTPBalloonContent = (properties: any): string => {
  // console.log('CTP Properties for balloon:', properties); // Для отладки
  
  if (!properties) return '<div>Нет информации</div>';

  const {
    ctp,
    source_pressure,
    static_pressure,
    max_flow,
    max_pressure,
    pump_count,
    pump_name,
    pump_max_flow,
    pipe_length,
    pipe_diameter
  } = properties;

  return `
    <div style="padding: 12px; max-width: 300px; font-family: Arial, sans-serif;">
      <h3 style="margin: 0 0 12px 0; color: #ff6b35; border-bottom: 1px solid #eee; padding-bottom: 8px;">
        🏭 ЦТП: ${ctp || 'Не указан'}
      </h3>
      
      <div style="margin-bottom: 8px;">
        <strong>Давление:</strong><br/>
        <span style="font-size: 12px;">• Источник: ${source_pressure || 'Н/Д'} м</span><br/>
        <span style="font-size: 12px;">• Статическое: ${static_pressure || 'Н/Д'} м</span><br/>
        <span style="font-size: 12px;">• Максимальное: ${max_pressure ? max_pressure.toFixed(2) : 'Н/Д'} м</span>
      </div>
      
      <div style="margin-bottom: 8px;">
        <strong>Расход:</strong><br/>
        <span style="font-size: 12px;">• Максимальный: ${max_flow ? max_flow.toFixed(2) : 'Н/Д'} м³/ч</span>
      </div>
      
      ${pump_count ? `
      <div style="margin-bottom: 8px;">
        <strong>Насосы:</strong><br/>
        <span style="font-size: 12px;">• Количество: ${pump_count} шт</span><br/>
        ${pump_name ? `<span style="font-size: 12px;">• Модель: ${pump_name}</span><br/>` : ''}
        ${pump_max_flow ? `<span style="font-size: 12px;">• Макс. расход: ${pump_max_flow} м³/ч</span>` : ''}
      </div>
      ` : ''}
      
      ${pipe_length || pipe_diameter ? `
      <div style="margin-bottom: 8px;">
        <strong>Трубопровод:</strong><br/>
        ${pipe_length ? `<span style="font-size: 12px;">• Длина: ${pipe_length} м</span><br/>` : ''}
        ${pipe_diameter ? `<span style="font-size: 12px;">• Диаметр: ${pipe_diameter} мм</span>` : ''}
      </div>
      ` : ''}
    </div>
  `;
};

export const getUniqueFeatures = (features: GeoJSONFeature[]): GeoJSONFeature[] => {
  const seen = new Set<string>();
  const result: GeoJSONFeature[] = [];

  features.forEach((feature: GeoJSONFeature) => {
    if (!isValidFeature(feature)) return;

    const keyId = getFeatureId(feature);

    if (!seen.has(keyId)) {
      seen.add(keyId);
      result.push(feature);
    }
  });

  return result;
};