"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  endTurn,
  joinGame,
  loadSnapshot,
  markCorrect,
  saveGameSetup,
  skipPrompt,
  startGame,
  startTurn,
  submitPrompts,
  updatePlayerName
} from "@/lib/game-api";
import { supabase } from "@/lib/supabase";
import type { GameSnapshot, Player, Prompt } from "@/lib/types";
import {
  DEFAULT_PROMPTS_PER_PLAYER,
  DEFAULT_TEAM_COUNT,
  getPlayerStorageKey,
  getPromptCountForPlayer,
  getPromptProgress,
  getRoundName,
  hasPlayerSubmitted,
  getTurnSecondsLeft
} from "@/lib/game-utils";

export default function GamePage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joinName, setJoinName] = useState("");
  const [promptText, setPromptText] = useState("");
  const [promptsPerPlayer, setPromptsPerPlayer] = useState(DEFAULT_PROMPTS_PER_PLAYER);
  const [teamCount, setTeamCount] = useState(DEFAULT_TEAM_COUNT);
  const [teamNames, setTeamNames] = useState(() => Array.from({ length: DEFAULT_TEAM_COUNT }, (_, index) => `Team ${index + 1}`));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const nextSnapshot = await loadSnapshot(gameId);
    setSnapshot(nextSnapshot);
  }, [gameId]);

  useEffect(() => {
    setPlayerId(localStorage.getItem(getPlayerStorageKey(gameId)));
    refresh().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load game."));
  }, [gameId, refresh]);

  useEffect(() => {
    const channel = supabase
      .channel(`game:${gameId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "teams", filter: `game_id=eq.${gameId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "prompts", filter: `game_id=eq.${gameId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "turns", filter: `game_id=eq.${gameId}` }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, refresh]);

  const me = useMemo(() => {
    if (!snapshot || !playerId) return null;
    return snapshot.players.find((player) => player.id === playerId) ?? null;
  }, [snapshot, playerId]);

  const activePlayer = useMemo(() => {
    if (!snapshot) return null;
    return snapshot.players.find((player) => player.id === snapshot.game.active_player_id) ?? null;
  }, [snapshot]);

  const currentPrompt = useMemo(() => {
    if (!snapshot) return null;
    return snapshot.prompts.find((prompt) => prompt.id === snapshot.game.current_prompt_id) ?? null;
  }, [snapshot]);

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!snapshot) return;
    await runAction(async () => {
      const { player } = await joinGame(snapshot.game.code, joinName);
      localStorage.setItem(getPlayerStorageKey(snapshot.game.id), player.id);
      setPlayerId(player.id);
    });
  }

  async function handleNameSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!me) return;
    await runAction(() => updatePlayerName(me.id, joinName || me.name));
  }

  async function handleSubmitPrompts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!snapshot || !me) return;
    await runAction(async () => {
      await submitPrompts(
        snapshot.game.id,
        me.id,
        promptText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      );
      setPromptText("");
    });
  }

  async function handleSetupSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!snapshot) return;
    await runAction(() => saveGameSetup(snapshot.game.id, promptsPerPlayer, teamNames.slice(0, teamCount)));
  }

  function handleTeamCountChange(nextCount: number) {
    const safeCount = Math.min(12, Math.max(1, nextCount));
    setTeamCount(safeCount);
    setTeamNames((currentNames) =>
      Array.from({ length: safeCount }, (_, index) => currentNames[index] ?? `Team ${index + 1}`)
    );
  }

  if (!snapshot) {
    return (
      <main className="shell">
        <p className="muted">Loading game...</p>
        {error ? <p className="notice">{error}</p> : null}
      </main>
    );
  }

  const host = snapshot.players.find((player) => player.id === snapshot.game.host_player_id);
  const isHost = Boolean(me?.is_host);
  const promptCount = snapshot.prompts.length;
  const promptProgress = getPromptProgress(snapshot);
  const joinUrl = typeof window === "undefined" ? "" : `${window.location.origin}/game/${snapshot.game.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(joinUrl)}`;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <strong>Prompt Party</strong>
          <span className="eyebrow">Host: {host?.name ?? "loading"}</span>
        </div>
        <Link className="button secondary" href="/">
          Home
        </Link>
      </header>

      <section className="status-panel stack">
        <div className="button-row">
          <div>
            <span className="muted tiny">Join code</span>
            <div className="code">{snapshot.game.code}</div>
          </div>
          <div>
            <span className="muted tiny">Status</span>
            <p className="muted">
              {snapshot.game.phase === "setup"
                ? "Host setup"
                : snapshot.game.phase === "lobby"
                  ? "Collecting prompts"
                  : `${getRoundName(snapshot.game.round_number)} - ${snapshot.game.phase}`}
            </p>
          </div>
        </div>
        {isHost && snapshot.game.phase !== "setup" ? (
          <div className="split">
            <Image className="qr" src={qrUrl} alt="QR code for joining this game" width={164} height={164} unoptimized />
            <div className="stack">
              <span className="muted tiny">Join link</span>
              <a className="input tiny" href={joinUrl}>
                {joinUrl}
              </a>
            </div>
          </div>
        ) : null}
      </section>

      {!me ? (
        <JoinThisGame onSubmit={handleJoin} name={joinName} setName={setJoinName} busy={busy} />
      ) : snapshot.game.phase === "setup" ? (
        <Setup
          busy={busy}
          isHost={isHost}
          promptsPerPlayer={promptsPerPlayer}
          setPromptsPerPlayer={setPromptsPerPlayer}
          teamCount={teamCount}
          setTeamCount={handleTeamCountChange}
          teamNames={teamNames}
          setTeamNames={setTeamNames}
          onSave={handleSetupSave}
        />
      ) : snapshot.game.phase === "lobby" ? (
        <Lobby
          snapshot={snapshot}
          me={me}
          isHost={isHost}
          busy={busy}
          joinName={joinName}
          setJoinName={setJoinName}
          promptText={promptText}
          setPromptText={setPromptText}
          promptCount={promptCount}
          promptProgress={promptProgress}
          onNameSave={handleNameSave}
          onPromptSubmit={handleSubmitPrompts}
          onStart={() => runAction(() => startGame(snapshot))}
        />
      ) : (
        <Play
          snapshot={snapshot}
          me={me}
          activePlayer={activePlayer}
          currentPrompt={currentPrompt}
          busy={busy}
          onCorrect={() => runAction(() => markCorrect(snapshot))}
          onSkip={() => runAction(() => skipPrompt(snapshot))}
          onEndTurn={() => runAction(() => endTurn(snapshot))}
          onStartTurn={() => runAction(() => startTurn(snapshot))}
        />
      )}

      {error ? <p className="notice">{error}</p> : null}
    </main>
  );
}

function Setup({
  busy,
  isHost,
  promptsPerPlayer,
  setPromptsPerPlayer,
  teamCount,
  setTeamCount,
  teamNames,
  setTeamNames,
  onSave
}: {
  busy: boolean;
  isHost: boolean;
  promptsPerPlayer: number;
  setPromptsPerPlayer: (count: number) => void;
  teamCount: number;
  setTeamCount: (count: number) => void;
  teamNames: string[];
  setTeamNames: (names: string[]) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!isHost) {
    return (
      <section className="card">
        <h2>Waiting for host</h2>
        <p className="muted">The host is choosing teams and prompt count.</p>
      </section>
    );
  }

  return (
    <form className="card stack" onSubmit={onSave}>
      <h2>Game setup</h2>
      <div className="split">
        <div className="field">
          <label htmlFor="teamCount">Teams</label>
          <input
            className="input"
            id="teamCount"
            min={1}
            max={12}
            type="number"
            value={teamCount}
            onChange={(event) => setTeamCount(Number(event.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="promptCount">Prompts per player</label>
          <input
            className="input"
            id="promptCount"
            min={1}
            max={20}
            type="number"
            value={promptsPerPlayer}
            onChange={(event) => setPromptsPerPlayer(Math.min(20, Math.max(1, Number(event.target.value))))}
          />
        </div>
      </div>
      <div className="stack">
        {teamNames.map((name, index) => (
          <div className="field" key={index}>
            <label htmlFor={`team-${index}`}>Team {index + 1}</label>
            <input
              className="input"
              id={`team-${index}`}
              value={name}
              onChange={(event) => {
                const nextNames = [...teamNames];
                nextNames[index] = event.target.value;
                setTeamNames(nextNames);
              }}
            />
          </div>
        ))}
      </div>
      <button className="button accent" disabled={busy}>
        Create lobby
      </button>
    </form>
  );
}

function JoinThisGame({
  onSubmit,
  name,
  setName,
  busy
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  name: string;
  setName: (name: string) => void;
  busy: boolean;
}) {
  return (
    <form className="card stack" onSubmit={onSubmit}>
      <h2>Join this game</h2>
      <p className="muted">Enter your name to claim this phone as a player.</p>
      <div className="field">
        <label htmlFor="name">Your name</label>
        <input className="input" id="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
      </div>
      <button className="button accent" disabled={busy}>
        Join
      </button>
    </form>
  );
}

function Lobby({
  snapshot,
  me,
  isHost,
  busy,
  joinName,
  setJoinName,
  promptText,
  setPromptText,
  promptCount,
  promptProgress,
  onNameSave,
  onPromptSubmit,
  onStart
}: {
  snapshot: GameSnapshot;
  me: Player;
  isHost: boolean;
  busy: boolean;
  joinName: string;
  setJoinName: (name: string) => void;
  promptText: string;
  setPromptText: (text: string) => void;
  promptCount: number;
  promptProgress: { submittedTotal: number; requiredTotal: number; isComplete: boolean };
  onNameSave: (event: FormEvent<HTMLFormElement>) => void;
  onPromptSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStart: () => void;
}) {
  const myPromptCount = getPromptCountForPlayer(me.id, snapshot.prompts);
  const myPromptsLeft = Math.max(0, snapshot.game.prompts_per_player - myPromptCount);
  const pendingPromptLines = promptText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
  const canSubmitPrompts = myPromptsLeft > 0 && pendingPromptLines > 0;

  return (
    <div className="stack">
      <section className="card stack">
        <h2>Lobby</h2>
        <p className="muted">
          {snapshot.players.length} players connected. Prompt progress: {promptProgress.submittedTotal} / {promptProgress.requiredTotal}.
        </p>
        <ul className="list">
          {snapshot.players.map((player) => (
            <li className="list-item" key={player.id}>
              <span>
                {player.name}
                {player.id === me.id ? " (you)" : ""}
              </span>
              <span className={hasPlayerSubmitted(player.id, snapshot.prompts, snapshot.game.prompts_per_player) ? "pill" : "pill pending"}>
                {getPromptCountForPlayer(player.id, snapshot.prompts)} / {snapshot.game.prompts_per_player}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <form className="card stack" onSubmit={onNameSave}>
        <h2>Your name</h2>
        <div className="field">
          <label htmlFor="rename">Name</label>
          <input
            className="input"
            id="rename"
            value={joinName}
            placeholder={me.name}
            onChange={(event) => setJoinName(event.target.value)}
          />
        </div>
        <button className="button secondary" disabled={busy || !joinName.trim()}>
          Save name
        </button>
      </form>

      <form className="card stack" onSubmit={onPromptSubmit}>
        <h2>Submit prompts</h2>
        <p className="muted">
          Your prompts: {myPromptCount} / {snapshot.game.prompts_per_player}
        </p>
        <div className="field">
          <label htmlFor="prompts">Prompts</label>
          <textarea
            className="textarea"
            id="prompts"
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            placeholder={"Taylor Swift\nA toaster with ambition\nThe moon landing"}
          />
        </div>
        <button className="button accent" disabled={busy || !canSubmitPrompts}>
          {myPromptsLeft > 0 ? `Submit ${Math.min(myPromptsLeft, pendingPromptLines) || ""} prompt${Math.min(myPromptsLeft, pendingPromptLines) === 1 ? "" : "s"}` : "All prompts submitted"}
        </button>
      </form>

      {isHost ? (
        <section className="card stack">
          <h2>Host controls</h2>
          <p className="muted">
            Start when everyone reaches {snapshot.game.prompts_per_player} / {snapshot.game.prompts_per_player}.
          </p>
          <button className="button blue" disabled={busy || promptCount < 1 || !promptProgress.isComplete} onClick={onStart}>
            Start game
          </button>
        </section>
      ) : (
        <section className="card">
          <h2>Waiting for host</h2>
          <p className="muted">You are all set once your prompts are submitted.</p>
        </section>
      )}
    </div>
  );
}

function Play({
  snapshot,
  me,
  activePlayer,
  currentPrompt,
  busy,
  onCorrect,
  onSkip,
  onEndTurn,
  onStartTurn
}: {
  snapshot: GameSnapshot;
  me: Player;
  activePlayer: Player | null;
  currentPrompt: Prompt | null;
  busy: boolean;
  onCorrect: () => void;
  onSkip: () => void;
  onEndTurn: () => void;
  onStartTurn: () => void;
}) {
  const isActive = me.id === activePlayer?.id;
  const [now, setNow] = useState(Date.now());
  const [autoEndedTurnId, setAutoEndedTurnId] = useState<string | null>(null);
  const secondsLeft = getTurnSecondsLeft(snapshot.activeTurn?.started_at, now);
  const isTurnRunning = snapshot.game.phase === "playing";

  useEffect(() => {
    if (!isTurnRunning) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [isTurnRunning, snapshot.activeTurn?.id]);

  useEffect(() => {
    if (!isTurnRunning || !isActive || !snapshot.activeTurn || secondsLeft > 0 || autoEndedTurnId === snapshot.activeTurn.id) return;
    setAutoEndedTurnId(snapshot.activeTurn.id);
    onEndTurn();
  }, [autoEndedTurnId, isActive, isTurnRunning, onEndTurn, secondsLeft, snapshot.activeTurn]);

  if (snapshot.game.phase === "finished") {
    return (
      <div className="stack">
        <Scoreboard snapshot={snapshot} />
        <section className="card">
          <h2>Game finished</h2>
          <p className="muted">All prompts were guessed through Charades.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <Scoreboard snapshot={snapshot} />
      <section className="card stack">
        <h2>{getRoundName(snapshot.game.round_number)}</h2>
        <div className="round-meta">
          <span>Turn {snapshot.game.turn_number}</span>
          <span>{activePlayer?.name ?? "Someone"} is up</span>
        </div>
        {snapshot.game.phase === "ready" ? (
          <div className="ready-panel stack">
            <p className="muted">
              {isActive ? "Tap ready when your team is listening." : `Waiting for ${activePlayer?.name ?? "the active player"} to start.`}
            </p>
            {isActive ? (
              <button className="button accent" disabled={busy} onClick={onStartTurn}>
                Ready!
              </button>
            ) : null}
          </div>
        ) : null}
        {isTurnRunning ? (
          <>
            <div className={secondsLeft <= 10 ? "timer urgent" : "timer"} aria-live="polite">
              {secondsLeft}s
            </div>
            <p className="muted">{isActive ? "Show this screen to no one." : "Wait for your turn."}</p>
            <div className="prompt">{isActive ? currentPrompt?.text ?? "No prompt" : "Waiting..."}</div>
          </>
        ) : null}
        {isActive && isTurnRunning ? (
          <div className="stack">
            <div className="button-row">
              <button className="button accent" disabled={busy || secondsLeft <= 0} onClick={onCorrect}>
                Correct
              </button>
              <button className="button warn" disabled={busy || secondsLeft <= 0} onClick={onSkip}>
                Skip
              </button>
            </div>
            <button className="button danger" disabled={busy} onClick={onEndTurn}>
              End turn
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Scoreboard({ snapshot }: { snapshot: GameSnapshot }) {
  return (
    <section className="score-grid">
      {snapshot.teams.map((team) => (
        <div className="score" key={team.id}>
          <span className="muted tiny">{team.name}</span>
          <strong>{team.score}</strong>
        </div>
      ))}
    </section>
  );
}
