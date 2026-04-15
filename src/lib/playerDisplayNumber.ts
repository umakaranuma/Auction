/**
 * Sequential roster numbers (01, 02, …) for the tournament, independent of DB id gaps.
 * Order: registration time (created_at), then id.
 */

export interface PlayerWithDisplayOrder {
  id: number;
  created_at?: string | null;
}

export function sortPlayersForDisplayOrder<T extends PlayerWithDisplayOrder>(players: T[]): T[] {
  return [...players].sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : NaN;
    const tb = b.created_at ? Date.parse(b.created_at) : NaN;
    const da = Number.isFinite(ta) ? ta : 0;
    const db = Number.isFinite(tb) ? tb : 0;
    if (da !== db) return da - db;
    return a.id - b.id;
  });
}

export function formatPlayerDisplayNumber(n: number): string {
  if (n < 1) return '';
  return n < 100 ? String(n).padStart(2, '0') : String(n);
}

export function getPlayerDisplayNumber(
  players: PlayerWithDisplayOrder[],
  playerId: number
): string {
  const sorted = sortPlayersForDisplayOrder(players);
  const idx = sorted.findIndex((p) => p.id === playerId);
  if (idx === -1) return '';
  return formatPlayerDisplayNumber(idx + 1);
}

/** Display number for the next player to be added (last in registration order). */
export function getNextPlayerDisplayNumber(players: PlayerWithDisplayOrder[]): string {
  return formatPlayerDisplayNumber(players.length + 1);
}
