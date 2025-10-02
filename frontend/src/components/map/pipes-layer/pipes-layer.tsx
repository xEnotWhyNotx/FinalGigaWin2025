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
}

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

export const PipesLayer: React.FC<PipesLayerProps> = ({ features, opacity }) => {
  const { filterByAlerts, alerts } = useSelector((state: RootState) => state.alerts);
  
  if (!features.length) return null;

  return (
    <>
      {features.map((feature: GeoJSONFeature, index: number) => {
        if (!isValidFeature(feature)) return null;

        const output = feature.properties?.output;
        const alertForPipe = findAlertForObject(alerts, output);
        
        // Фильтрация по алертам
        if (filterByAlerts && !alertForPipe) {
          return null;
        }

        const pipeId = feature.properties?.pipe_id ?? `idx-${index}`;
        const key = `pipe-${pipeId}-${index}`;
        
        // Если есть алерт и фильтр включен, добавляем пульсацию
        const hasAlert = filterByAlerts && alertForPipe;
        const severity = alertForPipe ? mapServerLevelToSeverity(alertForPipe.level) : 'medium';
        const pulseColor = getSeverityColor(severity);

        if (feature.geometry.type === 'LineString') {
          const coordinates = (feature.geometry.coordinates as [number, number][]).map(
            ([lng, lat]) => [lat, lng] as [number, number]
          );

          // Находим середину трубы для пульсации
          const midIndex = Math.floor(coordinates.length / 2);
          const centerCoords = coordinates[midIndex];

          return (
            <React.Fragment key={key}>
              {/* Основной Polyline */}
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
                    hintContent: `Алерт: ${alertForPipe.level || 'Неизвестный уровень'}`,
                  }}
                />
              )}
            </React.Fragment>
          );
        }

        return null;
      })}
    </>
  );
};