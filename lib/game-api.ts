"use client";

import { hasSupabaseConfig, supabase } from "./supabase";
import type { Game, GameSnapshot, Player, Prompt, PromptMode, Team, Turn } from "./types";
import {
  createJoinCode,
  DEFAULT_PROMPTS_PER_PLAYER,
  DEFAULT_TEAM_ASSIGNMENT_MODE,
  getNextPlayer,
  getNextTeamForPlayer,
  hasPlayerSubmitted,
  isFinalRound,
  shuffle
} from "./game-utils";

function ensureSupabaseConfig() {
  if (!hasSupabaseConfig) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

export async function createGame(hostName: string) {
  ensureSupabaseConfig();
  let game: Game | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 5 && !game; attempt += 1) {
    const { data, error } = await supabase
      .from("games")
      .insert({
        code: createJoinCode(),
        phase: "setup",
        prompts_per_player: DEFAULT_PROMPTS_PER_PLAYER,
        team_assignment_mode: DEFAULT_TEAM_ASSIGNMENT_MODE,
        prompt_mode: "free"
      })
      .select("*")
      .single<Game>();

    if (error) {
      lastError = error;
    } else {
      game = data;
    }
  }

  if (!game) throw lastError ?? new Error("Could not create game.");

  const { data: host, error: hostError } = await supabase
    .from("players")
    .insert({
      game_id: game.id,
      name: hostName.trim() || "Host",
      is_host: true
    })
    .select("*")
    .single<Player>();

  if (hostError) throw hostError;

  const { data: updatedGame, error: updateError } = await supabase
    .from("games")
    .update({ host_player_id: host.id })
    .eq("id", game.id)
    .select("*")
    .single<Game>();

  if (updateError) throw updateError;
  return { game: updatedGame, player: host };
}

export async function saveGameSetup(
  gameId: string,
  promptsPerPlayer: number,
  teamNames: string[],
  teamAssignmentMode: "auto" | "choose",
  promptMode: PromptMode,
  expectedPlayers?: number | null
) {
  ensureSupabaseConfig();
  const cleanPromptsPerPlayer = Math.min(20, Math.max(1, Math.round(promptsPerPlayer)));
  const cleanTeamNames = teamNames.map((name, index) => name.trim() || `Team ${index + 1}`).slice(0, 12);
  const cleanExpectedPlayers = expectedPlayers ? Math.min(200, Math.max(1, Math.round(expectedPlayers))) : null;

  if (cleanTeamNames.length < 1) throw new Error("Add at least one team.");

  const { error: deleteError } = await supabase.from("teams").delete().eq("game_id", gameId);
  if (deleteError) throw deleteError;

  const { data: teams, error: teamError } = await supabase
    .from("teams")
    .insert(cleanTeamNames.map((name, sort_order) => ({ game_id: gameId, name, sort_order })))
    .select("*")
    .order("sort_order");

  if (teamError) throw teamError;

  const firstTeam = (teams as Team[])[0];
  const { error: gameError } = await supabase
    .from("games")
    .update({
      prompts_per_player: cleanPromptsPerPlayer,
      expected_players: cleanExpectedPlayers,
      team_assignment_mode: teamAssignmentMode,
      prompt_mode: promptMode,
      phase: "lobby"
    })
    .eq("id", gameId);

  if (gameError) throw gameError;

  const { error: hostError } = await supabase.from("players").update({ team_id: firstTeam.id }).eq("game_id", gameId).eq("is_host", true);
  if (hostError) throw hostError;
}

