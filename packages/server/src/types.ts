export interface Env {
  DISCORD_CLIENT_SECRET: string;
  VITE_DISCORD_CLIENT_ID: string;
  LEADERBOARDS: KVNamespace;
  ENVIRONMENT: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  guesses: number;
  timeMs: number;
  timestamp: number;
}
