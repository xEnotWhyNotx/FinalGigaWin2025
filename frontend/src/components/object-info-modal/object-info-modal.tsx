// @ts-nocheck
// components/object-info-modal/object-info-modal.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
  Grid
} from '@mui/material';
import {
  Home,
  Plumbing,
  ElectricBolt,
  LocationOn
} from '@mui/icons-material';

interface ObjectInfoModalProps {
  open: boolean;
  onClose: () => void;
  feature: any;
  type: 'house' | 'ctp' | 'pipe';
}

export const ObjectInfoModal: React.FC<ObjectInfoModalProps> = ({
  open,
  onClose,
  feature,
  type
}) => {
  if (!feature) return null;

  const properties = feature.properties || {};
  const geometry = feature.geometry || {};

  const renderHouseInfo = () => (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" gap={1}>
        <Home color="primary" />
        <Typography variant="h6" fontWeight="bold">
          Жилой дом
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {properties.address || 'Адрес не указан'}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>UNOM:</strong>
          </Typography>
          <Chip label={properties.UNOM || 'Не указан'} size="small" variant="outlined" />
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>ЦТП:</strong>
          </Typography>
          <Chip label={properties.ctp || 'Не указан'} size="small" color="primary" />
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>Этажи:</strong>
          </Typography>
          <Typography variant="body1">{properties.floors || 'Не указано'}</Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>Секции:</strong>
          </Typography>
          <Typography variant="body1">{properties.sections || 'Не указано'}</Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>Квартиры:</strong>
          </Typography>
          <Typography variant="body1">{properties.appartments || 'Не указано'}</Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>Жилая площадь:</strong>
          </Typography>
          <Typography variant="body1">
            {properties.live_area ? `${properties.live_area} м²` : 'Не указано'}
          </Typography>
        </Grid>
      </Grid>
    </Stack>
  );

  const renderCTPInfo = () => (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" gap={1}>
        <ElectricBolt color="secondary" />
        <Typography variant="h6" fontWeight="bold">
          Центральный тепловой пункт
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Chip 
            label={properties.ctp || 'ID не указан'} 
            color="secondary" 
            size="medium" 
          />
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>Давление источника:</strong>
          </Typography>
          <Typography variant="body1">
            {properties.source_pressure ? `${properties.source_pressure} бар` : 'Не указано'}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>Статическое давление:</strong>
          </Typography>
          <Typography variant="body1">
            {properties.static_pressure ? `${properties.static_pressure} бар` : 'Не указано'}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.Secondary">
            <strong>Макс. расход:</strong>
          </Typography>
          <Typography variant="body1">
            {properties.max_flow ? `${properties.max_flow.toFixed(2)} м³/ч` : 'Не указано'}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>Количество насосов:</strong>
          </Typography>
          <Typography variant="body1">{properties.pump_count || 'Не указано'}</Typography>
        </Grid>
        
        {properties.pump_name && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              <strong>Модель насоса:</strong>
            </Typography>
            <Typography variant="body1">{properties.pump_name}</Typography>
          </Grid>
        )}
      </Grid>
    </Stack>
  );

  const renderPipeInfo = () => (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" gap={1}>
        <Plumbing color="info" />
        <Typography variant="h6" fontWeight="bold">
          Тепловая труба
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Chip 
            label={`Труба #${properties.pipe_id || 'Не указан'}`} 
            color="info" 
            size="medium" 
          />
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>От ЦТП:</strong>
          </Typography>
          <Chip label={properties.input || 'Не указан'} size="small" variant="outlined" />
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>К дому UNOM:</strong>
          </Typography>
          <Chip label={properties.output || 'Не указан'} size="small" variant="outlined" />
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>Длина:</strong>
          </Typography>
          <Typography variant="body1">
            {properties.length ? `${properties.length} м` : 'Не указано'}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>Диаметр:</strong>
          </Typography>
          <Typography variant="body1">
            {properties.diameter ? `${properties.diameter} мм` : 'Не указано'}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>Материал:</strong>
          </Typography>
          <Typography variant="body1">{properties.material || 'Не указан'}</Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            <strong>Год:</strong>
          </Typography>
          <Typography variant="body1">{properties.year || 'Не указан'}</Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            <strong>Тип трубы:</strong>
          </Typography>
          <Chip 
            label={properties.pipe_tipe || 'Не указан'} 
            size="small" 
            color={properties.pipe_tipe === 'разводящая' ? 'primary' : 'default'}
          />
        </Grid>
      </Grid>
    </Stack>
  );

  const renderGeometryInfo = () => (
    <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
        Геометрические данные
      </Typography>
      <Typography variant="body2">
        Тип: {geometry.type || 'Не указан'}
      </Typography>
      {geometry.coordinates && (
        <Typography variant="body2">
          Координаты: {JSON.stringify(geometry.coordinates).slice(0, 50)}...
        </Typography>
      )}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" fontWeight="bold">
            Информация об объекте
          </Typography>
          <Chip 
            label={
              type === 'house' ? 'Дом' : 
              type === 'ctp' ? 'ЦТП' : 'Труба'
            } 
            color={
              type === 'house' ? 'primary' : 
              type === 'ctp' ? 'secondary' : 'info'
            }
          />
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {type === 'house' && renderHouseInfo()}
        {type === 'ctp' && renderCTPInfo()}
        {type === 'pipe' && renderPipeInfo()}
        
        <Divider sx={{ my: 2 }} />
        {renderGeometryInfo()}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined">
          Закрыть
        </Button>
        <Button 
          onClick={onClose} 
          variant="contained"
          color={
            type === 'house' ? 'primary' : 
            type === 'ctp' ? 'secondary' : 'info'
          }
        >
          Понятно
        </Button>
      </DialogActions>
    </Dialog>
  );
};