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
  onObjectHover?: (feature: GeoJSONFeature, event: any) => void; // ДОБАВИТЬ event
}

// Функция для создания пульсирующей SVG иконки
const createPulsingIcon = (color: string) => {
  const svg = `
    <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @keyframes pulse {
            0% { transform: scale(0.8); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(0.8); opacity: 1; }
          }
          .pulsing-circle {
            animation: pulse 2s infinite;
            transform-origin: center;
          }
        </style>
      </defs>
      <circle cx="15" cy="15" r="12" fill="${color}" opacity="0.3" class="pulsing-circle"/>
      <circle cx="15" cy="15" r="6" fill="${color}"/>
    </svg>
  `;
  return 'data:image/svg+xml;base64,' + btoa(svg);
};

export const HousesLayer: React.FC<HousesLayerProps> = ({ features, opacity, onObjectHover }) => {
  const { filterByAlerts, alerts } = useSelector((state: RootState) => state.alerts);
  
  if (!features.length) return null;

  return (
    <>
      {features.map((feature: GeoJSONFeature, index: number) => {
        if (!isValidFeature(feature)) return null;

        const unom = feature.properties?.UNOM;
        const alertForHouse = findAlertForObject(alerts, unom);
        
        if (filterByAlerts && !alertForHouse) {
          return null;
        }

        const idPart = unom ?? feature.properties?.osm_id ?? `idx-${index}`;
        const key = `house-${idPart}-${index}`;

        const hasAlert = !!alertForHouse;
        const severity = alertForHouse ? mapServerLevelToSeverity(alertForHouse.level) : 'medium';
        const pulseColor = getSeverityColor(severity);

        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
          try {
            const coordinates = feature.geometry.coordinates as number[][][];
            const firstPoint = coordinates[0]?.[0];
            if (!firstPoint) return null;
            
            const [lng, lat] = firstPoint;
            const centerCoords: [number, number] = [lat, lng];

            return (
              <React.Fragment key={key}>
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
                  onMouseEnter={(event: any) => onObjectHover?.(feature, event)} // ПЕРЕДАЕМ event
                />
                
                {hasAlert && (
                  <Placemark
                    geometry={centerCoords}
                    options={{
                      iconLayout: 'default#image',
                      iconImageHref: createPulsingIcon(pulseColor),
                      iconImageSize: [30, 30],
                      iconImageOffset: [-15, -15],
                      zIndex: 1000,
                      hasBalloon: false,
                      hasHint: true,
                    }}
                    properties={{
                      hintContent: `Алерт: ${alertForHouse.level || 'Неизвестный уровень'}`,
                    }}
                    onMouseEnter={(event: any) => onObjectHover?.(feature, event)} // ПЕРЕДАЕМ event
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
                <Placemark
                  geometry={coordinates}
                  properties={{
                    hintContent: feature.properties?.address || 'Жилой дом',
                    balloonContent: createHouseBalloonContent(feature.properties)
                  }}
                  options={{
                    preset: MAP_CONSTANTS.PRESETS.HOUSES,
                    iconColor: MAP_CONSTANTS.COLORS.HOUSES_STROKE,
                    opacity: opacity
                  }}
                  onMouseEnter={(event: any) => onObjectHover?.(feature, event)} // ПЕРЕДАЕМ event
                />
                
                {hasAlert && (
                  <Placemark
                    geometry={coordinates}
                    options={{
                      iconLayout: 'default#image',
                      iconImageHref: createPulsingIcon(pulseColor),
                      iconImageSize: [30, 30],
                      iconImageOffset: [-15, -15],
                      zIndex: 1000,
                      hasBalloon: false,
                      hasHint: true,
                    }}
                    properties={{
                      hintContent: `Алерт: ${alertForHouse.level || 'Неизвестный уровень'}`,
                    }}
                    onMouseEnter={(event: any) => onObjectHover?.(feature, event)} // ПЕРЕДАЕМ event
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