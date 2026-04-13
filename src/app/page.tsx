'use client';
import React, { useState } from 'react';
import Header from '../components/Header';
import TournamentPicker, { type TournamentFromAPI } from '../components/TournamentPicker';
import TournamentSetup from '../components/TournamentSetup';
import TournamentDetail from '../components/TournamentDetail';
import { TournamentInfo } from '../types';
import { createTournament, updateTournament } from '../lib/api';

type AppView = 'picker' | 'setup' | 'detail' | 'edit';

interface SelectedTournament {
  id: number;
  name: string;
  year: string;
  club_name: string;
  club_logo_url: string | null;
  tournament_banner_url: string | null;
  team_total_budget?: number;
  max_players_per_team?: number;
  player_base_price?: number;
}

export default function Home() {
  const [view, setView] = useState<AppView>('picker');
  const [selectedTournament, setSelectedTournament] = useState<SelectedTournament | null>(null);

  const [tournament, setTournament] = useState<TournamentInfo>({
    tournamentName: '',
    tournamentYear: '',
    clubLogoSrc: null,
    clubLogoFile: null,
    tournamentBannerSrc: null,
    tournamentBannerFile: null,
    clubName: '',
    teamTotalBudget: 1000,
    maxPlayersPerTeam: 15,
    playerBasePrice: 10,
  });

  const [saving, setSaving] = useState(false);

  // Handle picking an existing tournament
  const handlePickTournament = (t: TournamentFromAPI) => {
    const playerBasePrice = t.player_base_price ?? 10;
    setSelectedTournament({
      id: t.id,
      name: t.name,
      year: t.year,
      club_name: t.club_name,
      club_logo_url: t.club_logo_url,
      tournament_banner_url: t.tournament_banner_url ?? null,
      team_total_budget: t.team_total_budget,
      max_players_per_team: t.max_players_per_team,
      player_base_price: playerBasePrice,
    });
    setTournament({
      tournamentName: t.name,
      tournamentYear: t.year,
      clubLogoSrc: t.club_logo_url,
      clubLogoFile: null,
      tournamentBannerSrc: t.tournament_banner_url ?? null,
      tournamentBannerFile: null,
      clubName: t.club_name,
      teamTotalBudget: t.team_total_budget,
      maxPlayersPerTeam: t.max_players_per_team,
      playerBasePrice,
    });
    setView('detail');
  };

  // Handle creating a new tournament
  const handleCreateNew = () => {
    setTournament({
      tournamentName: '',
      tournamentYear: '',
      clubLogoSrc: null,
      clubLogoFile: null,
      tournamentBannerSrc: null,
      tournamentBannerFile: null,
      clubName: '',
      teamTotalBudget: 1000,
      maxPlayersPerTeam: 15,
      playerBasePrice: 10,
    });
    setSelectedTournament(null);
    setView('setup');
  };

  const handleLockTournament = async () => {
    try {
      setSaving(true);
      const result = await createTournament({
        name: tournament.tournamentName,
        year: tournament.tournamentYear,
        club_name: tournament.clubName,
        club_logo: tournament.clubLogoFile,
        tournament_banner: tournament.tournamentBannerFile,
        team_total_budget: tournament.teamTotalBudget,
        max_players_per_team: tournament.maxPlayersPerTeam,
        player_base_price: tournament.playerBasePrice,
      });
      const bannerUrl =
        (result.tournament_banner_url as string | undefined) ??
        (result.banner_url as string | undefined) ??
        tournament.tournamentBannerSrc;
      setSelectedTournament({
        id: result.id,
        name: tournament.tournamentName,
        year: tournament.tournamentYear,
        club_name: tournament.clubName,
        club_logo_url: result.club_logo_url || tournament.clubLogoSrc,
        tournament_banner_url: bannerUrl ?? null,
        team_total_budget: result.team_total_budget,
        max_players_per_team: result.max_players_per_team,
        player_base_price: result.player_base_price,
      });
      setTournament((prev) => ({
        ...prev,
        clubLogoSrc: result.club_logo_url || prev.clubLogoSrc,
        clubLogoFile: null,
        tournamentBannerSrc: bannerUrl ?? prev.tournamentBannerSrc,
        tournamentBannerFile: null,
      }));
      setView('detail');
    } catch (error) {
      console.error('Failed to save tournament:', error);
      // Still navigate to detail even if save fails
      setView('detail');
    } finally {
      setSaving(false);
    }
  };

  const handleEditTournament = () => {
    if (selectedTournament) {
      setTournament({
        tournamentName: selectedTournament.name,
        tournamentYear: selectedTournament.year,
        clubLogoSrc: selectedTournament.club_logo_url,
        clubLogoFile: null,
        tournamentBannerSrc: selectedTournament.tournament_banner_url,
        tournamentBannerFile: null,
        clubName: selectedTournament.club_name,
        teamTotalBudget: selectedTournament.team_total_budget ?? 1000,
        maxPlayersPerTeam: selectedTournament.max_players_per_team ?? 15,
        playerBasePrice: selectedTournament.player_base_price ?? 10,
      });
    }
    setView('edit');
  };

  const handleSaveEditedTournament = async () => {
    if (!selectedTournament) return;
    try {
      setSaving(true);
      const result = await updateTournament(selectedTournament.id, {
        name: tournament.tournamentName,
        year: tournament.tournamentYear,
        club_name: tournament.clubName,
        club_logo: tournament.clubLogoFile,
        tournament_banner: tournament.tournamentBannerFile,
        team_total_budget: tournament.teamTotalBudget,
        max_players_per_team: tournament.maxPlayersPerTeam,
        player_base_price: tournament.playerBasePrice,
      });
      const bannerUrl =
        (result.tournament_banner_url as string | undefined) ??
        (result.banner_url as string | undefined) ??
        tournament.tournamentBannerSrc ??
        selectedTournament.tournament_banner_url;
      setSelectedTournament({
        ...selectedTournament,
        name: tournament.tournamentName,
        year: tournament.tournamentYear,
        club_name: tournament.clubName,
        club_logo_url: result.club_logo_url || tournament.clubLogoSrc,
        tournament_banner_url: bannerUrl ?? null,
        team_total_budget: result.team_total_budget,
        max_players_per_team: result.max_players_per_team,
        player_base_price: result.player_base_price,
      });
      setTournament((prev) => ({
        ...prev,
        clubLogoSrc: result.club_logo_url || prev.clubLogoSrc,
        clubLogoFile: null,
        tournamentBannerSrc: bannerUrl ?? prev.tournamentBannerSrc,
        tournamentBannerFile: null,
      }));
      setView('detail');
    } catch (error) {
      console.error('Failed to update tournament:', error);
      setView('detail');
    } finally {
      setSaving(false);
    }
  };

  const handleBackToPicker = () => {
    setView('picker');
    setSelectedTournament(null);
  };

  // ── VIEW: Tournament Picker (Home) ──
  if (view === 'picker') {
    return (
      <>
        <Header />
        <TournamentPicker
          onSelect={handlePickTournament}
          onCreateNew={handleCreateNew}
        />
      </>
    );
  }

  // ── VIEW: Tournament Setup (Create New) ──
  if (view === 'setup') {
    return (
      <>
        <Header />
        <div className="setup-back-row">
          <button className="auction-back-btn" onClick={handleBackToPicker}>
            ← Back to Tournaments
          </button>
        </div>
        <TournamentSetup
          tournament={tournament}
          setTournament={setTournament}
          onContinue={handleLockTournament}
          saving={saving}
        />
      </>
    );
  }

  // ── VIEW: Tournament Setup (Edit) ──
  if (view === 'edit') {
    return (
      <>
        <div className="setup-back-row">
          <button className="auction-back-btn" onClick={() => setView('detail')}>
            ← Cancel Edit
          </button>
        </div>
        <TournamentSetup
          tournament={tournament}
          setTournament={setTournament}
          onContinue={handleSaveEditedTournament}
          saving={saving}
          isEdit={true}
        />
      </>
    );
  }

  // ── VIEW: Tournament Detail ──
  return (
    <>
      {selectedTournament && (
        <TournamentDetail
          tournamentId={selectedTournament.id}
          tournamentName={selectedTournament.name}
          tournamentYear={selectedTournament.year}
          clubName={selectedTournament.club_name}
          clubLogoSrc={selectedTournament.club_logo_url}
          tournamentBannerSrc={selectedTournament.tournament_banner_url}
          teamTotalBudget={selectedTournament.team_total_budget || 1000}
          maxPlayersPerTeam={selectedTournament.max_players_per_team || 15}
          playerBasePrice={selectedTournament.player_base_price || 10}
          onBack={handleBackToPicker}
          onEdit={handleEditTournament}
        />
      )}
    </>
  );
}
