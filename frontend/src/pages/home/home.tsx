// @ts-nocheck
// Home.tsx
import React from 'react';

import { 
  Box, 
} from '@mui/material';

import { YandexMap } from '../../components/map/map';

import { useHome } from './home-hook';
import { HOME_TEXTS, MAP_SETTINGS } from './home.constant';
import styles from './home.module.css';
import { AlertsPanel } from '../../components/alerts-panel/alerts-panel';
import type { Alert } from '../../shared/types/alert.types';
import { SidePanel } from '../../components/side-panel/side-panel';

export const Home: React.FC = () => {
  const {     
    housesData,
    ctpData,
    pipesData, // Получаем pipesData
    loading,
    error,
    handleSettingChange,
    mapControls,
    mapSettings,
    mapRef
  } = useHome();

  const handleAlertClick = (alert: Alert) => {
    // Обработка клика по алерту
    console.log('Alert clicked:', alert);
    
    // Можно добавить логику центрирования карты на объекте алерта
    // mapControls.onCenterToCTP() или mapControls.onCenterToHouses()
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div>{HOME_TEXTS.LOADING}</div>
      </div>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* Левая панель - ваша существующая боковая панель */}
      {/* Левая панель - новый компонент */}
      <SidePanel
        mapSettings={mapSettings}
        housesData={housesData}
        ctpData={ctpData}
        pipesData={pipesData}
        onSettingChange={handleSettingChange}
        onZoomOut={mapControls.onZoomOut}
        onZoomIn={mapControls.onZoomIn}
        onResetView={mapControls.onResetView}
        texts={HOME_TEXTS}
        constants={MAP_SETTINGS}
      />

      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        minWidth: 0
      }}>
        <div className={styles.mapContainer} style={{ height: '100%' }}>
          <YandexMap
            ref={mapRef}
            housesData={mapSettings.showHouses ? housesData : null}
            ctpData={mapSettings.showCTP ? ctpData : null}
            pipesData={mapSettings.showPipes ? pipesData : null}
            center={mapSettings.center}
            zoom={mapSettings.zoom}
            mapType={mapSettings.mapType}
            housesOpacity={mapSettings.housesOpacity}
            ctpOpacity={mapSettings.ctpOpacity}
            pipesOpacity={mapSettings.pipesOpacity}
            showLegend={mapSettings.showLegend}
            showDataInfo={mapSettings.showDataInfo}
          />

          {error && (
            <div className={styles.errorOverlay}>
              <div className={styles.errorTitle}>
                {HOME_TEXTS.ERROR.TITLE}
              </div>
              <div className={styles.errorMessage}>
                {error}
              </div>
              <div className={styles.errorNote}>
                {HOME_TEXTS.ERROR.MESSAGE}
              </div>
            </div>
          )}
        </div>
      </Box>

      {/* Правая панель - алерты */}
      <Box sx={{ 
        width: 400, 
        flexShrink: 0,
        zIndex: 100,
        position: 'relative'
      }}>
        <AlertsPanel onAlertClick={handleAlertClick} />
      </Box>
    </Box>
  );
};