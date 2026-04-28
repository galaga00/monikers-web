export const SIMPLE_PROMPT_CATEGORIES = [
  "Celebrity",
  "Movie",
  "Animal",
  "Food",
  "Fictional character",
  "Song",
  "Historical figure",
  "Household object",
  "Athlete",
  "TV show",
  "Landmark",
  "Brand",
  "Job",
  "Video game",
  "Book",
  "Musician",
  "City",
  "Vehicle",
  "Superhero",
  "Villain",
  "Board game",
  "App or website",
  "Restaurant",
  "Cartoon character",
  "Someone in the room",
  "Sport",
  "Toy",
  "Famous place",
  "School subject",
  "Holiday"
];

export const COMBO_PROMPT_CATEGORIES = [
  "A celebrity doing a chore",
  "An animal with a job",
  "A fictional character at the grocery store",
  "A historical figure using modern technology",
  "A food item with a personality",
  "A musician playing a different sport",
  "A superhero with a boring problem",
  "A villain doing customer service",
  "A cartoon character on a first date",
  "An athlete doing a household task",
  "A fictional character stuck at the DMV",
  "A celebrity trying to be sneaky",
  "A movie character at a wedding",
  "A famous person ordering fast food",
  "A brand mascot having a bad day"
];

export function getPromptCategoriesForPlayer(gameId: string, playerId: string, count: number) {
  const seed = hashString(`${gameId}:${playerId}`);
  const simple = shuffleWithSeed(SIMPLE_PROMPT_CATEGORIES, seed);
  const combo = shuffleWithSeed(COMBO_PROMPT_CATEGORIES, seed * 13 + 7);
  const comboTarget = Math.max(1, Math.round(count * 0.25));
  const categories: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const shouldUseCombo = index >= count - comboTarget;
    categories.push(shouldUseCombo ? combo[index % combo.length] : simple[index % simple.length]);
  }

  return shuffleWithSeed(categories, seed * 31 + 11);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffleWithSeed<T>(items: T[], seed: number) {
  const copy = [...items];
  let state = seed || 1;

  for (let index = copy.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}
