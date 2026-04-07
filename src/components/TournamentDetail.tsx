'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import FormPanel from './FormPanel';
import PreviewPanel from './PreviewPanel';
import AuctionWheel from './AuctionWheel';
import PlayerCard from './PlayerCard';
import { PlayerCardState, TournamentInfo } from '../types';
import { getPlayers, createPlayer, updatePlayerAuctionStatus, resetAuction, getTeams, createTeam, deleteTeam } from '../lib/api';

type DetailTab = 'players' | 'teams' | 'create' | 'auction';

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

interface TournamentDetailProps {
  tournamentId: number;
  tournamentName: string;
  tournamentYear: string;
  clubName: string;
  clubLogoSrc: string | null;
  onBack: () => void;
  onEdit?: () => void;
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
  onEdit,
}: TournamentDetailProps) {
  const [tab, setTab] = useState<DetailTab>('players');
  const [players, setPlayers] = useState<PlayerFromAPI[]>([]);
  const [teams, setTeams] = useState<TeamFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [playerFilter, setPlayerFilter] = useState<'all' | 'pending' | 'sold' | 'unsold'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Team creation state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState<File | null>(null);
  const [newTeamLogoPreview, setNewTeamLogoPreview] = useState<string | null>(null);
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamMessage, setTeamMessage] = useState<string | null>(null);
  const teamLogoRef = useRef<HTMLInputElement>(null);

  // Revert confirmation modal
  const [revertPlayer, setRevertPlayer] = useState<PlayerFromAPI | null>(null);

  // Player card viewer modal
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

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

  // Fetch teams
  const fetchTeams = useCallback(async () => {
    try {
      const data = await getTeams(tournamentId);
      setTeams(data);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    } finally {
      setTeamsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchPlayers();
    fetchTeams();
  }, [fetchPlayers, fetchTeams]);

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

  // Team creation
  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || teamSaving) return;
    setTeamSaving(true);
    setTeamMessage(null);
    try {
      await createTeam({
        tournament: tournamentId,
        name: newTeamName.trim(),
        logo: newTeamLogo,
      });
      setNewTeamName('');
      setNewTeamLogo(null);
      setNewTeamLogoPreview(null);
      setTeamMessage('✅ Team created successfully!');
      fetchTeams();
      setTimeout(() => setTeamMessage(null), 3000);
    } catch (err) {
      console.error('Failed to create team:', err);
      setTeamMessage('⚠️ Failed to create team');
    } finally {
      setTeamSaving(false);
    }
  };

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!confirm(`Delete team "${teamName}"? This cannot be undone.`)) return;
    try {
      await deleteTeam(teamId);
      fetchTeams();
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  const handleTeamLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewTeamLogo(file);
      const reader = new FileReader();
      reader.onload = (ev) => setNewTeamLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Revert player to pending
  const handleRevertClick = (e: React.MouseEvent, player: PlayerFromAPI) => {
    e.stopPropagation();
    setRevertPlayer(player);
  };

  const handleRevertConfirm = async () => {
    if (!revertPlayer) return;
    try {
      await updatePlayerAuctionStatus(revertPlayer.id, {
        auction_status: 'pending',
        sold_price: null,
        sold_to: '',
      });
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === revertPlayer.id
            ? { ...p, auction_status: 'pending' as const, sold_price: null, sold_to: '' }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to revert player:', err);
    } finally {
      setRevertPlayer(null);
    }
  };

  const handleRevertCancel = () => {
    setRevertPlayer(null);
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
  const filteredPlayers = players.filter((p) => {
    const matchesFilter = playerFilter === 'all' || p.auction_status === playerFilter;
    const matchesSearch = searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Build card state for the viewer
  const viewerPlayer = viewerIndex !== null ? filteredPlayers[viewerIndex] : null;
  const viewerCardState: PlayerCardState | null = viewerPlayer
    ? {
        tournamentName,
        tournamentYear,
        clubLogoSrc,
        clubLogoFile: null,
        clubName,
        playerPhotoSrc: viewerPlayer.photo_url,
        playerPhotoFile: null,
        playerName: viewerPlayer.name,
        jerseyNumber: viewerPlayer.jersey_number,
        playerAge: viewerPlayer.age,
        playerPhone: viewerPlayer.phone,
        playerNationality: viewerPlayer.nationality,
        battingHand: viewerPlayer.batting_hand,
        bowlingHand: viewerPlayer.bowling_hand,
        bowlingStyle: '',
        roles: viewerPlayer.role ? [viewerPlayer.role] : [],
      }
    : null;

  const handleOpenViewer = (index: number) => {
    setViewerIndex(index);
  };
  const handleCloseViewer = () => {
    setViewerIndex(null);
  };
  const handlePrevPlayer = () => {
    if (viewerIndex === null) return;
    setViewerIndex(viewerIndex <= 0 ? filteredPlayers.length - 1 : viewerIndex - 1);
  };
  const handleNextPlayer = () => {
    if (viewerIndex === null) return;
    setViewerIndex(viewerIndex >= filteredPlayers.length - 1 ? 0 : viewerIndex + 1);
  };

  // Keyboard navigation for the viewer
  useEffect(() => {
    if (viewerIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseViewer();
      if (e.key === 'ArrowLeft') handlePrevPlayer();
      if (e.key === 'ArrowRight') handleNextPlayer();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

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
            <div className="detail-header-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {tournamentName}
              {onEdit && (
                <button className="edit-tournament-btn" onClick={onEdit} title="Edit Tournament Details" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '4px', opacity: 0.7 }}>
                  ✏️
                </button>
              )}
            </div>
            <div className="detail-header-meta">
              {tournamentYear && <span>{tournamentYear}</span>}
              {clubName && <span> · {clubName}</span>}
              <span> · {players.length} Players</span>
              <span> · {teams.length} Teams</span>
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
          className={`mode-tab ${tab === 'teams' ? 'active' : ''}`}
          onClick={() => setTab('teams')}
        >
          🏏 Teams ({teams.length})
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

          {/* Search Bar */}
          <div className="player-search-bar">
            <span className="player-search-icon">🔍</span>
            <input
              type="text"
              className="player-search-input"
              placeholder="Search players by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="player-search-clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
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
              {filteredPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  className={`player-list-item player-list-${p.auction_status} player-list-clickable`}
                  onClick={() => handleOpenViewer(idx)}
                >
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
                  {p.auction_status !== 'pending' && (
                    <button
                      className="player-revert-btn"
                      onClick={(e) => handleRevertClick(e, p)}
                      title="Revert to Pending"
                    >
                      ↩️
                    </button>
                  )}
                  <div className="player-list-view-icon">👁</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Teams Management ── */}
      {tab === 'teams' && (
        <div className="detail-players-tab">
          {/* Create Team Form */}
          <div className="team-create-card">
            <h3 className="team-create-title">➕ Create New Team</h3>
            <div className="team-create-form">
              <div className="team-create-logo-area">
                <input
                  type="file"
                  ref={teamLogoRef}
                  accept="image/*"
                  onChange={handleTeamLogoChange}
                />
                <div
                  className="team-logo-upload"
                  onClick={() => teamLogoRef.current?.click()}
                >
                  {newTeamLogoPreview ? (
                    <img src={newTeamLogoPreview} alt="Team Logo" />
                  ) : (
                    <div className="team-logo-placeholder">
                      <span>🏏</span>
                      <span className="team-logo-text">Logo</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="team-create-fields">
                <div className="form-group">
                  <label>Team Name</label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g. Chennai Super Kings"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateTeam();
                    }}
                  />
                </div>
                <button
                  className="team-create-btn"
                  onClick={handleCreateTeam}
                  disabled={teamSaving || !newTeamName.trim()}
                >
                  {teamSaving ? '⏳ Creating...' : '🏏 CREATE TEAM'}
                </button>
              </div>
            </div>
            {teamMessage && (
              <div className={`team-message ${teamMessage.startsWith('✅') ? 'success' : 'error'}`}>
                {teamMessage}
              </div>
            )}
          </div>

          {/* Teams List */}
          {teamsLoading ? (
            <div className="auction-loading">
              <div className="auction-loading-spinner" />
              <p>Loading teams...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '2rem' }}>
              <div className="icon">🏏</div>
              <p>No teams created yet. Create your first team above!</p>
            </div>
          ) : (
            <div className="teams-grid">
              {teams.map((team) => {
                // Count players sold to this team
                const teamPlayerCount = players.filter(
                  (p) => p.auction_status === 'sold' && p.sold_to === team.name
                ).length;

                return (
                  <div key={team.id} className="team-card">
                    <div className="team-card-logo">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} />
                      ) : (
                        <span className="team-card-logo-fallback">
                          {team.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="team-card-info">
                      <div className="team-card-name">{team.name}</div>
                      <div className="team-card-meta">
                        {teamPlayerCount > 0
                          ? `${teamPlayerCount} player${teamPlayerCount !== 1 ? 's' : ''} acquired`
                          : 'No players yet'}
                      </div>
                    </div>
                    <button
                      className="team-delete-btn"
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      title="Delete Team"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
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
            onEditTournament={onEdit || (() => {})}
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
          teams={teams}
          onUpdateStatus={handleUpdateStatus}
          onResetAuction={handleResetAuction}
          onRefreshPlayers={fetchPlayers}
        />
      )}

      {/* ── Player Card Viewer Modal ── */}
      {viewerIndex !== null && viewerCardState && viewerPlayer && (
        <div className="card-viewer-overlay" onClick={handleCloseViewer}>
          <div className="card-viewer-content" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button className="card-viewer-close" onClick={handleCloseViewer}>
              ✕
            </button>

            {/* Previous Button */}
            <button
              className="card-viewer-nav card-viewer-prev"
              onClick={handlePrevPlayer}
              disabled={filteredPlayers.length <= 1}
            >
              ‹
            </button>

            {/* Card + Info */}
            <div className="card-viewer-center">
              <div className="card-viewer-counter">
                {viewerIndex + 1} / {filteredPlayers.length}
              </div>
              <PlayerCard state={viewerCardState} />
              <div className="card-viewer-status-row">
                {viewerPlayer.auction_status === 'sold' && (
                  <div className="status-badge status-sold">
                    ✅ SOLD
                    {viewerPlayer.sold_to && (
                      <span className="sold-to-text">to {viewerPlayer.sold_to}</span>
                    )}
                    {viewerPlayer.sold_price && (
                      <span className="sold-price-text">
                        ₹{Number(viewerPlayer.sold_price).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
                {viewerPlayer.auction_status === 'unsold' && (
                  <div className="status-badge status-unsold">❌ UNSOLD</div>
                )}
                {viewerPlayer.auction_status === 'pending' && (
                  <div className="status-badge status-pending">⏳ PENDING</div>
                )}
              </div>
            </div>

            {/* Next Button */}
            <button
              className="card-viewer-nav card-viewer-next"
              onClick={handleNextPlayer}
              disabled={filteredPlayers.length <= 1}
            >
              ›
            </button>
          </div>
        </div>
      )}
      {/* ── Revert Confirmation Modal ── */}
      {revertPlayer && (
        <div className="confirm-overlay" onClick={handleRevertCancel}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">↩️</div>
            <h3 className="confirm-title">Revert Player Status</h3>
            <p className="confirm-message">
              Are you sure you want to revert{' '}
              <strong>{revertPlayer.name}</strong> from{' '}
              <span className={`confirm-status-label confirm-status-${revertPlayer.auction_status}`}>
                {revertPlayer.auction_status === 'sold' ? '✅ Sold' : '❌ Unsold'}
              </span>{' '}
              back to{' '}
              <span className="confirm-status-label confirm-status-pending">⏳ Pending</span>?
            </p>
            {revertPlayer.auction_status === 'sold' && revertPlayer.sold_to && (
              <div className="confirm-detail">
                <span>Team: {revertPlayer.sold_to}</span>
                {revertPlayer.sold_price && (
                  <span> · ₹{Number(revertPlayer.sold_price).toLocaleString()}</span>
                )}
              </div>
            )}
            <div className="confirm-actions">
              <button className="confirm-cancel-btn" onClick={handleRevertCancel}>
                Cancel
              </button>
              <button className="confirm-ok-btn" onClick={handleRevertConfirm}>
                Yes, Revert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
