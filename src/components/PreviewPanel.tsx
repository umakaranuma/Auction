'use client';
import React from 'react';
import html2canvas from 'html2canvas';
import { PlayerCardState } from '../types';
import PlayerCard from './PlayerCard';

interface PreviewPanelProps {
  state: PlayerCardState;
  showCard: boolean;
}

export default function PreviewPanel({ state, showCard }: PreviewPanelProps) {
  const downloadCard = () => {
    const card = document.getElementById('player-card');
    if (!card) return;

    html2canvas(card, {
      backgroundColor: null,
      scale: 3,
      useCORS: true,
      allowTaint: true
    }).then(canvas => {
      const link = document.createElement('a');
      const name = (state.playerName.trim() || 'player').replace(/\s+/g, '_').toLowerCase();
      link.download = `player_card_${name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
    <div className="preview-panel">
      <div className="preview-title">CARD PREVIEW</div>
      
      {!showCard ? (
        <div className="empty-state">
          <div className="icon">🏏</div>
          <p>Fill in the player details<br />and click Generate</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <PlayerCard state={state} />
          <button className="download-btn" onClick={downloadCard}>⬇ DOWNLOAD CARD</button>
        </div>
      )}
    </div>
  );
}
