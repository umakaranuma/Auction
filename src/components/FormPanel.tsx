import React, { ChangeEvent } from 'react';
import { PlayerCardState } from '../types';

interface FormPanelProps {
  state: PlayerCardState;
  setState: React.Dispatch<React.SetStateAction<PlayerCardState>>;
  onGenerate: () => void;
}

export default function FormPanel({ state, setState, onGenerate }: FormPanelProps) {
  const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, [name]: value }));
  };

  const loadPhoto = (e: ChangeEvent<HTMLInputElement>, field: 'playerPhotoSrc' | 'clubLogoSrc') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setState(prev => ({ ...prev, [field]: dataUrl }));
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
      <div className="section-label">Tournament Info</div>
      <div className="form-group">
        <label>Tournament Name</label>
        <input type="text" name="tournamentName" value={state.tournamentName} placeholder="e.g. Premier League 2025" onChange={handleInput} />
      </div>
      <div className="form-group">
        <label>Season / Year</label>
        <input type="text" name="tournamentYear" value={state.tournamentYear} placeholder="e.g. 2025" onChange={handleInput} />
      </div>
      <div className="form-group">
        <label>Club / Team Logo</label>
        <div className="logo-upload-row">
          <label className="logo-preview" htmlFor="logoInput">
            {state.clubLogoSrc ? (
              <img src={state.clubLogoSrc} alt="logo" />
            ) : (
              <span className="logo-preview-text">🏆</span>
            )}
          </label>
          <input type="file" id="logoInput" accept="image/*" onChange={(e) => loadPhoto(e, 'clubLogoSrc')} />
          <input type="text" name="clubName" value={state.clubName} placeholder="Club / Team name" onChange={handleInput} style={{ flex: 1 }} />
        </div>
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
          <input type="file" id="photoInput" accept="image/*" onChange={(e) => loadPhoto(e, 'playerPhotoSrc')} />
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

      <button className="gen-btn" onClick={onGenerate}>⚡ Generate Player Card</button>
    </div>
  );
}
