export const TeamRole = {
  ATTENDANT: 'ATTENDANT',
  MECHANIC: 'MECHANIC',
  MANAGER: 'MANAGER',
} as const;

export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];

export const Role = { ...TeamRole, CUSTOMER: 'CUSTOMER' } as const;

export type Role = (typeof Role)[keyof typeof Role];

const TEAM_ROLES: readonly Role[] = Object.values(TeamRole);

export const isTeamRole = (role: Role): role is TeamRole =>
  TEAM_ROLES.includes(role);
