// @ts-nocheck
import React from 'react';
import { useSelector } from 'react-redux';
import { Polyline, Placemark } from '@pbe/react-yandex-maps';
import type { GeoJSONFeature } from '../../../shared/types/map.types';
import { isValidFeature } from '../map.utils';
import { MAP_CONSTANTS } from '../map.constant';
import type { RootState } from '../../../shared/store';
import { findAlertForObject, getSeverityColor, mapServerLevelToSeverity } from '../../../shared/utils/alert-utils';

interface PipesLayerProps {
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

export const createPipeBalloonContent = (properties: any): string => {
  if (!properties) return 'Труба';
  
  return `
    <div style="padding: 8px; max-width: 300px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px;">Труба #${properties.pipe_id}</h3>
      <div style="font-size: 14px;">
        <div><strong>От:</strong> ${properties.input || 'не указан'}</div>
        <div><strong>К дому UNOM:</strong> ${properties.output || 'не указан'}</div>
        <div><strong>Длина:</strong> ${properties.length} м</div>
        <div><strong>Диаметр:</strong> ${properties.diameter} мм</div>
        <div><strong>Материал:</strong> ${properties.material || 'не указан'}</div>
        <div><strong>Год:</strong> ${properties.year || 'не указан'}</div>
        <div><strong>Тип:</strong> ${properties.pipe_tipe || 'не указан'}</div>
      </div>
    </div>
  `;
};

export const PipesLayer: React.FC<PipesLayerProps> = ({ features, opacity, onObjectHover  }) => {
  const { filterByAlerts, alerts } = useSelector((state: RootState) => state.alerts);
  
  if (!features.length) return null;

  return (
    <>
      {features.map((feature: GeoJSONFeature, index: number) => {
        if (!isValidFeature(feature)) return null;

        const output = feature.properties?.output;
        const alertForPipe = findAlertForObject(alerts, output);
        
        if (filterByAlerts && !alertForPipe) {
          return null;
        }

        const pipeId = feature.properties?.pipe_id ?? `idx-${index}`;
        const key = `pipe-${pipeId}-${index}`;
        
        const hasAlert = !!alertForPipe;
        const severity = alertForPipe ? mapServerLevelToSeverity(alertForPipe.level) : 'medium';
        const pulseColor = getSeverityColor(severity);

        if (feature.geometry.type === 'LineString') {
          const coordinates = (feature.geometry.coordinates as [number, number][]).map(
            ([lng, lat]) => [lat, lng] as [number, number]
          );

          const midIndex = Math.floor(coordinates.length / 2);
          const centerCoords = coordinates[midIndex];

          return (
            <React.Fragment key={key}>
              <Polyline
                geometry={coordinates}
                properties={{
                  hintContent: `Труба ${pipeId}`,
                  balloonContent: createPipeBalloonContent(feature.properties)
                }}
                options={{
                  strokeColor: MAP_CONSTANTS.COLORS.PIPES_STROKE,
                  strokeWidth: 3,
                  strokeOpacity: opacity,
                  cursor: 'pointer'
                }}
                 onMouseEnter={(event: any) => onObjectHover?.(feature, event)} // ДОБАВИТЬ ЭТУ СТРОКУ
              />
              
              {/* {hasAlert && (
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
                    hintContent: `Алерт: ${alertForPipe.level || 'Неизвестный уровень'}`,
                  }}
                  onMouseEnter={(event: any) => onObjectHover?.(feature, event)} // ПЕРЕДАЕМ event
                />
              )} */}
            </React.Fragment>
          );
        }

        return null;
      })}
    </>
  );
};