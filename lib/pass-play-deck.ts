import { STARTER_DECK, type StarterDeckCard } from "./starter-deck";
import { shuffle } from "./game-utils";

export type PassPlayCategoryId =
  | "people"
  | "movies"
  | "music"
  | "fiction_games"
  | "places_objects"
  | "situations"
  | "animals_nature";

export const MIXED_PASS_PLAY_CATEGORY = "mixed";

export const PASS_PLAY_CATEGORY_OPTIONS: Array<{ id: PassPlayCategoryId; label: string }> = [
  { id: "people", label: "People & Celebrities" },
  { id: "movies", label: "Movies & TV" },
  { id: "music", label: "Music" },
  { id: "fiction_games", label: "Fiction & Games" },
  { id: "places_objects", label: "Places & Things" },
  { id: "situations", label: "Situations" },
  { id: "animals_nature", label: "Animals & Nature" }
];

export type PassPlayDeckCard = StarterDeckCard & {
  category: PassPlayCategoryId;
};

export function getDefaultPassPlayCardCount(playerCount: number) {
  if (playerCount <= 3) return 30;
  if (playerCount <= 6) return 40;
  if (playerCount <= 10) return 45;
  if (playerCount <= 16) return 50;
  return 45;
}

export function buildPassPlayDeck(cardCount: number, selectedCategories: string[]) {
  const cleanCount = Math.min(80, Math.max(10, Math.round(cardCount)));
  const useMixed = shouldUseMixedCategories(selectedCategories);
  const categoryIds = getSelectedPassPlayCategoryIds(selectedCategories);

  const categorizedCards = STARTER_DECK.map((card) => ({ ...card, category: getCardCategory(card) }));
  if (!useMixed) {
    return shuffle(categorizedCards.filter((card) => categoryIds.includes(card.category))).slice(0, cleanCount);
  }

  const buckets = categoryIds.map((category) => shuffle(categorizedCards.filter((card) => card.category === category)));
  const mixedCards: PassPlayDeckCard[] = [];
  let bucketIndex = 0;

  while (mixedCards.length < cleanCount && buckets.some((bucket) => bucket.length > 0)) {
    const bucket = buckets[bucketIndex % buckets.length];
    const nextCard = bucket.shift();
    if (nextCard) mixedCards.push(nextCard);
    bucketIndex += 1;
  }

  return mixedCards;
}

export function filterStarterDeckByCategories(selectedCategories: string[]) {
  const useMixed = shouldUseMixedCategories(selectedCategories);
  const categoryIds = getSelectedPassPlayCategoryIds(selectedCategories);
  const categorizedCards = STARTER_DECK.map((card) => ({ ...card, category: getCardCategory(card) }));
  return useMixed ? categorizedCards : categorizedCards.filter((card) => categoryIds.includes(card.category));
}

function shouldUseMixedCategories(selectedCategories: string[]) {
  return selectedCategories.includes(MIXED_PASS_PLAY_CATEGORY) || selectedCategories.length === 0;
}

function getSelectedPassPlayCategoryIds(selectedCategories: string[]) {
  const categoryIds = shouldUseMixedCategories(selectedCategories)
    ? PASS_PLAY_CATEGORY_OPTIONS.map((category) => category.id)
    : selectedCategories.filter((category): category is PassPlayCategoryId =>
        PASS_PLAY_CATEGORY_OPTIONS.some((option) => option.id === category)
      );

  return categoryIds.length > 0 ? categoryIds : PASS_PLAY_CATEGORY_OPTIONS.map((category) => category.id);
}

function getCardCategory(card: StarterDeckCard): PassPlayCategoryId {
  if (card.category && PASS_PLAY_CATEGORY_OPTIONS.some((option) => option.id === card.category)) {
    return card.category as PassPlayCategoryId;
  }

  const text = `${card.id} ${card.title} ${card.description}`.toLowerCase();

  if (card.id.startsWith("tmdb-movie") || hasAny(text, ["movie", "film", "tv series", "hbo", "sitcom"])) return "movies";
  if (hasAny(text, ["singer", "song", "band", "music", "pop star", "rapper", "guitar", "beatles", "album"])) return "music";
  if (hasAny(text, ["superhero", "villain", "star wars", "harry potter", "nintendo", "video game", "comic", "jedi", "wizard"])) {
    return "fiction_games";
  }
  if (hasAny(text, ["animal", "shark", "dinosaur", "t. rex", "cactus", "storm", "weather", "forest", "wildlife", "chimpanzee"])) {
    return "animals_nature";
  }
  if (hasAny(text, ["airport", "tower", "chair", "truck", "map", "machine", "balloon", "factory", "moon", "paris", "luggage"])) {
    return "places_objects";
  }
  if (hasAny(text, ["driver", "host", "chef", "agent", "santa", "dj", "support", "singer", "captain"])) return "situations";
  if (hasAny(text, ["president", "actor", "comedian", "artist", "monarch", "scientist", "pilot", "pharaoh", "host", "star"])) return "people";
  return "situations";
}

function hasAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}
