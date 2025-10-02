// @ts-nocheck
import React from 'react';
import { useSelector } from 'react-redux';
import { Placemark, Polygon } from '@pbe/react-yandex-maps';
import type { GeoJSONFeature } from '../../../shared/types/map.types';
import { flipCoordinates, createHouseBalloonContent, isValidFeature } from '../map.utils';
import { MAP_CONSTANTS } from '../map.constant';
import type { RootState } from '../../../shared/store';
import { findAlertForObject, getSeverityColor, mapServerLevelToSeverity } from '../../../shared/utils/alert-utils';

interface HousesLayerProps {
  features: GeoJSONFeature[];
  opacity: number;
}

export const HousesLayer: React.FC<HousesLayerProps> = ({ features, opacity }) => {
  const { filterByAlerts, alerts } = useSelector((state: RootState) => state.alerts);
  
  if (!features.length) return null;

  return (
    <>
      {features.map((feature: GeoJSONFeature, index: number) => {
        if (!isValidFeature(feature)) return null;

        const unom = feature.properties?.UNOM;
        const alertForHouse = findAlertForObject(alerts, unom);
        
        // Фильтрация по алертам
        if (filterByAlerts && !alertForHouse) {
          return null;
        }

        const idPart = unom ?? feature.properties?.osm_id ?? `idx-${index}`;
        const key = `house-${idPart}-${index}`;

        // Если есть алерт и фильтр включен, добавляем пульсацию
        const hasAlert = filterByAlerts && alertForHouse;
        const severity = alertForHouse ? mapServerLevelToSeverity(alertForHouse.level) : 'medium';
        const pulseColor = getSeverityColor(severity);

        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
          try {
            const coordinates = feature.geometry.coordinates as number[][][];
            
            // Упрощенный расчет центра - берем первую точку первого кольца
            const firstPoint = coordinates[0]?.[0];
            if (!firstPoint) return null;
            
            const [lng, lat] = firstPoint;
            const centerCoords: [number, number] = [lat, lng];

            return (
              <React.Fragment key={key}>
                {/* Основной Polygon */}
                <Polygon
                  geometry={flipCoordinates(coordinates)}
                  options={{
                    fillColor: MAP_CONSTANTS.COLORS.HOUSES_FILL,
                    strokeColor: MAP_CONSTANTS.COLORS.HOUSES_STROKE,
                    strokeWidth: 2,
                    opacity: opacity,
                    cursor: 'pointer'
                  }}
                  properties={{
                    hintContent: feature.properties?.address || 'Жилой дом',
                    balloonContent: createHouseBalloonContent(feature.properties)
                  }}
                />
                
                {/* Пульсирующий круг для алертов */}
                {hasAlert && (
                  <Placemark
                    geometry={centerCoords}
                    options={{
                      preset: 'islands#circleIcon',
                      iconColor: pulseColor,
                      iconGlyph: 'circle',
                      zIndex: 1
                    }}
                    properties={{
                      hintContent: `Алерт: ${alertForHouse.level || 'Неизвестный уровень'}`,
                    }}
                  />
                )}
              </React.Fragment>
            );
          } catch (error) {
            console.error('Error rendering polygon:', error, feature);
            return null;
          }
        }

        if (feature.geometry.type === 'Point') {
          try {
            const [lng, lat] = feature.geometry.coordinates as [number, number];
            const coordinates: [number, number] = [lat, lng];

            return (
              <React.Fragment key={key}>
                {/* Основной Placemark */}
                <Placemark
                  geometry={coordinates}
                  properties={{
                    hintContent: feature.properties?.address || 'Жилой дом',
                    balloonContent: createHouseBalloonContent(feature.properties)
                  }}
                  options={{
                    preset: MAP_CONSTANTS.PRESETS.HOUSES,
                    iconColor: MAP_CONSTANTS.COLORS.HOUSES_STROKE,
                    // @ts-ignore
                    opacity: opacity
                  }}
                />
                
                {/* Пульсирующий круг для алертов */}
                {hasAlert && (
                  <Placemark
                    geometry={coordinates}
                    options={{
                      preset: 'islands#circleIcon',
                      iconColor: pulseColor,
                      iconGlyph: 'circle',
                      zIndex: 1
                    }}
                    properties={{
                      hintContent: `Алерт: ${alertForHouse.level || 'Неизвестный уровень'}`,
                    }}
                  />
                )}
              </React.Fragment>
            );
          } catch (error) {
            console.error('Error rendering point:', error, feature);
            return null;
          }
        }

        return null;
      })}
    </>
  );
};