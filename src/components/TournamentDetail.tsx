'use client';
import React, { useState, useEffect, useCallback } from 'react';
import FormPanel from './FormPanel';
import PreviewPanel from './PreviewPanel';
import AuctionWheel from './AuctionWheel';
import { PlayerCardState, TournamentInfo } from '../types';
import { getPlayers, createPlayer, updatePlayerAuctionStatus, resetAuction } from '../lib/api';

type DetailTab = 'players' | 'create' | 'auction';

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

interface TournamentDetailProps {
  tournamentId: number;
  tournamentName: string;
  tournamentYear: string;
  clubName: string;
  clubLogoSrc: string | null;
  onBack: () => void;
}

const defaultPlayerFields = {
  playerPhotoSrc: null as string | null,
  playerPhotoFile: null as File | null,
  playerName: '',
  jerseyNumber: '',
  playerAge: '',
  playerPhone: '',
  playerNationality: '',
  battingHand: 'Right Hand' as const,
  bowlingHand: 'Right Arm' as const,
  bowlingStyle: '',
  roles: [] as string[],
};

export default function TournamentDetail({
  tournamentId,
  tournamentName,
  tournamentYear,
  clubName,
  clubLogoSrc,
  onBack,
}: TournamentDetailProps) {
  const [tab, setTab] = useState<DetailTab>('players');
  const [players, setPlayers] = useState<PlayerFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [playerFilter, setPlayerFilter] = useState<'all' | 'pending' | 'sold' | 'unsold'>('all');

  const tournament: TournamentInfo = {
    tournamentName,
    tournamentYear,
    clubLogoSrc,
    clubLogoFile: null,
    clubName,
  };

  const [state, setState] = useState<PlayerCardState>({
    ...tournament,
    ...defaultPlayerFields,
  });

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    try {
      const data = await getPlayers(tournamentId);
      setPlayers(data);
    } catch (err) {
      console.error('Failed to fetch players:', err);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Player creation
  const handleGenerate = async () => {
    setShowCard(true);
    setSaveMessage(null);
    if (state.playerName.trim()) {
      try {
        setSaving(true);
        await createPlayer({
          tournament: tournamentId,
          name: state.playerName,
          photo: state.playerPhotoFile,
          jersey_number: state.jerseyNumber,
          age: state.playerAge,
          phone: state.playerPhone,
          nationality: state.playerNationality,
          batting_hand: state.battingHand,
          bowling_hand: state.bowlingHand,
          role: state.roles.length > 0 ? state.roles[0] : '',
        });
        setSaveMessage('✅ Player saved successfully!');
        fetchPlayers(); // Refresh players list
      } catch (error) {
        console.error('Failed to save player:', error);
        setSaveMessage('⚠️ Card generated but failed to save');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleNewPlayer = () => {
    setState({ ...tournament, ...defaultPlayerFields });
    setShowCard(false);
    setSaveMessage(null);
  };

  // Auction status update
  const handleUpdateStatus = async (
    playerId: number,
    status: 'sold' | 'unsold',
    soldPrice?: number,
    soldTo?: string
  ) => {
    try {
      await updatePlayerAuctionStatus(playerId, {
        auction_status: status,
        sold_price: soldPrice || null,
        sold_to: soldTo || '',
      });
      // Update local state
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? { ...p, auction_status: status, sold_price: soldPrice || null, sold_to: soldTo || '' }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to update auction status:', err);
    }
  };

  // Reset auction
  const handleResetAuction = async () => {
    if (!confirm('Reset the entire auction? All players will go back to pending.')) return;
    try {
      await resetAuction(tournamentId);
      setPlayers((prev) =>
        prev.map((p) => ({ ...p, auction_status: 'pending' as const, sold_price: null, sold_to: '' }))
      );
    } catch (err) {
      console.error('Failed to reset auction:', err);
    }
  };

  // Computed stats
  const soldCount = players.filter((p) => p.auction_status === 'sold').length;
  const unsoldCount = players.filter((p) => p.auction_status === 'unsold').length;
  const pendingCount = players.filter((p) => p.auction_status === 'pending').length;

  // Filtered players
  const filteredPlayers =
    playerFilter === 'all'
      ? players
      : players.filter((p) => p.auction_status === playerFilter);

  return (
    <div className="detail-wrapper">
      {/* Tournament Header Bar */}
      <div className="detail-header-bar">
        <button className="auction-back-btn" onClick={onBack}>
          ← Tournaments
        </button>
        <div className="detail-header-info">
          {clubLogoSrc && (
            <div className="detail-header-logo">
              <img src={clubLogoSrc} alt={clubName} />
            </div>
          )}
          <div>
            <div className="detail-header-name">{tournamentName}</div>
            <div className="detail-header-meta">
              {tournamentYear && <span>{tournamentYear}</span>}
              {clubName && <span> · {clubName}</span>}
              <span> · {players.length} Players</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mode-switcher">
        <button
          className={`mode-tab ${tab === 'players' ? 'active' : ''}`}
          onClick={() => setTab('players')}
        >
          📋 Players ({players.length})
        </button>
        <button
          className={`mode-tab ${tab === 'create' ? 'active' : ''}`}
          onClick={() => setTab('create')}
        >
          ➕ Add Player
        </button>
        <button
          className={`mode-tab ${tab === 'auction' ? 'active' : ''}`}
          onClick={() => setTab('auction')}
        >
          🎰 Auction
        </button>
      </div>

      {/* ── TAB: Players List ── */}
      {tab === 'players' && (
        <div className="detail-players-tab">
          {/* Stats Summary */}
          <div className="auction-stats-bar">
            <div className="auction-stat-item">
              <span className="auction-stat-num">{players.length}</span>
              <span className="auction-stat-label">Total</span>
            </div>
            <div className="auction-stat-item auction-stat-pending">
              <span className="auction-stat-num">{pendingCount}</span>
              <span className="auction-stat-label">Pending</span>
            </div>
            <div className="auction-stat-item auction-stat-sold">
              <span className="auction-stat-num">{soldCount}</span>
              <span className="auction-stat-label">Sold</span>
            </div>
            <div className="auction-stat-item auction-stat-unsold">
              <span className="auction-stat-num">{unsoldCount}</span>
              <span className="auction-stat-label">Unsold</span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            {(['all', 'pending', 'sold', 'unsold'] as const).map((f) => (
              <button
                key={f}
                className={`filter-tab ${playerFilter === f ? 'active' : ''}`}
                onClick={() => setPlayerFilter(f)}
              >
                {f === 'all' && '📋 All'}
                {f === 'pending' && '⏳ Pending'}
                {f === 'sold' && '✅ Sold'}
                {f === 'unsold' && '❌ Unsold'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="auction-loading">
              <div className="auction-loading-spinner" />
              <p>Loading players...</p>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <p>
                {playerFilter === 'all'
                  ? 'No players registered yet. Go to "Add Player" to register some!'
                  : `No ${playerFilter} players.`}
              </p>
            </div>
          ) : (
            <div className="players-list">
              {filteredPlayers.map((p) => (
                <div key={p.id} className={`player-list-item player-list-${p.auction_status}`}>
                  <div className="player-list-avatar">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} />
                    ) : (
                      <span className="player-list-avatar-fallback">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="player-list-info">
                    <div className="player-list-name">{p.name}</div>
                    <div className="player-list-meta">
                      {p.jersey_number && <span>#{p.jersey_number}</span>}
                      {p.role && <span className="player-list-role">{p.role}</span>}
                      {p.age && <span>Age: {p.age}</span>}
                    </div>
                  </div>
                  <div className="player-list-status">
                    {p.auction_status === 'sold' && (
                      <div className="status-badge status-sold">
                        ✅ SOLD
                        {p.sold_to && <span className="sold-to-text">to {p.sold_to}</span>}
                        {p.sold_price && <span className="sold-price-text">₹{Number(p.sold_price).toLocaleString()}</span>}
                      </div>
                    )}
                    {p.auction_status === 'unsold' && (
                      <div className="status-badge status-unsold">❌ UNSOLD</div>
                    )}
                    {p.auction_status === 'pending' && (
                      <div className="status-badge status-pending">⏳ PENDING</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Add Player ── */}
      {tab === 'create' && (
        <div className="main">
          <FormPanel
            state={state}
            setState={setState}
            tournament={tournament}
            onGenerate={handleGenerate}
            onEditTournament={() => {}}
            onNewPlayer={handleNewPlayer}
            showCard={showCard}
            saving={saving}
          />
          <PreviewPanel state={state} showCard={showCard} saveMessage={saveMessage} />
        </div>
      )}

      {/* ── TAB: Auction ── */}
      {tab === 'auction' && (
        <AuctionWheel
          tournamentId={tournamentId}
          tournamentName={tournamentName}
          tournamentYear={tournamentYear}
          clubLogoSrc={clubLogoSrc}
          clubName={clubName}
          players={players}
          onUpdateStatus={handleUpdateStatus}
          onResetAuction={handleResetAuction}
          onRefreshPlayers={fetchPlayers}
        />
      )}
    </div>
  );
}
