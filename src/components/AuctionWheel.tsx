'use client';
import React, { useState, useEffect, useCallback } from 'react';
import SpinWheel from './SpinWheel';
import PlayerCard from './PlayerCard';
import { PlayerCardState } from '../types';
import { getPlayers } from '../lib/api';

interface AuctionWheelProps {
  tournamentId: number | null;
  tournamentName: string;
  tournamentYear: string;
  clubLogoSrc: string | null;
  clubName: string;
  onBack?: () => void;
}

interface PlayerFromAPI {
  id: number;
  name: string;
  photo_url: string | null;
  jersey_number: string;
  age: string;
  phone: string;
  nationality: string;
  batting_hand: 'Right Hand' | 'Left Hand';
  bowling_hand: 'Right Arm' | 'Left Arm';
  role: string;
}

export default function AuctionWheel({
  tournamentId,
  tournamentName,
  tournamentYear,
  clubLogoSrc,
  clubName,
  onBack,
}: AuctionWheelProps) {
  const [players, setPlayers] = useState<PlayerFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerFromAPI | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!tournamentId) return;
    setLoading(true);
    getPlayers(tournamentId)
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tournamentId]);

  const handleSpin = () => {
    if (spinning || players.length === 0) return;
    setShowCard(false);
    setSelectedPlayer(null);
    setHighlightedIndex(null);
    setSpinning(true);
  };

  const handleResult = useCallback((index: number) => {
    setSelectedPlayer(players[index]);
    setHighlightedIndex(index);
  }, [players]);

  const handleSpinEnd = useCallback(() => {
    setSpinning(false);
    setShowCard(true);
  }, []);

  // Build card state from selected player
  const cardState: PlayerCardState | null = selectedPlayer
    ? {
        tournamentName,
        tournamentYear,
        clubLogoSrc,
        clubLogoFile: null,
        clubName,
        playerPhotoSrc: selectedPlayer.photo_url,
        playerPhotoFile: null,
        playerName: selectedPlayer.name,
        jerseyNumber: selectedPlayer.jersey_number,
        playerAge: selectedPlayer.age,
        playerPhone: selectedPlayer.phone,
        playerNationality: selectedPlayer.nationality,
        battingHand: selectedPlayer.batting_hand,
        bowlingHand: selectedPlayer.bowling_hand,
        bowlingStyle: '',
        roles: selectedPlayer.role ? [selectedPlayer.role] : [],
      }
    : null;

  if (loading) {
    return (
      <div className="auction-panel">
        <div className="auction-loading">
          <div className="auction-loading-spinner" />
          <p>Loading players...</p>
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="auction-panel">
        {onBack && (
          <button className="auction-back-btn" onClick={onBack}>
            ← Back to Tournaments
          </button>
        )}
        <div className="empty-state">
          <div className="icon">🎰</div>
          <p>No players found.<br />Add some players first to use the wheel!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-panel">
      {/* Top bar with back button and tournament info */}
      <div className="auction-top-bar">
        {onBack && (
          <button className="auction-back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
        <div className="auction-header">
          <h2 className="auction-title">🎰 AUCTION WHEEL</h2>
          <p className="auction-subtitle">
            {tournamentName} {tournamentYear && `· ${tournamentYear}`}
            {clubName && ` · ${clubName}`}
          </p>
        </div>
      </div>

      {/* Players Roster */}
      <div className="roster-section">
        <div className="roster-header">
          <h3 className="roster-title">📋 REGISTERED PLAYERS</h3>
          <span className="roster-count">{players.length} Players</span>
        </div>
        <div className="roster-grid">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={`roster-player-card ${highlightedIndex === i ? 'roster-player-highlighted' : ''}`}
            >
              <div className="roster-player-avatar">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} />
                ) : (
                  <span className="roster-player-avatar-fallback">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="roster-player-info">
                <div className="roster-player-name">{p.name}</div>
                <div className="roster-player-meta">
                  {p.jersey_number && <span>#{p.jersey_number}</span>}
                  {p.role && <span className="roster-player-role">{p.role}</span>}
                </div>
              </div>
              {p.batting_hand && (
                <div className="roster-player-hand">
                  {p.batting_hand === 'Right Hand' ? '🫱' : '🫲'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Wheel + Result Area */}
      <div className="auction-content">
        {/* Left: Wheel */}
        <div className="auction-wheel-section">
          <SpinWheel
            names={players.map((p) => p.name)}
            onResult={handleResult}
            spinning={spinning}
            onSpinEnd={handleSpinEnd}
          />
          <button
            className="spin-btn"
            onClick={handleSpin}
            disabled={spinning}
          >
            {spinning ? '🌀 SPINNING...' : '🎯 SPIN THE WHEEL'}
          </button>
          <div className="player-count-badge">
            {players.length} player{players.length !== 1 ? 's' : ''} loaded
          </div>
        </div>

        {/* Right: Result Card */}
        <div className="auction-result-section">
          {showCard && cardState ? (
            <div className="auction-result-appear">
              <div className="auction-result-label">🏆 SELECTED PLAYER</div>
              <PlayerCard state={cardState} />
            </div>
          ) : (
            <div className="auction-placeholder">
              <div className="auction-placeholder-icon">🎡</div>
              <p>Spin the wheel to<br />reveal a player!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
