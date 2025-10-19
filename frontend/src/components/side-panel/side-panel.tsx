// @ts-nocheck
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  Slider,
  Select,
  MenuItem,
  Button,
  ButtonGroup,
  Stack,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Map as MapIcon,
  Layers as LayersIcon,
  ZoomIn,
  ZoomOut,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Whatshot as WhatshotIcon,
  Visibility as VisibilityIcon,
  AccountTree as AccountTreeIcon // Альтернатива для Pipeline
} from '@mui/icons-material';

import styles from './side-panel.module.css'

interface SidePanelProps {
  mapSettings: {
    mapType: string; // ← исправляем тип
    showHouses: boolean;
    showCTP: boolean;
    showPipes: boolean;
    housesOpacity: number;
    ctpOpacity: number;
    pipesOpacity: number;
    zoom: number;
  };
  housesData: any;
  ctpData: any;
  pipesData: any;
  onSettingChange: (key: string, value: any) => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetView: () => void;
  texts: any;
  constants: any;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  mapSettings,
  housesData,
  ctpData,
  pipesData,
  onSettingChange,
  onZoomOut,
  onZoomIn,
  onResetView,
  texts,
  constants
}) => {
  const stats = {
    houses: housesData?.features?.length || 0,
    ctp: ctpData?.features?.length || 0,
    pipes: pipesData?.features?.length || 0
  };

  console.log(mapSettings.mapType, 'MAP TYPE')

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Заголовок */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          bgcolor: 'secondary.main', 
          color: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'white', width: 40, height: 40 }}>
            <MapIcon sx={{ color: 'secondary.main' }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Панель управления
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Настройки карты и слоев
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Быстрая статистика */}
      <Paper elevation={0} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} justifyContent="space-around">
          <Box textAlign="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mx: 'auto', mb: 1 }}>
              <HomeIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              {stats.houses}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Дома
            </Typography>
          </Box>
          
          <Box textAlign="center">
            <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32, mx: 'auto', mb: 1 }}>
              <WhatshotIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              {stats.ctp}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ЦТП
            </Typography>
          </Box>
          
          <Box textAlign="center">
            <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32, mx: 'auto', mb: 1 }}>
              <AccountTreeIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              {stats.pipes}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Трубы
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Контент с прокруткой */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        <Stack spacing={3}>
          {/* Управление картой */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon color="primary" />
              Настройки карты
            </Typography>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Тип карты
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={mapSettings.mapType}
                  onChange={(e) => onSettingChange('mapType', e.target.value)}
                >
                  <MenuItem value="yandex#map">Схема</MenuItem>
                  <MenuItem value="yandex#satellite">Спутник</MenuItem>
                  <MenuItem value="yandex#hybrid">Гибрид</MenuItem>
                </Select>
              </Box>

              {/* <Box>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Масштаб: <Chip label={mapSettings.zoom} size="small" />
                </Typography>
                <Slider
                  value={mapSettings.zoom}
                  min={constants.ZOOM.MIN}
                  max={constants.ZOOM.MAX}
                  onChange={(_, value) => onSettingChange('zoom', value)}
                  valueLabelDisplay="auto"
                  sx={{ mb: 2 }}
                />
                
                <ButtonGroup fullWidth size="small">
                  <Button 
                    onClick={onZoomOut} 
                    startIcon={<ZoomOut />}
                    variant="outlined"
                  >
                    Уменьшить
                  </Button>
                  <Button 
                    onClick={onResetView}
                    variant="outlined"
                  >
                    Сброс
                  </Button>
                  <Button 
                    onClick={onZoomIn} 
                    startIcon={<ZoomIn />}
                    variant="outlined"
                  >
                    Увеличить
                  </Button>
                </ButtonGroup>
              </Box> */}
            </Stack>
          </Paper>

          {/* Слои карты */}
          <Paper className={styles.paper} elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, mt: 0 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LayersIcon color="secondary" />
              Слои карты
            </Typography>

            <List dense sx={{ py: 0 }}>
              {/* Дома */}
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <HomeIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Жилые дома" 
                  secondary={`${stats.houses} объектов`}
                />
                <Switch
                  checked={mapSettings.showHouses}
                  onChange={(e) => onSettingChange('showHouses', e.target.checked)}
                  color="primary"
                />
              </ListItem>
              
              {mapSettings.showHouses && (
                <Box sx={{ pl: 7, pr: 1, pb: 1 }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Прозрачность: {Math.round(mapSettings.housesOpacity * 100)}%
                  </Typography>
                  <Slider
                    value={mapSettings.housesOpacity}
                    min={0.1}
                    max={1}
                    step={0.1}
                    onChange={(_, value) => onSettingChange('housesOpacity', value)}
                    size="small"
                  />
                </Box>
              )}

              {/* ЦТП */}
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <WhatshotIcon color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary="ЦТП" 
                  secondary={`${stats.ctp} объектов`}
                />
                <Switch
                  checked={mapSettings.showCTP}
                  onChange={(e) => onSettingChange('showCTP', e.target.checked)}
                  color="warning"
                />
              </ListItem>
              
              {mapSettings.showCTP && (
                <Box sx={{ pl: 7, pr: 1, pb: 1 }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Прозрачность: {Math.round(mapSettings.ctpOpacity * 100)}%
                  </Typography>
                  <Slider
                    value={mapSettings.ctpOpacity}
                    min={0.1}
                    max={1}
                    step={0.1}
                    onChange={(_, value) => onSettingChange('ctpOpacity', value)}
                    size="small"
                  />
                </Box>
              )}

              {/* Трубы */}
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <AccountTreeIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Сети ГВС" 
                  secondary={`${stats.pipes} объектов`}
                />
                <Switch
                  checked={mapSettings.showPipes}
                  onChange={(e) => onSettingChange('showPipes', e.target.checked)}
                  color="success"
                />
              </ListItem>
              
              {mapSettings.showPipes && (
                <Box sx={{ pl: 7, pr: 1, pb: 1 }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Прозрачность: {Math.round(mapSettings.pipesOpacity * 100)}%
                  </Typography>
                  <Slider
                    value={mapSettings.pipesOpacity}
                    min={0.1}
                    max={1}
                    step={0.1}
                    onChange={(_, value) => onSettingChange('pipesOpacity', value)}
                    size="small"
                  />
                </Box>
              )}
            </List>
          </Paper>

          {/* Легенда */}
          <Paper className={styles.paper} elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VisibilityIcon color="info" />
              Легенда
            </Typography>
            
            <Stack spacing={1.5}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box 
                  width={20} 
                  height={20} 
                  bgcolor="#3388ff40" 
                  border="2px solid #3388ff" 
                  borderRadius={1}
                />
                <Typography variant="body2">
                  Жилые дома
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Box 
                  width={16} 
                  height={16} 
                  bgcolor="#ff6b35" 
                  borderRadius="50%"
                />
                <Typography variant="body2">
                  ЦТП
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Box 
                  width={20} 
                  height={4} 
                  bgcolor="#48BB78" 
                  borderRadius={1}
                />
                <Typography variant="body2">
                  Сети ГВС
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
};