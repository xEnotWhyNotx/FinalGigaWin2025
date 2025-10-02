// @ts-nocheck
import React from 'react';
import { Placemark } from '@pbe/react-yandex-maps';
import { useSelector } from 'react-redux';
import type { GeoJSONFeature } from '../../../shared/types/map.types';
import { createCTPBalloonContent, isValidFeature } from '../map.utils';
import { MAP_CONSTANTS } from '../map.constant';
import type { RootState } from '../../../shared/store';
import { findAlertForObject, getSeverityColor, mapServerLevelToSeverity } from '../../../shared/utils/alert-utils';

interface CTPLayerProps {
  features: GeoJSONFeature[];
  opacity: number;
  onCTPClick: (feature: GeoJSONFeature) => void;
}

export const CTPLayer: React.FC<CTPLayerProps> = ({ features, opacity, onCTPClick }) => {
  const { filterByAlerts, alerts } = useSelector((state: RootState) => state.alerts);
  
  if (!features.length) return null;

  return (
    <>
      {features.map((feature: GeoJSONFeature, index: number) => {
        if (!isValidFeature(feature)) return null;

        const ctpId = feature.properties?.ctp;
        const alertForCTP = findAlertForObject(alerts, ctpId);
        
        // Фильтрация по алертам
        if (filterByAlerts && !alertForCTP) {
          return null;
        }

        const idPart = feature.properties?.id ?? `idx-${index}`;
        const key = `ctp-${idPart}-${index}`;

        if (feature.geometry.type === 'Point') {
          const [lng, lat] = feature.geometry.coordinates as [number, number];
          const coordinates: [number, number] = [lat, lng];

          // Если есть алерт и фильтр включен, добавляем пульсацию
          const hasAlert = filterByAlerts && alertForCTP;
          const severity = alertForCTP ? mapServerLevelToSeverity(alertForCTP.level) : 'medium';
          const pulseColor = getSeverityColor(severity);

          return (
            <React.Fragment key={key}>
              {/* Основной Placemark */}
              <Placemark
                geometry={coordinates}
                properties={{
                  hintContent: feature.properties?.name || 'ЦТП',
                  balloonContent: createCTPBalloonContent(feature.properties)
                }}
                options={{
                  preset: MAP_CONSTANTS.PRESETS.CTP,
                  iconColor: opacity < 1 ? 
                    `${MAP_CONSTANTS.COLORS.CTP_ICON}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` :
                    MAP_CONSTANTS.COLORS.CTP_ICON,
                  opacity: opacity,
                  iconCaptionMaxWidth: 200
                }}
                onClick={() => onCTPClick(feature)}
              />
              
              {/* Пульсирующий круг для алертов */}
              {hasAlert && (
                <Placemark
                  geometry={coordinates}
                  options={{
                    preset: 'islands#circleIcon', // Используем стандартную иконку круга
                    iconColor: pulseColor,
                    iconGlyph: 'circle', // Добавляем глиф круга
                    zIndex: 1
                  }}
                  properties={{
                    hintContent: `Алерт: ${alertForCTP.level || 'Неизвестный уровень'}`,
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