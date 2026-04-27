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
  skipPrompt,
  startGame,
  submitPrompts,
  updatePlayerName
} from "@/lib/game-api";
import { supabase } from "@/lib/supabase";
import type { GameSnapshot, Player, Prompt } from "@/lib/types";
import { getPlayerStorageKey, getSubmittedCount } from "@/lib/game-utils";

export default function GamePage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joinName, setJoinName] = useState("");
  const [promptText, setPromptText] = useState("");
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
  const submittedCount = getSubmittedCount(snapshot.players);
  const promptCount = snapshot.prompts.length;
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
            <p className="muted">{snapshot.game.phase === "lobby" ? "Collecting prompts" : snapshot.game.phase}</p>
          </div>
        </div>
        {isHost ? (
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
          submittedCount={submittedCount}
          promptCount={promptCount}
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
        />
      )}

      {error ? <p className="notice">{error}</p> : null}
    </main>
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
  submittedCount,
  promptCount,
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
  submittedCount: number;
  promptCount: number;
  onNameSave: (event: FormEvent<HTMLFormElement>) => void;
  onPromptSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStart: () => void;
}) {
  return (
    <div className="stack">
      <section className="card stack">
        <h2>Lobby</h2>
        <p className="muted">
          {snapshot.players.length} players connected. {submittedCount} submitted. {promptCount} prompts in the pool.
        </p>
        <ul className="list">
          {snapshot.players.map((player) => (
            <li className="list-item" key={player.id}>
              <span>
                {player.name}
                {player.id === me.id ? " (you)" : ""}
              </span>
              <span className={player.has_submitted ? "pill" : "pill pending"}>
                {player.has_submitted ? "Submitted" : "Waiting"}
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
        <p className="muted">One prompt per line. You can submit more than once before the host starts.</p>
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
        <button className="button accent" disabled={busy || !promptText.trim()}>
          Submit prompts
        </button>
      </form>

      {isHost ? (
        <section className="card stack">
          <h2>Host controls</h2>
          <p className="muted">Start once there is at least one prompt. Players can still watch from their phones.</p>
          <button className="button blue" disabled={busy || promptCount < 1} onClick={onStart}>
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
  onEndTurn
}: {
  snapshot: GameSnapshot;
  me: Player;
  activePlayer: Player | null;
  currentPrompt: Prompt | null;
  busy: boolean;
  onCorrect: () => void;
  onSkip: () => void;
  onEndTurn: () => void;
}) {
  const isActive = me.id === activePlayer?.id;

  if (snapshot.game.phase === "finished") {
    return (
      <div className="stack">
        <Scoreboard snapshot={snapshot} />
        <section className="card">
          <h2>Round finished</h2>
          <p className="muted">All prompts have been guessed.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <Scoreboard snapshot={snapshot} />
      <section className="card stack">
        <h2>{isActive ? "Your turn" : `${activePlayer?.name ?? "Someone"} is up`}</h2>
        <p className="muted">
          Turn {snapshot.game.turn_number}. {isActive ? "Show this screen to no one." : "Wait for your turn."}
        </p>
        <div className="prompt">{isActive ? currentPrompt?.text ?? "No prompt" : "Waiting..."}</div>
        {isActive ? (
          <div className="stack">
            <div className="button-row">
              <button className="button accent" disabled={busy} onClick={onCorrect}>
                Correct
              </button>
              <button className="button warn" disabled={busy} onClick={onSkip}>
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
