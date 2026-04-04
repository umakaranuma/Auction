'use client';
import React, { ChangeEvent } from 'react';
import { PlayerCardState, TournamentInfo } from '../types';

interface FormPanelProps {
  state: PlayerCardState;
  setState: React.Dispatch<React.SetStateAction<PlayerCardState>>;
  tournament: TournamentInfo;
  onGenerate: () => void;
  onEditTournament: () => void;
  onNewPlayer: () => void;
  showCard: boolean;
}

export default function FormPanel({ state, setState, tournament, onGenerate, onEditTournament, onNewPlayer, showCard }: FormPanelProps) {
  const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, [name]: value }));
  };

  const loadPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setState(prev => ({ ...prev, playerPhotoSrc: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const toggleRole = (role: string) => {
    setState(prev => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  return (
    <div className="form-panel">
      {/* Locked Tournament Banner */}
      <div className="tournament-banner">
        <div className="tournament-banner-info">
          {tournament.clubLogoSrc && (
            <div className="tournament-banner-logo">
              <img src={tournament.clubLogoSrc} alt="logo" />
            </div>
          )}
          <div>
            <div className="tournament-banner-name">{tournament.tournamentName}</div>
            <div className="tournament-banner-meta">
              {tournament.tournamentYear && <span>{tournament.tournamentYear}</span>}
              {tournament.clubName && <span> • {tournament.clubName}</span>}
            </div>
          </div>
        </div>
        <button className="tournament-edit-btn" onClick={onEditTournament}>✏️</button>
      </div>

      <div className="section-label">Player Details</div>
      <div className="form-group">
        <label>Player Photo</label>
        <div className="photo-upload">
          <label className="photo-preview" htmlFor="photoInput">
            {state.playerPhotoSrc ? (
              <img src={state.playerPhotoSrc} alt="player" />
            ) : (
              <div className="photo-preview-text">📷<br />Upload<br />Photo</div>
            )}
          </label>
          <input type="file" id="photoInput" accept="image/*" onChange={loadPhoto} />
          <div className="photo-upload-right">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="playerName" value={state.playerName} placeholder="e.g. Virat Kohli" onChange={handleInput} />
            </div>
            <div className="form-group">
              <label>Jersey Number</label>
              <input type="number" name="jerseyNumber" value={state.jerseyNumber} placeholder="18" min="1" max="99" onChange={handleInput} />
            </div>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Age</label>
        <input type="number" name="playerAge" value={state.playerAge} placeholder="e.g. 24" min="10" max="60" onChange={handleInput} />
      </div>
      <div className="form-group">
        <label>Phone Number</label>
        <input type="tel" name="playerPhone" value={state.playerPhone} placeholder="+94 77 123 4567" onChange={handleInput} />
      </div>
      <div className="form-group">
        <label>Nationality / Region</label>
        <input type="text" name="playerNationality" value={state.playerNationality} placeholder="e.g. Sri Lanka" onChange={handleInput} />
      </div>

      <div className="section-label">Batting</div>
      <div className="form-group">
        <label>Batting Hand</label>
        <div className="hand-row">
          <div className={`hand-btn ${state.battingHand === 'Right Hand' ? 'active' : ''}`} onClick={() => setState(prev => ({ ...prev, battingHand: 'Right Hand' }))}>Right Hand</div>
          <div className={`hand-btn ${state.battingHand === 'Left Hand' ? 'active' : ''}`} onClick={() => setState(prev => ({ ...prev, battingHand: 'Left Hand' }))}>Left Hand</div>
        </div>
      </div>

      <div className="section-label">Bowling</div>
      <div className="form-group">
        <label>Bowling Hand</label>
        <div className="hand-row">
          <div className={`hand-btn ${state.bowlingHand === 'Right Arm' ? 'active' : ''}`} onClick={() => setState(prev => ({ ...prev, bowlingHand: 'Right Arm' }))}>Right Arm</div>
          <div className={`hand-btn ${state.bowlingHand === 'Left Arm' ? 'active' : ''}`} onClick={() => setState(prev => ({ ...prev, bowlingHand: 'Left Arm' }))}>Left Arm</div>
        </div>
      </div>
      <div className="form-group">
        <label>Bowling Style</label>
        <select name="bowlingStyle" value={state.bowlingStyle} onChange={handleInput}>
          <option value="">— Select —</option>
          <option>Fast</option>
          <option>Fast-Medium</option>
          <option>Medium</option>
          <option>Off Spin</option>
          <option>Leg Spin</option>
          <option>Slow Left Arm</option>
          <option>Chinaman</option>
        </select>
      </div>

      <div className="section-label">Player Role</div>
      <div className="role-grid">
        {['Batsman', 'Bowler', 'All-Rounder', 'Batting All-Rounder', 'Bowling All-Rounder', 'Wicket-Keeper'].map(role => (
          <div key={role} className={`role-check ${state.roles.includes(role) ? 'checked' : ''}`} onClick={() => toggleRole(role)}>
            <div className="dot"></div><span>{role === 'Batting All-Rounder' ? 'Batting AR' : role === 'Bowling All-Rounder' ? 'Bowling AR' : role}</span>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button className="gen-btn" onClick={onGenerate}>⚡ Generate Player Card</button>
        {showCard && (
          <button className="new-player-btn" onClick={onNewPlayer}>➕ NEW PLAYER</button>
        )}
      </div>
    </div>
  );
}
