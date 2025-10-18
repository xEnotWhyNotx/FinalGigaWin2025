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
import { ObjectTooltip } from '../object-tooltip/object-tooltip';

export const YandexMap = forwardRef<any, YandexMapProps>(({
  housesData,
  ctpData,
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
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'house' | 'ctp' | 'pipe'>('house');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const mapInstanceRef = useRef<any>(null);
  
  const { 
    uniqueHouses, 
    uniqueCTP, 
    uniquePipes,
    hasHousesData, 
    hasCTPData,
    hasPipesData 
  } = useMap(housesData, ctpData, pipesData);

  const navigate = useNavigate();
  const { mutate: fetchCTPPressure, data: ctpPressureData, error } = useCTPPressureMutation();

  // Обработчик наведения на объект
  const handleObjectHover = (feature: GeoJSONFeature, type: 'house' | 'ctp' | 'pipe', event: any) => {
    // Получаем координаты мыши
    const mouseX = event.get('clientX');
    const mouseY = event.get('clientY');
    
    setSelectedFeature(feature);
    setSelectedType(type);
    setTooltipPosition({ x: mouseX, y: mouseY });
    setTooltipOpen(true);
  };

  // Обработчик клика по ЦТП (для навигации)
  const handleCTPClick = (feature: GeoJSONFeature) => {
    const ctpId = feature.properties?.ctp;
    const properties = feature.properties;
    
    if (!ctpId) return;

    navigate(`/ctp/${encodeURIComponent(ctpId)}`, { 
      state: { properties } 
    });
  };

  const handleCloseTooltip = () => {
    setTooltipOpen(false);
    setSelectedFeature(null);
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

  useEffect(() => {
  const handleMapClick = () => {
    if (tooltipOpen) {
      setTooltipOpen(false);
    }
  };

  if (mapInstanceRef.current) {
    mapInstanceRef.current.events.add('click', handleMapClick);
  }

  return () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.events.remove('click', handleMapClick);
    }
  };
}, [tooltipOpen]);

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
    <PipesLayer 
      features={uniquePipes} 
      opacity={pipesOpacity}
      onObjectHover={(feature, event) => handleObjectHover(feature, 'pipe', event)} // ДОБАВИТЬ event
    />
    <HousesLayer 
      features={uniqueHouses} 
      opacity={housesOpacity}
      onObjectHover={(feature, event) => handleObjectHover(feature, 'house', event)} // ДОБАВИТЬ event
    />
    <CTPLayer 
      features={uniqueCTP} 
      opacity={ctpOpacity}
      onCTPClick={handleCTPClick}
      onObjectHover={(feature, event) => handleObjectHover(feature, 'ctp', event)} // ДОБАВИТЬ event
    />
  </>
)}
        </Map>
      </YMaps>

      {/* Модалка с информацией об объекте */}
      <ObjectTooltip
        open={tooltipOpen}
        onClose={handleCloseTooltip}
        feature={selectedFeature}
        type={selectedType}
        position={tooltipPosition}
      />

      <LegendPanel show={showLegend} hasPipes={hasPipesData} />
      
      <DataInfoPanel
        show={showDataInfo}
        position="top"
        isLoading={!hasHousesData && !hasCTPData && !hasPipesData}
      />
      
      <DataInfoPanel 
        show={showDataInfo && (hasHousesData || hasPipesData)}
        position="bottom"
        housesCount={housesData?.features?.length}
        ctpCount={ctpData?.features?.length}
        pipesCount={pipesData?.features?.length}
      />
    </div>
  );
});

YandexMap.displayName = 'YandexMap';