"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ASSETS } from "@/lib/assets";
import { createGame, joinGame } from "@/lib/game-api";
import { getPlayerStorageKey, normalizeCode } from "@/lib/game-utils";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"menu" | "join">("menu");
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setBusy(true);
    setError("");
    try {
      const { game, player } = await createGame("Host");
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
    <main className="home-shell">
      <section className={mode === "join" ? "home-art-stage joining" : "home-art-stage"} aria-labelledby="home-title">
        <Image
          className="home-art"
          src={ASSETS.art.home.fishBowl}
          alt="A placeholder drawing of a fish swimming inside a fish bowl."
          fill
          priority
          sizes="(max-width: 520px) 100vw, 520px"
        />
        <div className="home-title-lockup">
          <h1 id="home-title">Fish Bowl</h1>
        </div>

        <div className="home-action-panel">
          {mode === "join" ? (
            <form className="home-join-form" onSubmit={handleJoin}>
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
              <div className="home-button-grid">
                <button className="button secondary" type="button" disabled={busy} onClick={() => setMode("menu")}>
                  Back
                </button>
                <button className="button accent" disabled={busy || normalizeCode(joinCode).length < 4}>
                  Join Game
                </button>
              </div>
            </form>
          ) : (
            <div className="home-button-grid">
              <button className="button accent" disabled={busy} type="button" onClick={handleCreate}>
                Create Game
              </button>
              <button className="button" disabled={busy} type="button" onClick={() => setMode("join")}>
                Join Game
              </button>
            </div>
          )}

          {error ? (
            <p className="notice" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
