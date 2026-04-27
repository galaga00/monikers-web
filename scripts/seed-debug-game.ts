import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running npm run debug:seed.");
}

const supabase = createClient(url, serviceRoleKey);
const code = `DBG${Math.floor(100 + Math.random() * 900)}`;

async function main() {
  const { data: game, error: gameError } = await supabase.from("games").insert({ code }).select("*").single();
  if (gameError) throw gameError;

  const { data: teams, error: teamError } = await supabase
    .from("teams")
    .insert([
      { game_id: game.id, name: "Team 1", sort_order: 0 },
      { game_id: game.id, name: "Team 2", sort_order: 1 }
    ])
    .select("*");
  if (teamError) throw teamError;

  const { data: players, error: playerError } = await supabase
    .from("players")
    .insert([
      { game_id: game.id, name: "Host", is_host: true, team_id: teams[0].id, has_submitted: true },
      { game_id: game.id, name: "Maya", team_id: teams[1].id, has_submitted: true },
      { game_id: game.id, name: "Sam", team_id: teams[0].id, has_submitted: true },
      { game_id: game.id, name: "Riley", team_id: teams[1].id, has_submitted: true }
    ])
    .select("*");
  if (playerError) throw playerError;

  const { error: hostError } = await supabase.from("games").update({ host_player_id: players[0].id }).eq("id", game.id);
  if (hostError) throw hostError;

  const promptTexts = [
    "A karaoke machine with stage fright",
    "Serena Williams",
    "Finding your keys in the fridge",
    "A suspiciously confident houseplant",
    "The first person to try coffee",
    "A wizard doing taxes"
  ];

  const { error: promptError } = await supabase.from("prompts").insert(
    promptTexts.map((text, index) => ({
      game_id: game.id,
      player_id: players[index % players.length].id,
      text
    }))
  );
  if (promptError) throw promptError;

  console.log(`Debug game created: ${code}`);
  console.log(`Open /game/${game.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
