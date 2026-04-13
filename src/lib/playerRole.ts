const ROLES_WITHOUT_BOWLING = new Set(['Batsman', 'Wicket Keeper']);

/** Whether the primary role should show bowling hand in the form and on the card. */
export function roleShowsBowling(primaryRole: string | undefined): boolean {
  if (!primaryRole) return true;
  return !ROLES_WITHOUT_BOWLING.has(primaryRole);
}

export function isWicketKeeperDisplayRole(role: string): boolean {
  return role === 'Wicket Keeper' || role === 'Wicket-Keeper';
}
