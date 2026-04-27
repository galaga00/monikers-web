"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createGame, joinGame } from "@/lib/game-api";
import { getPlayerStorageKey, normalizeCode } from "@/lib/game-utils";

export default function Home() {
  const router = useRouter();
  const [hostName, setHostName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { game, player } = await createGame(hostName);
      localStorage.setItem(getPlayerStorageKey(game.id), player.id);
      router.push(`/game/${game.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create game.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { game, player } = await joinGame(normalizeCode(joinCode), playerName);
      localStorage.setItem(getPlayerStorageKey(game.id), player.id);
      router.push(`/game/${game.id}`);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Could not join game.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="brand">
          <span className="eyebrow">Monikers-style MVP</span>
          <h1>Prompt Party</h1>
        </div>
        <p>
          Start a room, invite phones with a short code, collect prompts, then pass turns around the table.
        </p>
      </section>

      <div className="split">
        <form className="card stack" onSubmit={handleCreate}>
          <h2>Host a game</h2>
          <div className="field">
            <label htmlFor="hostName">Your name</label>
            <input
              className="input"
              id="hostName"
              value={hostName}
              onChange={(event) => setHostName(event.target.value)}
              placeholder="Alex"
              autoComplete="name"
            />
          </div>
          <button className="button accent" disabled={busy}>
            Create game
          </button>
        </form>

        <form className="card stack" onSubmit={handleJoin}>
          <h2>Join by code</h2>
          <div className="field">
            <label htmlFor="joinName">Your name</label>
            <input
              className="input"
              id="joinName"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Jordan"
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label htmlFor="joinCode">Join code</label>
            <input
              className="input"
              id="joinCode"
              value={joinCode}
              onChange={(event) => setJoinCode(normalizeCode(event.target.value))}
              placeholder="ABCDE"
              inputMode="text"
              autoCapitalize="characters"
            />
          </div>
          <button className="button" disabled={busy || normalizeCode(joinCode).length < 4}>
            Join game
          </button>
        </form>
      </div>

      {error ? <p className="notice">{error}</p> : null}
    </main>
  );
}
