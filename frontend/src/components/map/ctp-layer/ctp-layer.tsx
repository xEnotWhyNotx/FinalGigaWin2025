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

export const CTPLayer: React.FC<CTPLayerProps> = ({ features, opacity, onCTPClick, onObjectHover  }) => {
  const { filterByAlerts, alerts } = useSelector((state: RootState) => state.alerts);
  
  if (!features.length) return null;

  return (
    <>
      {features.map((feature: GeoJSONFeature, index: number) => {
        if (!isValidFeature(feature)) return null;

        const ctpId = feature.properties?.ctp;
        const alertForCTP = findAlertForObject(alerts, ctpId);
        
        if (filterByAlerts && !alertForCTP) {
          return null;
        }

        const idPart = feature.properties?.id ?? `idx-${index}`;
        const key = `ctp-${idPart}-${index}`;

        if (feature.geometry.type === 'Point') {
          const [lng, lat] = feature.geometry.coordinates as [number, number];
          const coordinates: [number, number] = [lat, lng];

          const hasAlert = !!alertForCTP;
          const severity = alertForCTP ? mapServerLevelToSeverity(alertForCTP.level) : 'medium';
          const pulseColor = getSeverityColor(severity);

          return (
            <React.Fragment key={key}>
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
                    hintContent: `Алерт: ${alertForCTP.level || 'Неизвестный уровень'}`,
                  }}
                  onMouseEnter={(event: any) => onObjectHover?.(feature, event)} // ПЕРЕДАЕМ event
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