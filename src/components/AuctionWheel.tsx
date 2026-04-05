'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SpinWheel from './SpinWheel';
import PlayerCard from './PlayerCard';
import { PlayerCardState } from '../types';

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
  auction_status: 'pending' | 'sold' | 'unsold';
  sold_price: number | null;
  sold_to: string;
}

interface AuctionWheelProps {
  tournamentId: number | null;
  tournamentName: string;
  tournamentYear: string;
  clubLogoSrc: string | null;
  clubName: string;
  players: PlayerFromAPI[];
  onUpdateStatus: (
    playerId: number,
    status: 'sold' | 'unsold',
    soldPrice?: number,
    soldTo?: string
  ) => Promise<void>;
  onResetAuction: () => Promise<void>;
  onRefreshPlayers: () => Promise<void>;
}

export default function AuctionWheel({
  tournamentId,
  tournamentName,
  tournamentYear,
  clubLogoSrc,
  clubName,
  players,
  onUpdateStatus,
  onResetAuction,
  onRefreshPlayers,
}: AuctionWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerFromAPI | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [auctionRound, setAuctionRound] = useState<1 | 2>(1);
  const [soldPrice, setSoldPrice] = useState('');
  const [soldTo, setSoldTo] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [roundCompleteMsg, setRoundCompleteMsg] = useState<string | null>(null);

  // Compute which players are eligible for the current round
  const round1Players = players.filter((p) => p.auction_status === 'pending');
  const round2Players = players.filter((p) => p.auction_status === 'unsold');
  const soldPlayers = players.filter((p) => p.auction_status === 'sold');
  const unsoldPlayers = players.filter((p) => p.auction_status === 'unsold');

  const eligiblePlayers = auctionRound === 1 ? round1Players : round2Players;

  // Check if round 1 is complete (no pending players left)
  const round1Complete = round1Players.length === 0 && players.length > 0;
  // Check if round 2 is complete
  const round2Complete = round2Players.length === 0 && round1Complete;
  // All done
  const auctionComplete = round1Complete && round2Complete;

  // Auto-detect round
  useEffect(() => {
    if (round1Complete && unsoldPlayers.length > 0 && auctionRound === 1) {
      setRoundCompleteMsg(
        `Round 1 complete! ${soldPlayers.length} sold, ${unsoldPlayers.length} unsold. Start Round 2 for unsold players.`
      );
    }
  }, [round1Complete, unsoldPlayers.length, soldPlayers.length, auctionRound]);

  const handleSpin = () => {
    if (spinning || eligiblePlayers.length === 0) return;
    setShowCard(false);
    setSelectedPlayer(null);
    setSoldPrice('');
    setSoldTo('');
    setRoundCompleteMsg(null);
    setSpinning(true);
  };

  const handleResult = useCallback(
    (index: number) => {
      setSelectedPlayer(eligiblePlayers[index]);
    },
    [eligiblePlayers]
  );

  const handleSpinEnd = useCallback(() => {
    setSpinning(false);
    setShowCard(true);
  }, []);

  const handleMarkSold = async () => {
    if (!selectedPlayer || statusUpdating) return;
    setStatusUpdating(true);
    await onUpdateStatus(
      selectedPlayer.id,
      'sold',
      soldPrice ? parseFloat(soldPrice) : undefined,
      soldTo || undefined
    );
    setSelectedPlayer(null);
    setShowCard(false);
    setStatusUpdating(false);
  };

  const handleMarkUnsold = async () => {
    if (!selectedPlayer || statusUpdating) return;
    setStatusUpdating(true);
    await onUpdateStatus(selectedPlayer.id, 'unsold');
    setSelectedPlayer(null);
    setShowCard(false);
    setStatusUpdating(false);
  };

  const handleStartRound2 = () => {
    setAuctionRound(2);
    setRoundCompleteMsg(null);
    setSelectedPlayer(null);
    setShowCard(false);
  };

  const handleReset = async () => {
    await onResetAuction();
    setAuctionRound(1);
    setSelectedPlayer(null);
    setShowCard(false);
    setRoundCompleteMsg(null);
  };

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

  if (players.length === 0) {
    return (
      <div className="auction-panel">
        <div className="empty-state">
          <div className="icon">🎰</div>
          <p>No players registered yet.<br />Add some players first to start the auction!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-panel">
      {/* Auction Status Bar */}
      <div className="auction-round-bar">
        <div className="auction-round-indicator">
          <span className="auction-round-label">ROUND</span>
          <span className="auction-round-num">{auctionRound}</span>
        </div>
        <div className="auction-stats-bar auction-stats-compact">
          <div className="auction-stat-item auction-stat-pending">
            <span className="auction-stat-num">{round1Players.length}</span>
            <span className="auction-stat-label">Pending</span>
          </div>
          <div className="auction-stat-item auction-stat-sold">
            <span className="auction-stat-num">{soldPlayers.length}</span>
            <span className="auction-stat-label">Sold</span>
          </div>
          <div className="auction-stat-item auction-stat-unsold">
            <span className="auction-stat-num">{unsoldPlayers.length}</span>
            <span className="auction-stat-label">Unsold</span>
          </div>
        </div>
        <button className="auction-reset-btn" onClick={handleReset} title="Reset entire auction">
          🔄 Reset
        </button>
      </div>

      {/* Round Complete Message */}
      {roundCompleteMsg && (
        <div className="round-complete-banner">
          <div className="round-complete-text">🏆 {roundCompleteMsg}</div>
          {unsoldPlayers.length > 0 && auctionRound === 1 && (
            <button className="round2-btn" onClick={handleStartRound2}>
              🔄 START ROUND 2 ({unsoldPlayers.length} unsold players)
            </button>
          )}
        </div>
      )}

      {/* Auction Complete Message */}
      {auctionComplete && (
        <div className="round-complete-banner auction-complete-banner">
          <div className="round-complete-text">
            🎉 AUCTION COMPLETE! {soldPlayers.length} players sold, {unsoldPlayers.length} unsold
          </div>
        </div>
      )}

      {/* Main Content */}
      {!auctionComplete && eligiblePlayers.length > 0 && (
        <div className="auction-content">
          {/* Left: Wheel */}
          <div className="auction-wheel-section">
            <SpinWheel
              names={eligiblePlayers.map((p) => p.name)}
              onResult={handleResult}
              spinning={spinning}
              onSpinEnd={handleSpinEnd}
            />
            <button className="spin-btn" onClick={handleSpin} disabled={spinning}>
              {spinning ? '🌀 SPINNING...' : '🎯 SPIN THE WHEEL'}
            </button>
            <div className="player-count-badge">
              {eligiblePlayers.length} player{eligiblePlayers.length !== 1 ? 's' : ''} remaining
              {auctionRound === 2 && ' (Round 2)'}
            </div>
          </div>

          {/* Right: Result Card + Actions */}
          <div className="auction-result-section">
            {showCard && cardState && selectedPlayer ? (
              <div className="auction-result-appear">
                <div className="auction-result-label">🏆 SELECTED PLAYER</div>
                <PlayerCard state={cardState} />

                {/* Sold/Unsold Actions */}
                <div className="auction-actions">
                  <div className="auction-action-row">
                    <div className="form-group auction-input-group">
                      <label>Sold To (Team)</label>
                      <input
                        type="text"
                        value={soldTo}
                        onChange={(e) => setSoldTo(e.target.value)}
                        placeholder="e.g. Chennai Kings"
                      />
                    </div>
                    <div className="form-group auction-input-group">
                      <label>Price (₹)</label>
                      <input
                        type="number"
                        value={soldPrice}
                        onChange={(e) => setSoldPrice(e.target.value)}
                        placeholder="e.g. 50000"
                      />
                    </div>
                  </div>
                  <div className="auction-action-buttons">
                    <button
                      className="auction-sold-btn"
                      onClick={handleMarkSold}
                      disabled={statusUpdating}
                    >
                      {statusUpdating ? '⏳' : '✅'} MARK AS SOLD
                    </button>
                    <button
                      className="auction-unsold-btn"
                      onClick={handleMarkUnsold}
                      disabled={statusUpdating}
                    >
                      {statusUpdating ? '⏳' : '❌'} MARK AS UNSOLD
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="auction-placeholder">
                <div className="auction-placeholder-icon">🎡</div>
                <p>Spin the wheel to<br />reveal a player!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sold & Unsold Lists */}
      <div className="auction-lists-section">
        {/* Sold Players */}
        {soldPlayers.length > 0 && (
          <div className="auction-list-block">
            <h3 className="auction-list-title sold-title">
              ✅ SOLD PLAYERS ({soldPlayers.length})
            </h3>
            <div className="auction-list-grid">
              {soldPlayers.map((p) => (
                <div key={p.id} className="auction-list-card auction-list-sold">
                  <div className="auction-list-card-avatar">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} />
                    ) : (
                      <span>{p.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="auction-list-card-info">
                    <div className="auction-list-card-name">{p.name}</div>
                    <div className="auction-list-card-meta">
                      {p.jersey_number && <span>#{p.jersey_number}</span>}
                      {p.role && <span>{p.role}</span>}
                    </div>
                    {p.sold_to && (
                      <div className="auction-list-card-sold-to">→ {p.sold_to}</div>
                    )}
                    {p.sold_price && (
                      <div className="auction-list-card-price">₹{Number(p.sold_price).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unsold Players */}
        {unsoldPlayers.length > 0 && (
          <div className="auction-list-block">
            <h3 className="auction-list-title unsold-title">
              ❌ UNSOLD PLAYERS ({unsoldPlayers.length})
              {auctionRound === 1 && !round1Complete && (
                <span className="round2-hint">&nbsp;— will go to Round 2</span>
              )}
            </h3>
            <div className="auction-list-grid">
              {unsoldPlayers.map((p) => (
                <div key={p.id} className="auction-list-card auction-list-unsold">
                  <div className="auction-list-card-avatar">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} />
                    ) : (
                      <span>{p.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="auction-list-card-info">
                    <div className="auction-list-card-name">{p.name}</div>
                    <div className="auction-list-card-meta">
                      {p.jersey_number && <span>#{p.jersey_number}</span>}
                      {p.role && <span>{p.role}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
