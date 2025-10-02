// home-hook.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import type { MapControls, MapSettings } from '../../shared/types/map.types';
import { MAP_SETTINGS } from './home.constant';

export const useHome = () => {
  const [housesData, setHousesData] = useState<any>(null);
  const [ctpData, setCtpData] = useState<any>(null);
  const [pipesData, setPipesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapRef = useRef<any>(null);

  const [mapSettings, setMapSettings] = useState<MapSettings>({
    center: MAP_SETTINGS.CENTER.DEFAULT,
    zoom: MAP_SETTINGS.ZOOM.DEFAULT,
    showHouses: true,
    showCTP: true,
    showPipes: true,
    housesOpacity: 0.8,
    ctpOpacity: 1.0,
    pipesOpacity: 0.7,
    showLegend: true,
    showDataInfo: true,
    mapType: 'yandex#map'
  });

  // Функция для вычисления центра bounding box
  const calculateBoundsCenter = (features: any[]): [number, number] => {
    if (!features || features.length === 0) {
      return MAP_SETTINGS.CENTER.DEFAULT;
    }

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    features.forEach(feature => {
      if (feature.geometry) {
        const coordinates = feature.geometry.coordinates;
        
        if (feature.geometry.type === 'Point') {
          const [lng, lat] = coordinates;
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        } else if (feature.geometry.type === 'Polygon') {
          coordinates[0].forEach(([lng, lat]: [number, number]) => {
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          });
        } else if (feature.geometry.type === 'LineString') {
          coordinates.forEach(([lng, lat]: [number, number]) => {
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          });
        }
      }
    });

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    return [centerLat, centerLng];
  };

  const mapControls: MapControls = {
    onZoomIn: () => {
      setMapSettings(prev => ({
        ...prev,
        zoom: Math.min(prev.zoom + 1, MAP_SETTINGS.ZOOM.MAX)
      }));
    },
    onZoomOut: () => {
      setMapSettings(prev => ({
        ...prev,
        zoom: Math.max(prev.zoom - 1, MAP_SETTINGS.ZOOM.MIN)
      }));
    },
    onResetView: () => {
      setMapSettings(prev => ({
        ...prev,
        center: MAP_SETTINGS.CENTER.DEFAULT,
        zoom: MAP_SETTINGS.ZOOM.DEFAULT
      }));
    },
    onCenterToHouses: useCallback(() => {
      if (housesData?.features?.length > 0) {
        const center = calculateBoundsCenter(housesData.features);
        setMapSettings(prev => ({
          ...prev,
          center: center,
          zoom: 15
        }));
      }
    }, [housesData]),
    
    onCenterToCTP: useCallback(() => {
      if (ctpData?.features?.length > 0) {
        const center = calculateBoundsCenter(ctpData.features);
        setMapSettings(prev => ({
          ...prev,
          center: center,
          zoom: 14
        }));
      }
    }, [ctpData]),
    
    onCenterToPipes: useCallback(() => {
      if (pipesData?.features?.length > 0) {
        const center = calculateBoundsCenter(pipesData.features);
        setMapSettings(prev => ({
          ...prev,
          center: center,
          zoom: 14
        }));
      }
    }, [pipesData])
  };

  const handleSettingChange = (key: keyof MapSettings, value: any) => {
    setMapSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Загружаем дома (МКД_полигоны.geojson)
        const housesResponse = await fetch('/data/new-data/МКД_полигоны.geojson');
        if (!housesResponse.ok) throw new Error('Ошибка при загрузке данных домов');
        const houses = await housesResponse.json();
        setHousesData(houses);

        // Загружаем ЦТП (ЦТП_точки.geojson)
        const ctpResponse = await fetch('/data/new-data/ЦТП_точки.geojson');
        if (!ctpResponse.ok) throw new Error('Ошибка при загрузке данных ЦТП');
        const ctp = await ctpResponse.json();
        setCtpData(ctp);

        // Загружаем трубы (Трубы_линии.geojson)
        const pipesResponse = await fetch('/data/new-data/Трубы_линии.geojson');
        if (!pipesResponse.ok) throw new Error('Ошибка при загрузке данных труб');
        const pipes = await pipesResponse.json();
        setPipesData(pipes);

      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    housesData,
    ctpData,
    pipesData,
    loading,
    error,
    handleSettingChange,
    mapControls,
    mapSettings,
    mapRef
  }
}