'use client';
import React, { useState, useEffect, useCallback } from 'react';
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

interface TeamFromAPI {
  id: number;
  tournament: number;
  name: string;
  logo_url: string | null;
  created_at: string;
}

interface AuctionWheelProps {
  tournamentId: number | null;
  tournamentName: string;
  tournamentYear: string;
  clubLogoSrc: string | null;
  clubName: string;
  players: PlayerFromAPI[];
  teams: TeamFromAPI[];
  teamTotalBudget: number;
  maxPlayersPerTeam: number;
  playerBasePrice: number;
  onUpdateStatus: (
    playerId: number,
    status: 'sold' | 'unsold',
    soldPrice?: number,
    soldTo?: string
  ) => Promise<void>;
  onResetAuction: () => Promise<void>;
  onRefreshPlayers: () => Promise<void>;
}

type AuctionView = 'wheel' | 'result';

export default function AuctionWheel({
  tournamentId,
  tournamentName,
  tournamentYear,
  clubLogoSrc,
  clubName,
  players,
  teams,
  teamTotalBudget,
  maxPlayersPerTeam,
  playerBasePrice,
  onUpdateStatus,
  onResetAuction,
  onRefreshPlayers,
}: AuctionWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerFromAPI | null>(null);
  const [auctionView, setAuctionView] = useState<AuctionView>('wheel');
  const [auctionRound, setAuctionRound] = useState<1 | 2>(1);
  const [soldPrice, setSoldPrice] = useState('');
  const [soldTo, setSoldTo] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [roundCompleteMsg, setRoundCompleteMsg] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);

  // Compute which players are eligible for the current round
  const round1Players = players.filter((p) => p.auction_status === 'pending');
  const round2Players = players.filter((p) => p.auction_status === 'unsold');
  const soldPlayers = players.filter((p) => p.auction_status === 'sold');
  const unsoldPlayers = players.filter((p) => p.auction_status === 'unsold');

  const eligiblePlayers = auctionRound === 1 ? round1Players : round2Players;

  // Compute team stats
  const teamStats = teams.map((team) => {
    const teamPlayers = soldPlayers.filter((p) => p.sold_to === team.name);
    const spent = teamPlayers.reduce((sum, p) => sum + (Number(p.sold_price) || 0), 0);
    const count = teamPlayers.length;
    const remainingBudget = teamTotalBudget - spent;
    const remainingPlayersNeeded = Math.max(0, maxPlayersPerTeam - count);
    
    // Max bid is what they can spend on ONE player while still having enough for others
    // Formula: Remaining Budget - ((slots needed - 1) * Base Price)
    const maxBid = remainingPlayersNeeded > 0 
      ? remainingBudget - ((remainingPlayersNeeded - 1) * playerBasePrice)
      : 0;

    return {
      ...team,
      spent,
      remainingBudget,
      count,
      remainingPlayersNeeded,
      maxBid,
      acquiredPlayers: teamPlayers,
    };
  });

  // Check if round 1 is complete (no pending players left)
  const round1Complete = round1Players.length === 0 && players.length > 0;
  const round2Complete = round2Players.length === 0 && round1Complete;
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
    setSelectedPlayer(null);
    setSoldPrice(String(playerBasePrice));
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
    // Switch to result view — hide wheel, show card
    setAuctionView('result');
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
    setSoldPrice(String(playerBasePrice));
    setAuctionView('wheel');
    setStatusUpdating(false);
  };

  const handleMarkUnsold = async () => {
    if (!selectedPlayer || statusUpdating) return;
    setStatusUpdating(true);
    await onUpdateStatus(selectedPlayer.id, 'unsold');
    setSelectedPlayer(null);
    setAuctionView('wheel');
    setStatusUpdating(false);
  };

  const handleBackToWheel = () => {
    setSelectedPlayer(null);
    setAuctionView('wheel');
  };

  const handleStartRound2 = () => {
    setAuctionRound(2);
    setRoundCompleteMsg(null);
    setSelectedPlayer(null);
    setAuctionView('wheel');
  };

  const handleReset = async () => {
    await onResetAuction();
    setAuctionRound(1);
    setSelectedPlayer(null);
    setAuctionView('wheel');
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
        teamTotalBudget,
        maxPlayersPerTeam,
      }
    : null;

  // Find the selected team for showing logo
  const selectedTeam = teams.find((t) => t.name === soldTo);

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

      <div className="auction-team-stats">
        <h3 className="auction-team-stats-title">
          Team Standings (Base: ₹{playerBasePrice.toLocaleString()} · Budget: ₹{teamTotalBudget.toLocaleString()} · Max Slots: {maxPlayersPerTeam})
        </h3>
        <div className="auction-team-stats-grid">
          {teamStats.map(ts => (
            <div key={ts.id} className={`team-stat-card ${expandedTeamId === ts.id ? 'expanded' : ''}`} onClick={() => setExpandedTeamId(expandedTeamId === ts.id ? null : ts.id)}>
              <div className="team-stat-main">
                <div className="team-stat-logo">
                  {ts.logo_url ? <img src={ts.logo_url} alt={ts.name} /> : <span>{ts.name.charAt(0)}</span>}
                </div>
                <div className="team-stat-info">
                  <div className="team-stat-name">{ts.name}</div>
                  <div className="team-stat-details">
                    <span className={ts.remainingBudget < playerBasePrice ? 'budget-over' : 'budget-ok'}>
                      Bal: ₹{ts.remainingBudget.toLocaleString()}
                    </span>
                    {' · '}
                    <span className={ts.remainingPlayersNeeded <= 0 ? 'roster-full' : 'roster-ok'}>
                      Slots: {ts.count}/{maxPlayersPerTeam}
                    </span>
                  </div>
                  <div className="team-stat-max-bid">
                    Max Bid Possible: <span className="max-bid-val">₹{ts.maxBid.toLocaleString()}</span>
                  </div>
                </div>
                <div className="team-expand-icon">{expandedTeamId === ts.id ? '🔼' : '🔽'}</div>
              </div>
              
              {expandedTeamId === ts.id && (
                <div className="team-acquired-list" onClick={(e) => e.stopPropagation()}>
                  <div className="acquired-list-summary">
                    <div className="summary-item">
                      <span className="label">Available Points:</span>
                      <span className="val budget-ok">₹{ts.remainingBudget.toLocaleString()}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Points Spent:</span>
                      <span className="val">₹{ts.spent.toLocaleString()}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Remaining Slots:</span>
                      <span className="val">{ts.remainingPlayersNeeded}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Max Possible Bid:</span>
                      <span className="val max-bid-val">₹{ts.maxBid.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="acquired-list-header">Acquired Players ({ts.count})</div>
                  {ts.acquiredPlayers.length > 0 ? (
                    <div className="acquired-grid-detailed">
                      {ts.acquiredPlayers.map(ap => (
                        <div key={ap.id} className="acquired-item-detailed">
                          <div className="ap-photo">
                            {ap.photo_url ? <img src={ap.photo_url} alt={ap.name} /> : <span>{ap.name.charAt(0)}</span>}
                          </div>
                          <div className="ap-info">
                            <div className="ap-name">{ap.name}</div>
                            <div className="ap-role">{ap.role || 'No Role'}</div>
                            <div className="ap-price">₹{Number(ap.sold_price).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="acquired-empty">No players acquired yet</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
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

      {/* ══ MAIN STAGE ══ */}
      {!auctionComplete && eligiblePlayers.length > 0 && (
        <div className="auction-stage">
          {/* ─── WHEEL VIEW ─── */}
          {auctionView === 'wheel' && (
            <div className="auction-wheel-center">
              <div className="wheel-glow-bg" />
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
          )}

          {/* ─── RESULT VIEW (Player Card) ─── */}
          {auctionView === 'result' && cardState && selectedPlayer && (
            <div className="auction-result-fullscreen">
              <div className="auction-result-glow" />
              <div className="auction-result-label">🏆 SELECTED PLAYER</div>
              <div className="auction-result-card-wrap">
                <PlayerCard state={cardState} />
              </div>

              {/* Sold/Unsold Actions */}
              <div className="auction-actions">
                <div className="auction-action-row">
                  <div className="form-group auction-input-group">
                    <label>Sold To (Team)</label>
                    {teams.length > 0 ? (
                      <div className="team-select-wrapper">
                        <select
                          value={soldTo}
                          onChange={(e) => setSoldTo(e.target.value)}
                          className="team-select"
                        >
                          <option value="">— Select Team —</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.name}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const selectedTeamObj = teams.find(t => t.name === soldTo);
                          if (selectedTeamObj && selectedTeamObj.logo_url) {
                            return (
                              <div className="team-select-logo">
                                <img src={selectedTeamObj.logo_url} alt={selectedTeamObj.name} />
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={soldTo}
                        onChange={(e) => setSoldTo(e.target.value)}
                        placeholder="e.g. Chennai Kings"
                      />
                    )}
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
                <button className="auction-back-to-wheel-btn" onClick={handleBackToWheel}>
                  ← Back to Wheel
                </button>
              </div>
            </div>
          )}
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
