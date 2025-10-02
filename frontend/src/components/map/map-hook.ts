import { useMemo } from 'react';

import type { GeoJSONData } from '../../shared/types/map.types';

import { getUniqueFeatures, isValidGeoJSON } from './map.utils';

// map-hook.ts
export const useMap = (
  housesData?: GeoJSONData | null, 
  ctpData?: GeoJSONData | null,
  pipesData?: GeoJSONData | null  // Добавляем pipesData
) => {
  const safeHousesData = housesData || { type: 'FeatureCollection', features: [] };
  const safeCtpData = ctpData || { type: 'FeatureCollection', features: [] };
  const safePipesData = pipesData || { type: 'FeatureCollection', features: [] }; // Новое

  const uniqueHouses = useMemo(() => {
    if (!isValidGeoJSON(safeHousesData)) return [];
    return getUniqueFeatures(safeHousesData.features);
  }, [safeHousesData]);

  const uniqueCTP = useMemo(() => {
    if (!isValidGeoJSON(safeCtpData)) return [];
    return getUniqueFeatures(safeCtpData.features);
  }, [safeCtpData]);

  const uniquePipes = useMemo(() => {  // Новый memo
    if (!isValidGeoJSON(safePipesData)) return [];
    return getUniqueFeatures(safePipesData.features);
  }, [safePipesData]);

  return {
    uniqueHouses,
    uniqueCTP,
    uniquePipes,  // Добавляем в возврат
    hasHousesData: !!housesData && isValidGeoJSON(housesData),
    hasCTPData: !!ctpData && isValidGeoJSON(ctpData),
    hasPipesData: !!pipesData && isValidGeoJSON(pipesData)  // Новое
  };
};