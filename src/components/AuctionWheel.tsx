'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [editingAcquiredPrice, setEditingAcquiredPrice] = useState<{
    playerId: number;
    draft: string;
  } | null>(null);
  const [acquiredPriceSaveError, setAcquiredPriceSaveError] = useState<string | null>(null);
  const [acquiredPriceSaving, setAcquiredPriceSaving] = useState(false);

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
    
    // Headroom: surplus (positive) or shortfall (negative) if every open slot cost exactly base
    const maxPossibleBidDisplay =
      remainingPlayersNeeded > 0
        ? remainingBudget - remainingPlayersNeeded * playerBasePrice
        : 0;

    // Max for THIS pick if every other open slot is filled at base (must still be ≥ base to buy)
    const maxNextBidIfOthersAtBase =
      remainingPlayersNeeded > 0
        ? remainingBudget - (remainingPlayersNeeded - 1) * playerBasePrice
        : 0;
    const maxBid =
      remainingPlayersNeeded <= 0
        ? 0
        : maxNextBidIfOthersAtBase < playerBasePrice
          ? 0
          : maxNextBidIfOthersAtBase;

    return {
      ...team,
      spent,
      remainingBudget,
      count,
      remainingPlayersNeeded,
      maxBid,
      maxPossibleBidDisplay,
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

  /** Live validation for Mark as Sold (team budget / max bid / base / roster). */
  const saleValidation = useMemo(() => {
    const trimmed = soldTo.trim();
    const parsed = parseFloat(String(soldPrice).replace(/,/g, ''));
    const price = Number.isFinite(parsed) ? parsed : NaN;

    if (!trimmed) {
      return {
        error: null as string | null,
        canMarkSold: false,
        effectiveMax: null as number | null,
        priceInputInvalid: false,
      };
    }

    if (teams.length > 0) {
      const sel = teamStats.find((t) => t.name === trimmed);
      if (!sel) {
        return {
          error: 'Choose a team from the list.',
          canMarkSold: false,
          effectiveMax: null,
          priceInputInvalid: false,
        };
      }
      const effectiveMax = Math.max(0, sel.maxBid);
      if (sel.remainingPlayersNeeded <= 0) {
        return {
          error: `${trimmed} has no open slots (limit ${maxPlayersPerTeam}).`,
          canMarkSold: false,
          effectiveMax,
          priceInputInvalid: false,
        };
      }
      if (!Number.isFinite(price) || price <= 0) {
        return {
          error: 'Enter a valid price.',
          canMarkSold: false,
          effectiveMax,
          priceInputInvalid: true,
        };
      }
      if (price < playerBasePrice) {
        return {
          error: `Price must be at least base ₹${playerBasePrice.toLocaleString()}.`,
          canMarkSold: false,
          effectiveMax,
          priceInputInvalid: true,
        };
      }
      if (price > effectiveMax) {
        const capHint =
          effectiveMax <= 0
            ? ` Purse cannot cover base ₹${playerBasePrice.toLocaleString()} for this pick while reserving base for other open slots (${sel.remainingPlayersNeeded} left).`
            : '';
        return {
          error: `${trimmed} cannot pay more than ₹${effectiveMax.toLocaleString()} for this pick.${capHint}`,
          canMarkSold: false,
          effectiveMax,
          priceInputInvalid: true,
        };
      }
      return {
        error: null,
        canMarkSold: true,
        effectiveMax,
        priceInputInvalid: false,
      };
    }

    // No teams registered — free-text buyer name; only enforce base price
    if (!Number.isFinite(price) || price <= 0) {
      return {
        error: 'Enter a valid price.',
        canMarkSold: false,
        effectiveMax: null,
        priceInputInvalid: true,
      };
    }
    if (price < playerBasePrice) {
      return {
        error: `Price must be at least base ₹${playerBasePrice.toLocaleString()}.`,
        canMarkSold: false,
        effectiveMax: null,
        priceInputInvalid: true,
      };
    }
    return {
      error: null,
      canMarkSold: true,
      effectiveMax: null,
      priceInputInvalid: false,
    };
  }, [
    soldTo,
    soldPrice,
    teamStats,
    teams.length,
    playerBasePrice,
    maxPlayersPerTeam,
  ]);

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
    if (!saleValidation.canMarkSold) return;
    const price = parseFloat(String(soldPrice).replace(/,/g, ''));
    if (!Number.isFinite(price)) return;

    setStatusUpdating(true);
    try {
      await onUpdateStatus(selectedPlayer.id, 'sold', price, soldTo.trim() || undefined);
      setSelectedPlayer(null);
      setSoldPrice(String(playerBasePrice));
      setSoldTo('');
      setAuctionView('wheel');
    } finally {
      setStatusUpdating(false);
    }
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

  const startEditAcquiredPrice = (ap: PlayerFromAPI, e: React.MouseEvent) => {
    e.stopPropagation();
    setAcquiredPriceSaveError(null);
    setEditingAcquiredPrice({
      playerId: ap.id,
      draft: String(Number(ap.sold_price) || playerBasePrice),
    });
  };

  const cancelEditAcquiredPrice = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAcquiredPrice(null);
    setAcquiredPriceSaveError(null);
  };

  const saveAcquiredPlayerPrice = async (
    ap: PlayerFromAPI,
    ts: (typeof teamStats)[number],
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!editingAcquiredPrice || editingAcquiredPrice.playerId !== ap.id) return;
    const parsed = parseFloat(editingAcquiredPrice.draft.replace(/,/g, ''));
    const oldP = Number(ap.sold_price) || 0;
    const maxForRow = ts.remainingBudget + oldP;

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setAcquiredPriceSaveError('Enter a valid amount.');
      return;
    }
    if (parsed < playerBasePrice) {
      setAcquiredPriceSaveError(`Minimum ₹${playerBasePrice.toLocaleString()} (base price).`);
      return;
    }
    if (parsed > maxForRow) {
      setAcquiredPriceSaveError(
        `Max ₹${maxForRow.toLocaleString()} — would exceed team budget.`
      );
      return;
    }

    setAcquiredPriceSaving(true);
    setAcquiredPriceSaveError(null);
    try {
      await onUpdateStatus(ap.id, 'sold', parsed, ap.sold_to || ts.name);
      setEditingAcquiredPrice(null);
    } catch {
      setAcquiredPriceSaveError('Save failed. Try again.');
    } finally {
      setAcquiredPriceSaving(false);
    }
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
        playerBasePrice,
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
                    Max Possible Bid (slots × base − purse):{' '}
                    <span className={ts.maxBid > 0 ? 'max-bid-val' : 'budget-over'}>
                      {'\u20B9'}
                      {ts.maxBid.toLocaleString()}
                    </span>
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
                    <div className="summary-item summary-item-block">
                      <span className="label">Max Possible Bid (slots × base − purse):</span>
                      <span className={`val ${ts.maxBid > 0 ? 'max-bid-val' : 'budget-over'}`}>
                        {'\u20B9'}
                        {ts.maxBid.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="acquired-list-header">Acquired Players ({ts.count})</div>
                  {ts.acquiredPlayers.length > 0 ? (
                    <div className="acquired-grid-detailed">
                      {ts.acquiredPlayers.map((ap) => {
                        const oldP = Number(ap.sold_price) || 0;
                        const maxForRow = ts.remainingBudget + oldP;
                        const isEditing = editingAcquiredPrice?.playerId === ap.id;
                        return (
                          <div key={ap.id} className="acquired-item-detailed">
                            <div className="ap-photo">
                              {ap.photo_url ? (
                                <img src={ap.photo_url} alt={ap.name} />
                              ) : (
                                <span>{ap.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="ap-info">
                              <div className="ap-name">{ap.name}</div>
                              <div className="ap-role">{ap.role || 'No Role'}</div>
                            </div>
                            <div
                              className="ap-price-actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isEditing ? (
                                <div className="ap-price-edit-panel">
                                  <label className="ap-price-edit-label">Points</label>
                                  <input
                                    type="number"
                                    className="ap-price-edit-input"
                                    value={editingAcquiredPrice.draft}
                                    min={playerBasePrice}
                                    max={Math.max(playerBasePrice, maxForRow)}
                                    onChange={(e) =>
                                      setEditingAcquiredPrice({
                                        playerId: ap.id,
                                        draft: e.target.value,
                                      })
                                    }
                                    disabled={acquiredPriceSaving}
                                  />
                                  <div className="ap-price-edit-hint">
                                    Base {'\u20B9'}{playerBasePrice.toLocaleString()} · max {'\u20B9'}
                                    {maxForRow.toLocaleString()}
                                  </div>
                                  {acquiredPriceSaveError && isEditing && (
                                    <div className="ap-price-edit-error" role="alert">
                                      {acquiredPriceSaveError}
                                    </div>
                                  )}
                                  <div className="ap-price-edit-btns">
                                    <button
                                      type="button"
                                      className="ap-price-save-btn"
                                      disabled={acquiredPriceSaving}
                                      onClick={(e) => saveAcquiredPlayerPrice(ap, ts, e)}
                                    >
                                      {acquiredPriceSaving ? '…' : 'Save'}
                                    </button>
                                    <button
                                      type="button"
                                      className="ap-price-cancel-btn"
                                      disabled={acquiredPriceSaving}
                                      onClick={cancelEditAcquiredPrice}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="ap-price">
                                    {'\u20B9'}
                                    {Number(ap.sold_price).toLocaleString()}
                                  </div>
                                  <button
                                    type="button"
                                    className="ap-price-edit-btn"
                                    onClick={(e) => startEditAcquiredPrice(ap, e)}
                                  >
                                    Edit
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                          aria-invalid={!!saleValidation.error && teams.length > 0}
                        >
                          <option value="">— Select Team —</option>
                          {teams.map((t) => {
                            const st = teamStats.find((x) => x.id === t.id);
                            const full = st != null && st.remainingPlayersNeeded <= 0;
                            return (
                              <option key={t.id} value={t.name} disabled={full}>
                                {full ? `${t.name} (squad full)` : t.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={soldTo}
                        onChange={(e) => setSoldTo(e.target.value)}
                        placeholder="e.g. Chennai Kings"
                        aria-invalid={!!saleValidation.error}
                      />
                    )}
                    {teams.length > 0 && soldTo.trim() && saleValidation.effectiveMax !== null && (
                      <div className="auction-sale-hint">
                        Max for this pick:{' '}
                        <span className="max-bid-val">
                          {'₹'}
                          {saleValidation.effectiveMax.toLocaleString()}
                        </span>
                        {teamStats.find((t) => t.name === soldTo.trim())?.remainingPlayersNeeded === 0
                          ? ' · squad full'
                          : null}
                      </div>
                    )}
                  </div>
                  <div className="form-group auction-input-group">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      value={soldPrice}
                      onChange={(e) => setSoldPrice(e.target.value)}
                      placeholder={`Min ₹${playerBasePrice.toLocaleString()}`}
                      min={playerBasePrice}
                      max={
                        saleValidation.effectiveMax != null && saleValidation.effectiveMax > 0
                          ? Math.max(playerBasePrice, saleValidation.effectiveMax)
                          : undefined
                      }
                      className={saleValidation.priceInputInvalid ? 'auction-input-invalid' : undefined}
                      aria-invalid={saleValidation.priceInputInvalid}
                    />
                  </div>
                </div>
                {saleValidation.error && (
                  <div className="auction-validation-msg" role="alert">
                    <span className="auction-validation-icon" aria-hidden>
                      {'⚠️'}
                    </span>
                    {saleValidation.error}
                  </div>
                )}
                <div className="auction-action-buttons">
                  <button
                    className="auction-sold-btn"
                    onClick={handleMarkSold}
                    disabled={statusUpdating || !saleValidation.canMarkSold}
                    title={
                      !saleValidation.canMarkSold
                        ? 'Select a team and enter a price within that team’s max bid'
                        : undefined
                    }
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
