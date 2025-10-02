// @ts-nocheck
import React from 'react';

import styles from '../Map.module.css';
import { MAP_TEXTS } from '../map.constant';

// DataInfoPanel.tsx
interface DataInfoPanelProps {
  show?: boolean;
  housesCount?: number;
  ctpCount?: number;
  pipesCount?: number;  // Новый пропс
  position?: 'top' | 'bottom';
  isLoading?: boolean;
}

export const DataInfoPanel: React.FC<DataInfoPanelProps> = ({
  show = true,
  housesCount,
  ctpCount,
  pipesCount,  // Добавляем
  position = 'top',
  isLoading = false
}) => {
  if (!show) return null;

  
  return null;

  const panelClass = position === 'top' 
    ? `${styles.dataInfoPanel} ${styles.dataInfoTop}`
    : `${styles.dataInfoPanel} ${styles.dataInfoBottom}`;

  if (position === 'top' && isLoading) {
    return (
      <div className={panelClass}>
        <div className={styles.dataInfoText}>
          {MAP_TEXTS.DATA.LOADING}
        </div>
      </div>
    );
  }

  if (position === 'bottom' && (housesCount !== undefined || pipesCount !== undefined)) {
    return (
      <div className={panelClass}>
        {housesCount !== undefined && <div>{MAP_TEXTS.DATA.HOUSES_COUNT(housesCount)}</div>}
        {pipesCount !== undefined && <div>{MAP_TEXTS.DATA.PIPES_COUNT(pipesCount)}</div>}
        {ctpCount !== undefined && <div>{MAP_TEXTS.DATA.CTP_COUNT(ctpCount)}</div>}
      </div>
    );
  }

  return null;
};