const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  (process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:8000/api'
    : 'https://auction_backend-production.up.railway.app/api');

// ── Tournament API ─────────────────────────

export async function createTournament(data: {
  name: string;
  year: string;
  club_name: string;
  club_logo?: File | null;
  team_total_budget?: number;
  max_players_per_team?: number;
  player_base_price?: number;
}) {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('year', data.year);
  formData.append('club_name', data.club_name);
  if (data.team_total_budget !== undefined) {
    formData.append('team_total_budget', String(data.team_total_budget));
  }
  if (data.max_players_per_team !== undefined) {
    formData.append('max_players_per_team', String(data.max_players_per_team));
  }
  if (data.player_base_price !== undefined) {
    formData.append('player_base_price', String(data.player_base_price));
  }
  if (data.club_logo) {
    formData.append('club_logo', data.club_logo);
  }

  const res = await fetch(`${API_BASE}/tournaments/`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to create tournament');
  return res.json();
}

export async function updateTournament(id: number, data: {
  name: string;
  year: string;
  club_name: string;
  club_logo?: File | null;
  team_total_budget?: number;
  max_players_per_team?: number;
  player_base_price?: number;
}) {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('year', data.year);
  formData.append('club_name', data.club_name);
  if (data.team_total_budget !== undefined) {
    formData.append('team_total_budget', String(data.team_total_budget));
  }
  if (data.max_players_per_team !== undefined) {
    formData.append('max_players_per_team', String(data.max_players_per_team));
  }
  if (data.player_base_price !== undefined) {
    formData.append('player_base_price', String(data.player_base_price));
  }
  if (data.club_logo) {
    formData.append('club_logo', data.club_logo);
  }

  const res = await fetch(`${API_BASE}/tournaments/${id}/`, {
    method: 'PATCH',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to update tournament');
  return res.json();
}

export async function getTournaments() {
  const res = await fetch(`${API_BASE}/tournaments/`);
  if (!res.ok) throw new Error('Failed to fetch tournaments');
  return res.json();
}

export async function getTournament(id: number) {
  const res = await fetch(`${API_BASE}/tournaments/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch tournament');
  return res.json();
}

export async function resetAuction(tournamentId: number) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/reset-auction/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to reset auction');
  return res.json();
}

export async function clearPlayers(tournamentId: number) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/clear-players/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to clear players');
  return res.json();
}

// ── Team API ───────────────────────────────

export async function getTeams(tournamentId: number) {
  const res = await fetch(`${API_BASE}/teams/?tournament=${tournamentId}`);
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
}

export async function createTeam(data: {
  tournament: number;
  name: string;
  logo?: File | null;
}) {
  const formData = new FormData();
  formData.append('tournament', String(data.tournament));
  formData.append('name', data.name);
  if (data.logo) {
    formData.append('logo', data.logo);
  }

  const res = await fetch(`${API_BASE}/teams/`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

export async function updateTeam(id: number, data: {
  name?: string;
  logo?: File | null;
}) {
  const formData = new FormData();
  if (data.name !== undefined) formData.append('name', data.name);
  if (data.logo) formData.append('logo', data.logo);

  const res = await fetch(`${API_BASE}/teams/${id}/`, {
    method: 'PATCH',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to update team');
  return res.json();
}

export async function deleteTeam(id: number) {
  const res = await fetch(`${API_BASE}/teams/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete team');
}

// ── Player API ─────────────────────────────

export async function createPlayer(data: {
  tournament: number;
  name: string;
  photo?: File | null;
  jersey_number: string;
  age: string;
  phone: string;
  nationality: string;
  batting_hand: string;
  bowling_hand: string;
  role: string;
}) {
  const formData = new FormData();
  formData.append('tournament', String(data.tournament));
  formData.append('name', data.name);
  if (data.photo) {
    formData.append('photo', data.photo);
  }
  formData.append('jersey_number', data.jersey_number);
  formData.append('age', data.age);
  formData.append('phone', data.phone);
  formData.append('nationality', data.nationality);
  formData.append('batting_hand', data.batting_hand);
  formData.append('bowling_hand', data.bowling_hand);
  formData.append('role', data.role);

  const res = await fetch(`${API_BASE}/players/`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

export async function getPlayers(tournamentId?: number) {
  const url = tournamentId
    ? `${API_BASE}/players/?tournament=${tournamentId}`
    : `${API_BASE}/players/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch players');
  return res.json();
}

export async function deletePlayer(id: number) {
  const res = await fetch(`${API_BASE}/players/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete player');
}

export async function updatePlayer(id: number, data: {
  name?: string;
  photo?: File | null;
  jersey_number?: string;
  age?: string;
  phone?: string;
  nationality?: string;
  batting_hand?: string;
  bowling_hand?: string;
  role?: string;
}) {
  const formData = new FormData();
  if (data.name !== undefined) formData.append('name', data.name);
  if (data.photo) formData.append('photo', data.photo);
  if (data.jersey_number !== undefined) formData.append('jersey_number', data.jersey_number);
  if (data.age !== undefined) formData.append('age', data.age);
  if (data.phone !== undefined) formData.append('phone', data.phone);
  if (data.nationality !== undefined) formData.append('nationality', data.nationality);
  if (data.batting_hand !== undefined) formData.append('batting_hand', data.batting_hand);
  if (data.bowling_hand !== undefined) formData.append('bowling_hand', data.bowling_hand);
  if (data.role !== undefined) formData.append('role', data.role);

  const res = await fetch(`${API_BASE}/players/${id}/`, {
    method: 'PATCH',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

export async function updatePlayerAuctionStatus(
  playerId: number,
  data: {
    auction_status: 'pending' | 'sold' | 'unsold';
    sold_price?: number | null;
    sold_to?: string;
  }
) {
  const res = await fetch(`${API_BASE}/players/${playerId}/auction-status/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update auction status');
  return res.json();
}
