export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameMode = 'CLASSIC' | 'OBSTACLES' | 'PORTALS' | 'SPEED_RUN';

export type FoodType = 'REGULAR' | 'GOLDEN' | 'SPEED_BOOST' | 'SLOW_MO' | 'SHIELD';

export interface Food {
  position: Position;
  type: FoodType;
  points: number;
  color: string;
  glowColor: string;
  expiresAt?: number; // timestamp for disappearing food
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number; // 0 to 1
  decay: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  mode: GameMode;
  level: number;
  date: string;
}

export interface Portal {
  entrance: Position;
  exit: Position;
  color: string;
}
