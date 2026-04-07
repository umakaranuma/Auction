'use client';
import React, { ChangeEvent } from 'react';
import { TournamentInfo } from '../types';

interface TournamentSetupProps {
  tournament: TournamentInfo;
  setTournament: React.Dispatch<React.SetStateAction<TournamentInfo>>;
  onContinue: () => void;
  saving?: boolean;
  isEdit?: boolean;
}

export default function TournamentSetup({ tournament, setTournament, onContinue, saving, isEdit }: TournamentSetupProps) {
  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTournament(prev => ({ ...prev, [name]: value }));
  };

  const loadLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setTournament(prev => ({ ...prev, clubLogoSrc: dataUrl, clubLogoFile: file }));
    };
    reader.readAsDataURL(file);
  };

  const canContinue = tournament.tournamentName.trim().length > 0;

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-icon">🏏</div>
        <h2 className="setup-title">{isEdit ? 'EDIT TOURNAMENT' : 'TOURNAMENT SETUP'}</h2>
        <p className="setup-subtitle">
          {isEdit ? 'Update your tournament details below' : 'Configure your tournament details once, then create cards for all your players'}
        </p>

        <div className="setup-form">
          <div className="form-group">
            <label>Tournament Name *</label>
            <input type="text" name="tournamentName" value={tournament.tournamentName} placeholder="e.g. Crick Nova Premier League" onChange={handleInput} />
          </div>
          <div className="form-group">
            <label>Season / Year</label>
            <input type="text" name="tournamentYear" value={tournament.tournamentYear} placeholder="e.g. 2026" onChange={handleInput} />
          </div>
          <div className="form-group">
            <label>Club / Team Name</label>
            <input type="text" name="clubName" value={tournament.clubName} placeholder="e.g. Uduppiddy Youth" onChange={handleInput} />
          </div>
          <div className="form-group">
            <label>Club / Team Logo</label>
            <div className="setup-logo-area">
              <label className="setup-logo-preview" htmlFor="setupLogoInput">
                {tournament.clubLogoSrc ? (
                  <img src={tournament.clubLogoSrc} alt="logo" />
                ) : (
                  <div className="setup-logo-placeholder">
                    <span>🏆</span>
                    <span className="setup-logo-text">Upload Logo</span>
                  </div>
                )}
              </label>
              <input type="file" id="setupLogoInput" accept="image/*" onChange={loadLogo} />
            </div>
          </div>

          <button className="gen-btn" onClick={onContinue} disabled={!canContinue || saving} style={{ opacity: canContinue && !saving ? 1 : 0.5 }}>
            {saving ? '⏳ SAVING...' : (isEdit ? '💾 SAVE CHANGES' : '🎯 CONTINUE TO PLAYER CARDS')}
          </button>
        </div>
      </div>
    </div>
  );
}
