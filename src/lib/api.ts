const API_BASE = 'http://127.0.0.1:8000/api';

// ── Tournament API ─────────────────────────

export async function createTournament(data: {
  name: string;
  year: string;
  club_name: string;
  club_logo?: File | null;
}) {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('year', data.year);
  formData.append('club_name', data.club_name);
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
