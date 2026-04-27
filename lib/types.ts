export type GamePhase = "lobby" | "playing" | "finished";

export type Game = {
  id: string;
  code: string;
  host_player_id: string | null;
  phase: GamePhase;
  current_team_id: string | null;
  active_player_id: string | null;
  current_prompt_id: string | null;
  turn_number: number;
  round_number: number;
  created_at: string;
};

export type Player = {
  id: string;
  game_id: string;
  name: string;
  is_host: boolean;
  team_id: string | null;
  has_submitted: boolean;
  created_at: string;
};

export type Team = {
  id: string;
  game_id: string;
  name: string;
  score: number;
  sort_order: number;
};

export type Prompt = {
  id: string;
  game_id: string;
  player_id: string;
  text: string;
  status: "available" | "active" | "correct";
  deck_order: number | null;
  created_at: string;
};

export type Turn = {
  id: string;
  game_id: string;
  team_id: string;
  player_id: string;
  started_at: string;
  ended_at: string | null;
  correct_count: number;
  skip_count: number;
};

export type GameSnapshot = {
  game: Game;
  players: Player[];
  teams: Team[];
  prompts: Prompt[];
  activeTurn: Turn | null;
};
