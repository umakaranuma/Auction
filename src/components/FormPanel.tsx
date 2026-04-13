'use client';
import React, { ChangeEvent, useCallback, useRef, useState } from 'react';
import { PlayerCardState, TournamentInfo } from '../types';
import { roleShowsBowling } from '../lib/playerRole';
import { removePlayerPhotoBackground, blobToDataUrl } from '../lib/removePlayerPhotoBackground';

interface FormPanelProps {
  state: PlayerCardState;
  setState: React.Dispatch<React.SetStateAction<PlayerCardState>>;
  tournament: TournamentInfo;
  onGenerate: () => void;
  onEditTournament: () => void;
  onNewPlayer: () => void;
  showCard: boolean;
  saving?: boolean;
  isEdit?: boolean;
}

export default function FormPanel({ state, setState, tournament, onGenerate, onEditTournament, onNewPlayer, showCard, saving, isEdit }: FormPanelProps) {
  const [removeBgEnabled, setRemoveBgEnabled] = useState(true);
  const [photoWorking, setPhotoWorking] = useState(false);
  const [photoStatusLine, setPhotoStatusLine] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const loadGen = useRef(0);

  const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, [name]: value }));
  };

  const loadPhoto = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      input.value = '';
      return;
    }
    const gen = ++loadGen.current;
    setPhotoNote(null);
    setPhotoWorking(true);
    setPhotoStatusLine(removeBgEnabled ? 'Removing background…' : 'Loading…');

    const applyOriginal = async () => {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      if (gen !== loadGen.current) return;
      setState((prev) => ({
        ...prev,
        playerPhotoSrc: dataUrl,
        playerPhotoFile: file,
        playerPhotoBackgroundRemoved: false,
      }));
    };

    try {
      if (removeBgEnabled) {
        const blob = await removePlayerPhotoBackground(file, (key, current, total) => {
          if (gen !== loadGen.current) return;
          if (total > 0) {
            const pct = Math.min(100, Math.round((current / total) * 100));
            setPhotoStatusLine(`${key} ${pct}%`);
          } else {
            setPhotoStatusLine(key);
          }
        });
        if (gen !== loadGen.current) return;
        const dataUrl = await blobToDataUrl(blob);
        const stem = file.name.replace(/\.[^.]+$/, '') || 'player';
        const outFile = new File([blob], `${stem}-cutout.png`, { type: 'image/png' });
        setState((prev) => ({
          ...prev,
          playerPhotoSrc: dataUrl,
          playerPhotoFile: outFile,
          playerPhotoBackgroundRemoved: true,
        }));
      } else {
        await applyOriginal();
      }
    } catch (err) {
      console.error(err);
      if (gen !== loadGen.current) return;
      setPhotoNote('Background removal failed — using your original photo.');
      await applyOriginal();
    } finally {
      if (gen === loadGen.current) {
        setPhotoWorking(false);
        setPhotoStatusLine(null);
        input.value = '';
      }
    }
  }, [removeBgEnabled, setState]);

  const selectRole = (role: string) => {
    setState(prev => ({ ...prev, roles: [role] }));
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
        <label className="photo-remove-bg-toggle">
          <input
            type="checkbox"
            checked={removeBgEnabled}
            disabled={photoWorking}
            onChange={(ev) => setRemoveBgEnabled(ev.target.checked)}
          />
          <span>
            Remove wall / outdoor background (runs in your browser; first use downloads a small model)
          </span>
        </label>
        <div className="photo-upload">
          <label className="photo-preview" htmlFor="photoInput">
            {state.playerPhotoSrc ? (
              <img src={state.playerPhotoSrc} alt="player preview" />
            ) : (
              <div className="photo-preview-text">📷<br />Upload<br />Photo</div>
            )}
            {photoWorking && (
              <div className="photo-preview-processing">
                <div className="auction-loading-spinner" />
                <span>{photoStatusLine ?? '…'}</span>
              </div>
            )}
          </label>
          <input
            type="file"
            id="photoInput"
            accept="image/*"
            disabled={photoWorking}
            onChange={loadPhoto}
          />
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
        {photoNote && (
          <p className="photo-upload-note">{photoNote}</p>
        )}
      </div>

      <div className="form-group">
        <label>Age</label>
        <input type="number" name="playerAge" value={state.playerAge} placeholder="e.g. 24" min="10" max="60" onChange={handleInput} />
      </div>
      <div className="form-group">
        <label>Phone Number</label>
        <input type="tel" name="playerPhone" value={state.playerPhone} placeholder="+94 77 123 4567" onChange={handleInput} />
      </div>

      <div className="section-label">Batting</div>
      <div className="form-group">
        <label>Batting Hand</label>
        <div className="hand-row">
          <div className={`hand-btn ${state.battingHand === 'Right Hand' ? 'active' : ''}`} onClick={() => setState(prev => ({ ...prev, battingHand: 'Right Hand' }))}>Right Hand</div>
          <div className={`hand-btn ${state.battingHand === 'Left Hand' ? 'active' : ''}`} onClick={() => setState(prev => ({ ...prev, battingHand: 'Left Hand' }))}>Left Hand</div>
        </div>
      </div>

      <div className="section-label">Player Role</div>
      <div className="role-grid">
        {['Batsman', 'Bowler', 'Wicket Keeper', 'Batting All Rounder', 'Bowling All Rounder'].map(role => (
          <div key={role} className={`role-check ${state.roles.includes(role) ? 'checked' : ''}`} onClick={() => selectRole(role)}>
            <div className="dot"></div><span>{role}</span>
          </div>
        ))}
      </div>

      {roleShowsBowling(state.roles[0]) && (
        <>
          <div className="section-label">Bowling</div>
          <div className="form-group">
            <label>Bowling Hand</label>
            <div className="hand-row">
              <div className={`hand-btn ${state.bowlingHand === 'Right Arm' ? 'active' : ''}`} onClick={() => setState(prev => ({ ...prev, bowlingHand: 'Right Arm' }))}>Right Arm</div>
              <div className={`hand-btn ${state.bowlingHand === 'Left Arm' ? 'active' : ''}`} onClick={() => setState(prev => ({ ...prev, bowlingHand: 'Left Arm' }))}>Left Arm</div>
            </div>
          </div>
        </>
      )}

      <div className="form-actions">
        <button className="gen-btn" onClick={onGenerate} disabled={saving || photoWorking}>
          {saving ? '⏳ SAVING...' : (isEdit ? '💾 SAVE PLAYER CHANGES' : '⚡ Generate Player Card')}
        </button>
        {showCard && (
          <button className="new-player-btn" onClick={onNewPlayer}>➕ NEW PLAYER</button>
        )}
      </div>
    </div>
  );
}
