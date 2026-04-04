import React from 'react';
import { PlayerCardState } from '../types';

interface PlayerCardProps {
  state: PlayerCardState;
}

export default function PlayerCard({ state }: PlayerCardProps) {
  const battShort = state.battingHand === 'Left Hand' ? 'LHB' : 'RHB';
  const bowlShort = (() => {
    const arm = state.bowlingHand === 'Left Arm' ? 'LA' : 'RA';
    const styleMap: Record<string, string> = {
      'Fast': 'F', 'Fast-Medium': 'FM', 'Medium': 'M',
      'Off Spin': 'OS', 'Leg Spin': 'LS', 'Slow Left Arm': 'SLA', 'Chinaman': 'CHN'
    };
    return arm + (styleMap[state.bowlingStyle] || '');
  })();

  return (
    <div className="player-card" id="player-card">
      <div className="card-top-bar"></div>
      <div className="corner-tl"></div>
      <div className="corner-br"></div>
      
      <div className="card-header">
        <div className="tournament-info">
          <div className="tournament-name">{state.tournamentName || 'TOURNAMENT NAME'}</div>
          <div className="tournament-year">{state.tournamentYear || '2025'}</div>
        </div>
        <div className="club-logo-circle">
          {state.clubLogoSrc ? (
            <img src={state.clubLogoSrc} alt="logo" />
          ) : (
            <span style={{ fontSize: '0.6rem', letterSpacing: 0, padding: '2px', textAlign: 'center' }}>
              {state.clubName || 'LOGO'}
            </span>
          )}
        </div>
      </div>
      
      <div className="card-player-area">
        <div className="player-img-frame">
          {state.playerPhotoSrc ? (
            <img 
              src={state.playerPhotoSrc} 
              alt="player" 
              style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', display: 'block' }} 
            />
          ) : (
            <div className="player-img-placeholder">🧑</div>
          )}
        </div>
        {state.jerseyNumber && (
          <div className="jersey-badge">#{state.jerseyNumber}</div>
        )}
      </div>
      
      <div className="card-name-plate">
        <div className="player-full-name">{state.playerName ? state.playerName.toUpperCase() : 'PLAYER NAME'}</div>
        <div className="player-role-tags">
          {state.roles.map(role => (
            <span key={role} className={`role-tag ${role === 'Wicket-Keeper' ? 'red' : ''}`}>{role}</span>
          ))}
        </div>
      </div>
      
      <div className="card-stats">
        <div className="stat-cell">
          <div className="stat-label">Batting</div>
          <div className="stat-value small">{battShort}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Bowling</div>
          <div className="stat-value small">{state.bowlingStyle ? bowlShort : '—'}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Age</div>
          <div className="stat-value">{state.playerAge || '—'}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Jersey</div>
          <div className="stat-value">{state.jerseyNumber ? '#' + state.jerseyNumber : '—'}</div>
        </div>
      </div>
      
      <div className="card-footer">
        <div className="footer-detail"><strong>{state.playerNationality || '—'}</strong></div>
        <div className="footer-detail">{state.clubName || '—'}</div>
      </div>
    </div>
  );
}
