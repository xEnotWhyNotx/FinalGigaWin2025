// @ts-nocheck
import React from 'react';

import styles from '../map.module.css';
import { MAP_TEXTS } from '../map.constant';

// LegendPanel.tsx
interface LegendPanelProps {
  show?: boolean;
  hasPipes?: boolean;  // Новый пропс
}

export const LegendPanel: React.FC<LegendPanelProps> = ({ 
  show = true, 
  hasPipes = false 
}) => {
  if (!show) return null;

  return null 
  
  return (
    <div className={styles.legendPanel}>
      <div className={styles.legendTitle}>{MAP_TEXTS.LEGEND.TITLE}</div>
      {hasPipes && (
        <div className={styles.legendItem}>
          <div className={styles.legendColorLine}></div>  {/* Новый элемент для труб */}
          <span>{MAP_TEXTS.LEGEND.PIPES}</span>
        </div>
      )}
      <div className={styles.legendItem}>
        <div className={styles.legendColorSquare}></div>
        <span>{MAP_TEXTS.LEGEND.HOUSES}</span>
      </div>
      <div className={styles.legendItem}>
        <div className={styles.legendColorCircle}></div>
        <span>{MAP_TEXTS.LEGEND.CTP}</span>
      </div>
    </div>
  );
};