export const PartType = {
  PART: 'PART',
  SUPPLY: 'SUPPLY',
} as const;

export type PartType = (typeof PartType)[keyof typeof PartType];