export async function joinGame(code: string, playerName: string) {
  ensureSupabaseConfig();
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("code", code)
    .single<Game>();

  if (gameError) throw new Error("No game found for that code.");
  if (game.phase === "setup") throw new Error("The host is still setting up this game.");

  const { data: teams, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("game_id", game.id)
    .order("sort_order");

  if (teamError) throw teamError;

  const { count, error: countError } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("game_id", game.id);

  if (countError) throw countError;

  const team = teams?.[(count ?? 0) % Math.max(teams.length, 1)] as Team | undefined;
  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({
      game_id: game.id,
      name: playerName.trim() || `Player ${(count ?? 0) + 1}`,
      team_id: game.team_assignment_mode === "auto" ? (team?.id ?? null) : null
    })
    .select("*")
    .single<Player>();

  if (playerError) throw playerError;
  return { game, player };
}

export async function loadSnapshot(gameId: string) {
  ensureSupabaseConfig();
  const [gameResult, playersResult, teamsResult, promptsResult, turnResult] = await Promise.all([
    supabase.from("games").select("*").eq("id", gameId).single<Game>(),
    supabase.from("players").select("*").eq("game_id", gameId).order("created_at"),
    supabase.from("teams").select("*").eq("game_id", gameId).order("sort_order"),
    supabase.from("prompts").select("*").eq("game_id", gameId).order("deck_order", { nullsFirst: false }),
    supabase
      .from("turns")
      .select("*")
      .eq("game_id", gameId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle<Turn>()
  ]);

  if (gameResult.error) throw gameResult.error;
  if (playersResult.error) throw playersResult.error;
  if (teamsResult.error) throw teamsResult.error;
  if (promptsResult.error) throw promptsResult.error;
  if (turnResult.error) throw turnResult.error;

  return {
    game: gameResult.data,
    players: playersResult.data as Player[],
    teams: teamsResult.data as Team[],
    prompts: promptsResult.data as Prompt[],
    activeTurn: turnResult.data
  } satisfies GameSnapshot;
}

export async function updatePlayerName(playerId: string, name: string) {
  ensureSupabaseConfig();
  const { error } = await supabase.from("players").update({ name: name.trim() || "Player" }).eq("id", playerId);
  if (error) throw error;
}

export async function assignPlayerToTeam(playerId: string, teamId: string) {
  ensureSupabaseConfig();
  const { error } = await supabase.from("players").update({ team_id: teamId }).eq("id", playerId);
  if (error) throw error;
}

export async function submitPrompts(gameId: string, playerId: string, prompts: Array<string | { text: string; category?: string }>) {
  ensureSupabaseConfig();
  const cleanPrompts = prompts
    .map((prompt) => {
      if (typeof prompt === "string") return { text: prompt.trim(), category: null };
      return { text: prompt.text.trim(), category: prompt.category?.trim() || null };
    })
    .filter((prompt) => prompt.text);
  const { data: game, error: gameError } = await supabase.from("games").select("*").eq("id", gameId).single<Game>();
  if (gameError) throw gameError;

  const { count, error: countError } = await supabase
    .from("prompts")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId)
    .eq("player_id", playerId);

  if (countError) throw countError;

  const slotsLeft = Math.max(0, game.prompts_per_player - (count ?? 0));
  const promptsToInsert = cleanPrompts.slice(0, slotsLeft);

  if (promptsToInsert.length > 0) {
    const { error: promptError } = await supabase.from("prompts").insert(
      promptsToInsert.map((text) => ({
        game_id: gameId,
        player_id: playerId,
        text: text.text,
        category: text.category
      }))
    );
    if (promptError) throw promptError;
  }

  const nextPromptCount = (count ?? 0) + promptsToInsert.length;
  const { error: playerError } = await supabase
    .from("players")
    .update({ has_submitted: nextPromptCount >= game.prompts_per_player })
    .eq("id", playerId);
  if (playerError) throw playerError;
}

export async function startGame(snapshot: GameSnapshot) {
  ensureSupabaseConfig();
  const unreadyPlayer = snapshot.players.find(
    (player) => !player.team_id || !hasPlayerSubmitted(player.id, snapshot.prompts, snapshot.game.prompts_per_player)
  );

  if (unreadyPlayer) {
    throw new Error(`${unreadyPlayer.name} still needs a team and prompts.`);
  }

  const shuffledPrompts = shuffle(snapshot.prompts);
  const playersWithTeams = snapshot.players.filter((player) => player.team_id);
  const activePlayer = playersWithTeams[0];
  const firstPrompt = shuffledPrompts[0];

  if (!activePlayer || !firstPrompt) throw new Error("Need at least one player and one prompt to start.");

  const promptUpdates = shuffledPrompts.map((prompt, deckOrder) =>
    supabase.from("prompts").update({ deck_order: deckOrder, status: deckOrder === 0 ? "active" : "available" }).eq("id", prompt.id)
  );

  const team = snapshot.teams.find((candidate) => candidate.id === activePlayer.team_id) ?? snapshot.teams[0];
  await Promise.all(promptUpdates);

  const { error: gameError } = await supabase
    .from("games")
    .update({
      phase: "ready",
      active_player_id: activePlayer.id,
      current_team_id: team.id,
      current_prompt_id: firstPrompt.id,
      turn_number: 1,
      round_number: 1
    })
    .eq("id", snapshot.game.id);

  if (gameError) throw gameError;
}

export async function startTurn(snapshot: GameSnapshot) {
  ensureSupabaseConfig();
  const activePlayer = snapshot.players.find((player) => player.id === snapshot.game.active_player_id);
  const team = snapshot.teams.find((candidate) => candidate.id === snapshot.game.current_team_id);

  if (!activePlayer || !team || !snapshot.game.current_prompt_id) {
    throw new Error("This turn is not ready to start yet.");
  }

  if (snapshot.activeTurn) {
    const { error } = await supabase.from("turns").update({ ended_at: new Date().toISOString() }).eq("id", snapshot.activeTurn.id);
    if (error) throw error;
  }

  const { error: turnError } = await supabase.from("turns").insert({
    game_id: snapshot.game.id,
    team_id: team.id,
    player_id: activePlayer.id
  });
  if (turnError) throw turnError;

  const { error: gameError } = await supabase.from("games").update({ phase: "playing" }).eq("id", snapshot.game.id);
  if (gameError) throw gameError;
}

async function activateNextPrompt(gameId: string, excludePromptId?: string) {
  ensureSupabaseConfig();
  const { data: prompts, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("game_id", gameId)
    .eq("status", "available")
    .order("deck_order", { nullsFirst: false });

  if (error) throw error;

  const promptList = prompts as Prompt[];
  const nextPrompt = promptList.find((prompt) => prompt.id !== excludePromptId) ?? promptList[0] ?? null;
  if (!nextPrompt) return null;

  const { error: promptError } = await supabase.from("prompts").update({ status: "active" }).eq("id", nextPrompt.id);
  if (promptError) throw promptError;

  const { error: gameError } = await supabase.from("games").update({ current_prompt_id: nextPrompt.id }).eq("id", gameId);
  if (gameError) throw gameError;
  return nextPrompt;
}

async function prepareNextRound(snapshot: GameSnapshot) {
  if (snapshot.activeTurn) {
    const { error } = await supabase
      .from("turns")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", snapshot.activeTurn.id);
    if (error) throw error;
  }

  if (isFinalRound(snapshot.game.round_number)) {
    const { error } = await supabase
      .from("games")
      .update({ phase: "finished", current_prompt_id: null, active_player_id: null, current_team_id: null })
      .eq("id", snapshot.game.id);
    if (error) throw error;
    return;
  }

  const nextRoundNumber = snapshot.game.round_number + 1;
  const shuffledPrompts = shuffle(snapshot.prompts);
  const firstPrompt = shuffledPrompts[0];
  const nextPlayer = getNextPlayer(snapshot);
  const nextTeam = getNextTeamForPlayer(nextPlayer, snapshot.teams);

  if (!firstPrompt || !nextPlayer || !nextTeam) {
    const { error } = await supabase
      .from("games")
      .update({ phase: "finished", current_prompt_id: null, active_player_id: null, current_team_id: null })
      .eq("id", snapshot.game.id);
    if (error) throw error;
    return;
  }

  const promptUpdates = shuffledPrompts.map((prompt, deckOrder) =>
    supabase.from("prompts").update({ deck_order: deckOrder, status: deckOrder === 0 ? "active" : "available" }).eq("id", prompt.id)
  );

  const results = await Promise.all(promptUpdates);
  const promptError = results.find((result) => result.error)?.error;
  if (promptError) throw promptError;

  const { error: gameError } = await supabase
    .from("games")
    .update({
      phase: "ready",
      active_player_id: nextPlayer.id,
      current_team_id: nextTeam.id,
      current_prompt_id: firstPrompt.id,
      round_number: nextRoundNumber,
      turn_number: snapshot.game.turn_number + 1
    })
    .eq("id", snapshot.game.id);

  if (gameError) throw gameError;
}

export async function markCorrect(snapshot: GameSnapshot) {
  ensureSupabaseConfig();
  const promptId = snapshot.game.current_prompt_id;
  const teamId = snapshot.game.current_team_id;
  if (!promptId || !teamId) return;

  const team = snapshot.teams.find((candidate) => candidate.id === teamId);
  const turn = snapshot.activeTurn;

  const updates = [
    supabase.from("prompts").update({ status: "correct" }).eq("id", promptId),
    supabase.from("teams").update({ score: (team?.score ?? 0) + 1 }).eq("id", teamId)
  ];

  if (turn) {
    updates.push(supabase.from("turns").update({ correct_count: turn.correct_count + 1 }).eq("id", turn.id));
  }

  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;

  const nextPrompt = await activateNextPrompt(snapshot.game.id);
  if (!nextPrompt) {
    await prepareNextRound(snapshot);
  }
}

export async function skipPrompt(snapshot: GameSnapshot) {
  ensureSupabaseConfig();
  const promptId = snapshot.game.current_prompt_id;
  if (!promptId) return;

  const maxDeckOrder = Math.max(0, ...snapshot.prompts.map((prompt) => prompt.deck_order ?? 0));
  const updates = [
    supabase.from("prompts").update({ status: "available", deck_order: maxDeckOrder + 1 }).eq("id", promptId)
  ];

  if (snapshot.activeTurn) {
    updates.push(supabase.from("turns").update({ skip_count: snapshot.activeTurn.skip_count + 1 }).eq("id", snapshot.activeTurn.id));
  }

  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;
  await activateNextPrompt(snapshot.game.id, promptId);
}

export async function endTurn(snapshot: GameSnapshot) {
  ensureSupabaseConfig();
  if (snapshot.activeTurn) {
    const { error } = await supabase
      .from("turns")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", snapshot.activeTurn.id);
    if (error) throw error;
  }

  const activePromptId = snapshot.game.current_prompt_id;
  if (activePromptId) {
    await supabase.from("prompts").update({ status: "available" }).eq("id", activePromptId);
  }

  const nextPlayer = getNextPlayer(snapshot);
  const nextTeam = getNextTeamForPlayer(nextPlayer, snapshot.teams);
  const reusablePrompts = snapshot.prompts
    .filter((prompt) => prompt.status === "available" || prompt.id === activePromptId)
    .sort((a, b) => (a.deck_order ?? 9999) - (b.deck_order ?? 9999));
  const nextPrompt = reusablePrompts.find((prompt) => prompt.id !== activePromptId) ?? reusablePrompts[0] ?? null;

  if (!nextPlayer || !nextTeam || !nextPrompt) {
    const { error } = await supabase
      .from("games")
      .update({ phase: "finished", current_prompt_id: null, active_player_id: null, current_team_id: null })
      .eq("id", snapshot.game.id);
    if (error) throw error;
    return;
  }

  const { error: promptError } = await supabase.from("prompts").update({ status: "active" }).eq("id", nextPrompt.id);
  if (promptError) throw promptError;

  const { error: gameError } = await supabase
    .from("games")
    .update({
      phase: "ready",
      active_player_id: nextPlayer.id,
      current_team_id: nextTeam.id,
      current_prompt_id: nextPrompt.id,
      turn_number: snapshot.game.turn_number + 1
    })
    .eq("id", snapshot.game.id);

  if (gameError) throw gameError;
}
