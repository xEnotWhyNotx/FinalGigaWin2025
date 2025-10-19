// @ts-nocheck
import { Box, Button, Paper, Typography } from '@mui/material';
import { YandexMap } from '../../components/map/map';
import type { Alert } from '../../shared/types/alert.types';

import { useHome } from '../home/home-hook';
import { HOME_TEXTS, MAP_SETTINGS } from '../home/home.constant';

import styles from './system.module.css'
import { useState } from 'react';
import { SidePanel } from '../../components/side-panel/side-panel';
import { AlertsPanel } from '../../components/alerts-panel/alerts-panel';

type TabType = 'alerts' | 'dashboard';

export const System = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const {     
    housesData,
    ctpData,
    pipesData,
    loading,
    error,
    handleSettingChange,
    mapControls,
    mapSettings,
    mapRef
  } = useHome();

  const handleAlertClick = (alert: Alert) => {
    console.log('Alert clicked:', alert);
  };
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div>{HOME_TEXTS.LOADING}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
  <Typography 
    variant="h2" 
    component="h1"
    sx={{
      fontWeight: 'bold',
      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      fontSize: { xs: '1rem', md: '1.5rem' },
      mb: 1
    }}
  >
    GigaWin 2025 - Water Management System
  </Typography>
  
  <Typography 
    variant="h5"
    component="p"
    sx={{
      color: 'text.secondary',
      fontWeight: 300,
      letterSpacing: '0.5px',
      fontSize: { xs: '1.1rem', md: '1.4rem' },
      maxWidth: '600px',
      lineHeight: 1.4
    }}
  >
    Система управления водоснабжением
  </Typography>
      </div>

      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        minWidth: 0
      }}
        className={styles.mapBox}
      >
        <div className={styles.mapContainer}>
          <YandexMap
            key={mapSettings.mapType}
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

      {/* Красивые табы */}
      <Paper 
        elevation={8} 
        className={styles.tabsContainer}
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: 'fit-content',
          maxHeight: '80vh'
        }}
      >
        {/* Переключатели табов */}
        <Box 
          className={styles.tabsHeader}
          sx={{ 
            display: 'flex', 
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            p: 0.5
          }}
        >
          <Button
            fullWidth
            variant={activeTab === 'alerts' ? 'contained' : 'text'}
            onClick={() => handleTabChange('alerts')}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              py: 1.5,
              borderRadius: 2,
              mx: 0.5,
              bgcolor: activeTab === 'alerts' ? 'primary.main' : 'transparent',
              color: activeTab === 'alerts' ? 'white' : 'text.primary',
              '&:hover': {
                bgcolor: activeTab === 'alerts' ? 'primary.dark' : 'action.hover',
              },
              transition: 'all 0.3s ease'
            }}
            startIcon={
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%',
                  bgcolor: activeTab === 'alerts' ? 'white' : 'error.main',
                  opacity: activeTab === 'alerts' ? 1 : 0.7
                }} 
              />
            }
          >
            Оповещения
          </Button>
          
          <Button
            fullWidth
            variant={activeTab === 'dashboard' ? 'contained' : 'text'}
            onClick={() => handleTabChange('dashboard')}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              py: 1.5,
              borderRadius: 2,
              mx: 0.5,
              bgcolor: activeTab === 'dashboard' ? 'primary.main' : 'transparent',
              color: activeTab === 'dashboard' ? 'white' : 'text.primary',
              '&:hover': {
                bgcolor: activeTab === 'dashboard' ? 'primary.dark' : 'action.hover',
              },
              transition: 'all 0.3s ease'
            }}
            startIcon={
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%',
                  bgcolor: activeTab === 'dashboard' ? 'white' : 'info.main',
                  opacity: activeTab === 'dashboard' ? 1 : 0.7
                }} 
              />
            }
          >
            Дашборд
          </Button>
        </Box>

        {/* Контент табов */}
        <Box 
          className={styles.tabContent}
          sx={{ 
            flex: 1,
            minHeight: 400,
            maxHeight: '70vh',
            overflow: 'auto',
            bgcolor: 'background.default'
          }}
        >
          {activeTab === 'alerts' && (
            <Box sx={{ p: 0 }}>
              <AlertsPanel 
                onAlertClick={handleAlertClick}
                defaultExpanded={true}
              />
            </Box>
          )}

          {activeTab === 'dashboard' && (
            <Box sx={{ p: 2 }}>
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
            </Box>
          )}
        </Box>
      </Paper>
    </div>
  )
}