export const Role = {
  ATTENDANT: 'ATTENDANT',
  MECHANIC: 'MECHANIC',
  MANAGER: 'MANAGER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];
