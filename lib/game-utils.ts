import type { GameSnapshot, Player, Prompt, Team } from "./types";

export const ROUND_NAMES = ["Any Words", "One Word", "Charades"] as const;
export const TURN_DURATION_SECONDS = 60;
export const DEFAULT_TEAM_COUNT = 2;
export const DEFAULT_PROMPTS_PER_PLAYER = 3;

export function createJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function getPlayerStorageKey(gameId: string) {
  return `monikers-mvp:${gameId}:player`;
}

export function getAvailablePrompts(prompts: Prompt[]) {
  return prompts
    .filter((prompt) => prompt.status === "available")
    .sort((a, b) => (a.deck_order ?? 9999) - (b.deck_order ?? 9999));
}

export function getSubmittedCount(players: Player[]) {
  return players.filter((player) => player.has_submitted).length;
}

export function getPromptCountForPlayer(playerId: string, prompts: Prompt[]) {
  return prompts.filter((prompt) => prompt.player_id === playerId).length;
}

export function hasPlayerSubmitted(playerId: string, prompts: Prompt[], requiredCount: number) {
  return getPromptCountForPlayer(playerId, prompts) >= requiredCount;
}

export function getPromptProgress(snapshot: GameSnapshot) {
  const requiredTotal = snapshot.players.length * snapshot.game.prompts_per_player;
  return {
    submittedTotal: snapshot.prompts.length,
    requiredTotal,
    isComplete: snapshot.players.length > 0 && snapshot.prompts.length >= requiredTotal
  };
}

export function getTeamForPlayer(player: Player | null, teams: Team[]) {
  if (!player?.team_id) return null;
  return teams.find((team) => team.id === player.team_id) ?? null;
}

export function getNextPlayer(snapshot: GameSnapshot) {
  const roster = snapshot.players
    .filter((player) => player.team_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  if (roster.length === 0) return null;

  const activeIndex = roster.findIndex((player) => player.id === snapshot.game.active_player_id);
  return roster[(activeIndex + 1 + roster.length) % roster.length];
}

export function getNextTeamForPlayer(player: Player | null, teams: Team[]) {
  if (!player?.team_id) return teams[0] ?? null;
  return teams.find((team) => team.id === player.team_id) ?? teams[0] ?? null;
}

export function getRoundName(roundNumber: number) {
  return ROUND_NAMES[roundNumber - 1] ?? `Round ${roundNumber}`;
}

export function isFinalRound(roundNumber: number) {
  return roundNumber >= ROUND_NAMES.length;
}

export function getTurnSecondsLeft(startedAt: string | null | undefined, now = Date.now()) {
  if (!startedAt) return TURN_DURATION_SECONDS;
  const elapsedSeconds = Math.floor((now - new Date(startedAt).getTime()) / 1000);
  return Math.max(0, TURN_DURATION_SECONDS - elapsedSeconds);
}
