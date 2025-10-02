// @ts-nocheck
// map/map.tsx
import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { YMaps, Map } from '@pbe/react-yandex-maps';

import type { YandexMapProps, GeoJSONFeature } from '../../shared/types/map.types'; // Добавил GeoJSONFeature

import styles from './map.module.css';
import { MAP_CONSTANTS } from './map.constant';
import { useMap } from './map-hook';
import { HousesLayer } from './houses-layer/houses-layer';
import { CTPLayer } from './ctp-layer/ctp-layer';
import { PipesLayer } from './pipes-layer/pipes-layer';
import { LegendPanel } from './legend-panel/legend-panel';
import { DataInfoPanel } from './data-info-panel/data-info-panel';
import { useCTPPressureMutation } from '../../shared/hooks/use-ctp-pressure/use-ctp-pressure-mutation';
import { useNavigate } from 'react-router';

export const YandexMap = forwardRef<any, YandexMapProps>(({
  housesData,
  ctpData, // Переименовал ctpData в ctpGeoData чтобы избежать конфликта
  pipesData,
  center = MAP_CONSTANTS.DEFAULT_CENTER,
  zoom = MAP_CONSTANTS.DEFAULT_ZOOM,
  mapType = 'yandex#map',
  housesOpacity = 0.8,
  ctpOpacity = 1.0,
  pipesOpacity = 0.7,
  showLegend = true,
  showDataInfo = true
}, ref) => {
  const [mapReady, setMapReady] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  
  const { 
    uniqueHouses, 
    uniqueCTP, 
    uniquePipes,
    hasHousesData, 
    hasCTPData,
    hasPipesData 
  } = useMap(housesData, ctpData, pipesData); // Используем исходное ctpData здесь

  const navigate = useNavigate();
  // Хук мутации на верхнем уровне карты
  const { mutate: fetchCTPPressure, data: ctpPressureData, error } = useCTPPressureMutation(); // Переименовал data в ctpPressureData

  // Обработчик клика по ЦТП (передаем в CTPLayer)
  const handleCTPClick = (feature: GeoJSONFeature) => {
    const ctpId = feature.properties?.ctp;
    const properties = feature.properties;
    
    if (!ctpId) return;

    // Передаем properties через state навигации
    navigate(`/ctp/${encodeURIComponent(ctpId)}`, { 
      state: { properties } 
    });
  };

  // Логируем данные когда они приходят
  useEffect(() => {
    if (ctpPressureData) {
      console.log('📈 Динамические данные загружены (API):', ctpPressureData);
    }
  }, [ctpPressureData]);

  useEffect(() => {
    if (error) {
      console.log('❌ Ошибка загрузки:', error);
    }
  }, [error]);

  // Используем useImperativeHandle для доступа к методам карты
  useImperativeHandle(ref, () => ({
    setCenter: (newCenter: [number, number]) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(newCenter);
      }
    },
    setZoom: (newZoom: number) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setZoom(newZoom);
      }
    },
    setType: (newType: string) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setType(newType);
      }
    },
    getMap: () => mapInstanceRef.current
  }));

  // Эффект для обновления центра и зума при изменении пропсов
  useEffect(() => {
    if (mapInstanceRef.current && mapReady) {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [center, zoom, mapReady]);

  // Эффект для обновления типа карты
  useEffect(() => {
    if (mapInstanceRef.current && mapReady) {
      mapInstanceRef.current.setType(mapType);
    }
  }, [mapType, mapReady]);

  const handleMapLoad = (ymaps: any, map: any) => {
    mapInstanceRef.current = map;
    setMapReady(true);
  };

  return (
    <div className={styles.mapContainer}>
      <YMaps
        query={{
          lang: 'ru_RU',
          apikey: import.meta.env.VITE_YANDEX_MAP_API_KEY,
          load: 'package.full'
        }}
      >
        <Map
          defaultState={{
            center: center,
            zoom: zoom,
            type: mapType,
            controls: ['zoomControl', 'fullscreenControl']
          }}
          width="100%"
          height="100%"
          modules={['control.ZoomControl', 'control.FullscreenControl', 'control.TypeSelector']}
          onLoad={handleMapLoad}
          instanceRef={mapInstanceRef}
        >
          {mapReady && (
            <>
              <PipesLayer features={uniquePipes} opacity={pipesOpacity} />
              <HousesLayer features={uniqueHouses} opacity={housesOpacity} />
              <CTPLayer 
                features={uniqueCTP} 
                opacity={ctpOpacity}
                onCTPClick={handleCTPClick} // Передаем обработчик
              />
            </>
          )}
        </Map>
      </YMaps>

      <LegendPanel 
        show={showLegend} 
        hasPipes={hasPipesData} 
      />
      
      <DataInfoPanel
        show={showDataInfo}
        position="top"
        isLoading={!hasHousesData && !hasCTPData && !hasPipesData}
      />
      
      <DataInfoPanel 
        show={showDataInfo && (hasHousesData || hasPipesData)}
        position="bottom"
        housesCount={housesData?.features?.length}
        ctpCount={ctpData?.features?.length} // Используем исходное ctpData
        pipesCount={pipesData?.features?.length}
      />
    </div>
  );
});

YandexMap.displayName = 'YandexMap';