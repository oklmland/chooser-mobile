export const PLAYER_COLORS: string[] = [
  '#5AC8FA',
  '#FF9F0A',
  '#34C759',
  '#FF375F',
  '#BF5AF2',
  '#FFD60A',
  '#64D2FF',
  '#FF6482',
  '#30D158',
  '#A78BFA',
];

export const LOSER_COLOR = '#FF3B30';

export const WHEEL_COLORS: string[] = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFD93D',
  '#6C5CE7',
  '#1A936F',
  '#FF9F1C',
  '#5AC8FA',
  '#FF6482',
  '#A78BFA',
  '#34C759',
];

export function colorForIndex(index: number, palette: string[]): string {
  return palette[index % palette.length];
}
