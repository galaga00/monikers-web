import type { GameSnapshot, Player, Prompt, Team } from "./types";

export const ROUND_NAMES = ["Any Words", "One Word", "Charades"] as const;
export const TURN_DURATION_SECONDS = 60;
export const TURN_DURATION_OPTIONS = [60, 30] as const;
export const DEFAULT_TEAM_COUNT = 2;
export const DEFAULT_PROMPTS_PER_PLAYER = 3;
export const DEFAULT_CARDS_DEALT_PER_PLAYER = 10;
export const DEFAULT_CARDS_KEPT_PER_PLAYER = 5;
export const DEFAULT_TEAM_ASSIGNMENT_MODE = "auto";

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
  return `fish-bowl:${gameId}:player`;
}

export function getLegacyPlayerStorageKey(gameId: string) {
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

export function getDraftSelectedCountForPlayer(playerId: string, snapshot: GameSnapshot) {
  return snapshot.draftCards.filter((card) => card.player_id === playerId && card.selected).length;
}

export function hasPlayerDrafted(playerId: string, snapshot: GameSnapshot) {
  return getDraftSelectedCountForPlayer(playerId, snapshot) >= snapshot.game.cards_kept_per_player;
}

export function getPromptProgress(snapshot: GameSnapshot) {
  const perPlayer = snapshot.game.prompt_mode === "deck" ? snapshot.game.cards_kept_per_player : snapshot.game.prompts_per_player;
  const submittedTotal =
    snapshot.game.prompt_mode === "deck"
      ? snapshot.draftCards.filter((card) => card.selected).length
      : snapshot.prompts.length;
  const requiredTotal = snapshot.players.length * perPlayer;
  const expectedTotal = snapshot.game.expected_players ? snapshot.game.expected_players * perPlayer : null;
  return {
    submittedTotal,
    requiredTotal,
    expectedTotal,
    isComplete: snapshot.players.length > 0 && submittedTotal >= requiredTotal
  };
}

export function getTeamRoster(teamId: string, players: Player[]) {
  return players.filter((player) => player.team_id === teamId);
}

export function getTeamForPlayer(player: Player | null, teams: Team[]) {
  if (!player?.team_id) return null;
  return teams.find((team) => team.id === player.team_id) ?? null;
}

export function getNextPlayer(snapshot: GameSnapshot) {
  return getNextTurnAssignment(snapshot)?.player ?? null;
}

export function getNextTeamForPlayer(player: Player | null, teams: Team[]) {
  if (!player?.team_id) return teams[0] ?? null;
  return teams.find((team) => team.id === player.team_id) ?? teams[0] ?? null;
}

export function getFirstTurnAssignment(snapshot: GameSnapshot) {
  const teamsWithPlayers = getTeamsWithPlayers(snapshot);
  const firstTeam = teamsWithPlayers[0];
  const firstPlayer = firstTeam?.players[0];

  if (!firstTeam || !firstPlayer) return null;
  return { player: firstPlayer, team: firstTeam.team };
}

export function getNextTurnAssignment(snapshot: GameSnapshot) {
  const teamsWithPlayers = getTeamsWithPlayers(snapshot);
  if (teamsWithPlayers.length === 0) return null;

  const activeTeamIndex = teamsWithPlayers.findIndex((entry) => entry.team.id === snapshot.game.current_team_id);
  const safeActiveTeamIndex = activeTeamIndex >= 0 ? activeTeamIndex : 0;

  for (let offset = 1; offset <= teamsWithPlayers.length; offset += 1) {
    const nextTeamEntry = teamsWithPlayers[(safeActiveTeamIndex + offset) % teamsWithPlayers.length];
    if (nextTeamEntry.players.length === 0) continue;

    const previousTeamEntry = teamsWithPlayers[safeActiveTeamIndex];
    const previousPlayerIndex =
      previousTeamEntry?.team.id === nextTeamEntry.team.id
        ? previousTeamEntry.players.findIndex((player) => player.id === snapshot.game.active_player_id)
        : -1;
    const nextPlayer = nextTeamEntry.players[(previousPlayerIndex + 1 + nextTeamEntry.players.length) % nextTeamEntry.players.length];
    return { player: nextPlayer, team: nextTeamEntry.team };
  }

  return null;
}

function getTeamsWithPlayers(snapshot: GameSnapshot) {
  return snapshot.teams
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((team) => ({
      team,
      players: snapshot.players
        .filter((player) => player.team_id === team.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
    }))
    .filter((entry) => entry.players.length > 0);
}

export function getRoundName(roundNumber: number) {
  return ROUND_NAMES[roundNumber - 1] ?? `Round ${roundNumber}`;
}

export function isFinalRound(roundNumber: number) {
  return roundNumber >= ROUND_NAMES.length;
}

export function getRoundSummary(roundNumber: number) {
  if (roundNumber === 1) return "Say anything except the prompt itself.";
  if (roundNumber === 2) return "Give exactly one word as the clue.";
  if (roundNumber === 3) return "No words or sounds. Act it out.";
  return "Keep the clues moving.";
}

export function getTeamBalanceWarning(snapshot: GameSnapshot) {
  const rosterSizes = snapshot.teams.map((team) => getTeamRoster(team.id, snapshot.players).length);
  if (rosterSizes.length < 2) return null;
  const smallest = Math.min(...rosterSizes);
  const largest = Math.max(...rosterSizes);
  if (largest - smallest <= 1) return null;
  return `Teams look uneven: one team has ${largest} players and another has ${smallest}.`;
}

export function getWinningTeams(teams: Team[]) {
  if (teams.length === 0) return [];
  const bestScore = Math.max(...teams.map((team) => team.score));
  return teams.filter((team) => team.score === bestScore);
}

export function getTurnSecondsLeft(startedAt: string | null | undefined, durationSeconds = TURN_DURATION_SECONDS, now = Date.now()) {
  if (!startedAt) return durationSeconds;
  const elapsedSeconds = Math.floor((now - new Date(startedAt).getTime()) / 1000);
  return Math.max(0, durationSeconds - elapsedSeconds);
}
