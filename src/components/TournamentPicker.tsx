'use client';
import React, { useState, useEffect } from 'react';
import { getTournaments } from '../lib/api';

export interface TournamentFromAPI {
  id: number;
  name: string;
  year: string;
  club_name: string;
  club_logo_url: string | null;
  /** When API supports it — wide branding image for player cards */
  tournament_banner_url?: string | null;
  team_total_budget: number;
  max_players_per_team: number;
  /** Present on list/detail from API when supported; default in UI if omitted */
  player_base_price?: number;
  player_count: number;
  created_at: string;
}

interface TournamentPickerProps {
  onSelect: (tournament: TournamentFromAPI) => void;
  onCreateNew: () => void;
  isViewer?: boolean;
}

export default function TournamentPicker({ onSelect, onCreateNew, isViewer }: TournamentPickerProps) {
  const [tournaments, setTournaments] = useState<TournamentFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTournaments()
      .then((data) => {
        setTournaments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch tournaments:', err);
        setError('Failed to load tournaments');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="picker-screen">
        <div className="picker-loading">
          <div className="auction-loading-spinner" />
          <p>Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="picker-screen">
      <div className="picker-container">
        <div className="picker-header">
          <div className="picker-icon">🏆</div>
          <h2 className="picker-title">SELECT A TOURNAMENT</h2>
          <p className="picker-subtitle">
            Choose an existing tournament to view players &amp; spin the auction wheel,
            or create a new one
          </p>
        </div>

        {error && (
          <div className="picker-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="picker-grid">
          {/* Create New Tournament Card */}
          {!isViewer && (
            <button className="picker-card picker-card-new" onClick={onCreateNew}>
              <div className="picker-card-new-icon">➕</div>
              <div className="picker-card-new-label">CREATE NEW</div>
              <div className="picker-card-new-sub">Set up a new tournament</div>
            </button>
          )}

          {/* Existing Tournament Cards */}
          {tournaments.map((t) => (
            <button
              key={t.id}
              className="picker-card"
              onClick={() => onSelect(t)}
            >
              <div className="picker-card-logo">
                {t.club_logo_url ? (
                  <img src={t.club_logo_url} alt={t.club_name} />
                ) : (
                  <span className="picker-card-logo-fallback">🏏</span>
                )}
              </div>
              <div className="picker-card-info">
                <div className="picker-card-name">{t.name}</div>
                <div className="picker-card-meta">
                  {t.year && <span>{t.year}</span>}
                  {t.club_name && <span> · {t.club_name}</span>}
                </div>
              </div>
              <div className="picker-card-badge">
                <span className="picker-card-count">{t.player_count}</span>
                <span className="picker-card-count-label">Players</span>
              </div>
              <div className="picker-card-arrow">→</div>
            </button>
          ))}
        </div>

        {tournaments.length === 0 && !error && (
          <div className="picker-empty">
            <p>No tournaments yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
