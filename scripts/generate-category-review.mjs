import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const USER_AGENT = "fish-bowl-card-generator/1.0 (local review pipeline)";
const OUTPUT_DIR = "card-review";
const REVIEW_PATH = path.join(OUTPUT_DIR, "category-candidates.md");
const JSON_PATH = path.join(OUTPUT_DIR, "category-candidates.json");
const PER_CATEGORY_LIMIT = Number(process.env.PER_CATEGORY_LIMIT ?? 60);
const CATEGORY_MEMBER_LIMIT = Number(process.env.CATEGORY_MEMBER_LIMIT ?? 140);
const PAGEVIEW_CONCURRENCY = 2;
const RANK_BY_PAGEVIEWS = process.env.RANK_BY_PAGEVIEWS === "1";
const USE_CATEGORY_CRAWL = process.env.USE_CATEGORY_CRAWL === "1";

const CATEGORY_DEFINITIONS = [
  {
    id: "people",
    label: "People & Celebrities",
    seeds: [
      "Zendaya", "Tom Hanks", "Jennifer Lawrence", "Ryan Reynolds", "Sandra Bullock", "Keanu Reeves",
      "Emma Stone", "Will Smith", "Denzel Washington", "Julia Roberts", "Morgan Freeman", "Jackie Chan",
      "Adam Sandler", "Steve Carell", "Tina Fey", "Amy Poehler", "Kevin Hart", "Awkwafina",
      "Mindy Kaling", "Conan O'Brien", "Jimmy Fallon", "Stephen Colbert", "Martha Stewart", "Guy Fieri",
      "Gordon Ramsay", "MrBeast", "Mark Rober", "Lilly Singh", "Charli D'Amelio", "Addison Rae",
      "Pedro Pascal", "Florence Pugh", "Ayo Edebiri", "Ryan Gosling", "Margot Robbie", "Timothée Chalamet"
    ],
    categories: [
      "American_film_actors",
      "American_television_actors",
      "American_comedians",
      "American_YouTubers",
      "Internet_celebrities",
      "British_film_actors",
      "Canadian_film_actors"
    ]
  },
  {
    id: "music",
    label: "Music",
    seeds: [
      "Ariana Grande", "Lady Gaga", "Rihanna", "Drake", "Kendrick Lamar", "Sabrina Carpenter",
      "Chappell Roan", "Dua Lipa", "Bad Bunny", "Post Malone", "The Weeknd", "SZA",
      "Adele", "Ed Sheeran", "Bruno Mars", "Doja Cat", "Miley Cyrus", "Billie Eilish",
      "Harry Styles", "Olivia Rodrigo", "BTS", "Blackpink", "Shakira", "Eminem",
      "Jay-Z", "Madonna", "Prince", "Whitney Houston", "Queen (band)", "Nirvana (band)",
      "Fleetwood Mac", "Metallica", "The Rolling Stones", "Elton John", "Stevie Wonder", "Mariah Carey"
    ],
    categories: [
      "American_pop_singers",
      "American_rock_singers",
      "American_rappers",
      "American_singer-songwriters",
      "British_pop_singers",
      "Rock_music_groups",
      "Pop_music_groups"
    ]
  },
  {
    id: "sports",
    label: "Sports",
    seeds: [
      "Simone Biles", "Lionel Messi", "Cristiano Ronaldo", "Stephen Curry", "Michael Jordan", "Serena Williams",
      "Naomi Osaka", "Shohei Ohtani", "Patrick Mahomes", "Tom Brady", "Travis Kelce", "Caitlin Clark",
      "Alex Morgan", "Megan Rapinoe", "Tiger Woods", "Shaquille O'Neal", "Kylian Mbappé", "Neymar",
      "Roger Federer", "Rafael Nadal", "Venus Williams", "Katie Ledecky", "Michael Phelps", "Tony Hawk",
      "Ronda Rousey", "Conor McGregor", "Dale Earnhardt Jr.", "Wayne Gretzky", "Mia Hamm", "Derek Jeter",
      "Babe Ruth", "Usain Bolt", "Luka Dončić", "Nikola Jokić", "Aaron Judge", "Coco Gauff"
    ],
    categories: [
      "National_Basketball_Association_players",
      "National_Football_League_players",
      "Major_League_Baseball_players",
      "Association_football_players",
      "Tennis_players",
      "Olympic_gold_medalists_for_the_United_States",
      "Professional_wrestlers"
    ]
  },
  {
    id: "fiction_games",
    label: "Fiction & Games",
    seeds: [
      "Minecraft", "Fortnite", "The Legend of Zelda", "Pokémon", "Sonic the Hedgehog", "Kirby (character)",
      "Donkey Kong", "Pac-Man", "Tetris", "Animal Crossing", "The Sims", "Roblox",
      "Among Us", "Grand Theft Auto V", "The Last of Us", "Elden Ring", "God of War (franchise)", "Halo (franchise)",
      "Master Chief (Halo)", "Lara Croft", "Pikachu", "Princess Zelda", "Luigi", "Bowser",
      "Batman", "Wonder Woman", "Iron Man", "Captain America", "Hulk", "Black Panther (character)",
      "SpongeBob SquarePants (character)", "Bugs Bunny", "Scooby-Doo (character)", "Barbie", "Shrek (character)", "Elsa (Frozen)"
    ],
    categories: [
      "Nintendo_games",
      "PlayStation_games",
      "Xbox_games",
      "Video_game_franchises",
      "Fictional_characters",
      "Animated_characters",
      "Superheroes"
    ]
  },
  {
    id: "places_objects",
    label: "Places & Things",
    seeds: [
      "Grand Canyon", "Statue of Liberty", "Golden Gate Bridge", "Mount Rushmore", "Times Square", "Disneyland",
      "Las Vegas Strip", "Central Park", "Hollywood Sign", "Niagara Falls", "Louvre", "Colosseum",
      "Great Wall of China", "Taj Mahal", "Stonehenge", "Machu Picchu", "Sydney Opera House", "Burj Khalifa",
      "AirPods", "iPhone", "Nintendo Switch", "PlayStation 5", "Tesla Cybertruck", "Crocs",
      "Lego", "Barbie", "Rubik's Cube", "Nerf", "Monopoly (game)", "Uno (card game)",
      "McDonald's", "Taco Bell", "Starbucks", "Target Corporation", "Costco", "IKEA"
    ],
    categories: [
      "Tourist_attractions_in_the_United_States",
      "Landmarks_in_the_United_States",
      "Buildings_and_structures_in_Paris",
      "Fast-food_chains",
      "Toy_brands",
      "Consumer_electronics_brands",
      "Internet_properties"
    ]
  },
  {
    id: "animals_nature",
    label: "Animals & Nature",
    seeds: [
      "African elephant", "Bald eagle", "Giant panda", "Koala", "Kangaroo", "Platypus",
      "Great white shark", "Orca", "Blue whale", "Dolphin", "Octopus", "Penguin",
      "Flamingo", "Peacock", "Ostrich", "Sloth", "Capybara", "Red panda",
      "Cheetah", "Lion", "Tiger", "Gorilla", "Chimpanzee", "Komodo dragon",
      "Cobra", "Alligator", "Crocodile", "Tyrannosaurus", "Triceratops", "Velociraptor",
      "Venus flytrap", "Saguaro", "Redwood", "Aurora", "Rainbow", "Volcano"
    ],
    categories: [
      "Mammals",
      "Birds",
      "Reptiles",
      "Dinosaurs",
      "Dog_breeds",
      "Cat_breeds",
      "Natural_landmarks"
    ]
  }
];

const blockedTitlePatterns = [
  /death/i,
  /murder/i,
  /shooting/i,
  /massacre/i,
  /attack/i,
  /war/i,
  /genocide/i,
  /earthquake/i,
  /pandemic/i,
  /accident/i,
  /crash/i,
  /election/i,
  /politician/i,
  /scandal/i,
  /trial/i,
  /lawsuit/i,
  /rape/i,
  /suicide/i,
  /terror/i,
  /conflict/i,
  /invasion/i
];

const blockedDescriptionPatterns = [
  /politician/i,
  /political/i,
  /president/i,
  /prime minister/i,
  /criminal/i,
  /murder/i,
  /terror/i,
  /war/i,
  /conflict/i,
  /shooting/i,
  /disaster/i,
  /died/i,
  /death/i
];

const existingTitles = loadExistingTitles();
const accepted = [];
const seen = new Set(existingTitles);

  for (const definition of CATEGORY_DEFINITIONS) {
  console.log(`Fetching ${definition.label} candidates...`);
  const titles = await titlesForDefinition(definition);
  const ranked = RANK_BY_PAGEVIEWS
    ? await rankByRecentPageviews(titles)
    : titles.map((title, index) => ({ title, views: 0, order: index }));
  let acceptedForCategory = 0;

  for (const candidate of ranked) {
    if (acceptedForCategory >= PER_CATEGORY_LIMIT) break;
    if (seen.has(candidate.title.toLowerCase())) continue;

    const summary = await summaryForTitle(candidate.title);
    if (!summary) continue;

    const title = clean(summary.title || candidate.title);
    const description = makeDescription(title, summary.description, summary.extract, definition.id);
    if (!title || !description || title.length > 55) continue;
    if (seen.has(title.toLowerCase())) continue;
    if (isBlockedTitle(title) || isBlockedDescription(description)) continue;

    seen.add(title.toLowerCase());
    acceptedForCategory += 1;
    accepted.push({
      status: "KEEP",
      category: definition.id,
      categoryLabel: definition.label,
      id: `${definition.id}-${slugify(title)}`,
      title,
      description,
      source: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      pageviews30d: candidate.views
    });
  }
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(JSON_PATH, `${JSON.stringify(accepted, null, 2)}\n`);
fs.writeFileSync(REVIEW_PATH, buildReviewMarkdown(accepted));

console.log(`Wrote ${accepted.length} candidates to ${REVIEW_PATH}`);
console.log(`Also wrote machine-readable data to ${JSON_PATH}`);

function loadExistingTitles() {
  const command = `import { STARTER_DECK } from './lib/starter-deck'; console.log(JSON.stringify(STARTER_DECK.map((card) => card.title.toLowerCase())));`;
  const output = execFileSync("npx", ["tsx", "-e", command], { encoding: "utf8" });
  return new Set(JSON.parse(output));
}

async function titlesForDefinition(definition) {
  const titles = new Set(definition.seeds ?? []);
  if (!USE_CATEGORY_CRAWL) return [...titles];

  for (const category of definition.categories) {
    try {
      const members = await categoryMembers(category);
      for (const member of members) {
        if (!isBlockedTitle(member)) titles.add(member);
      }
    } catch (error) {
      console.warn(`Skipping Category:${category}: ${error.message}`);
    }
  }

  return [...titles];
}

async function categoryMembers(category) {
  const titles = [];
  let cmcontinue = "";

  while (titles.length < CATEGORY_MEMBER_LIMIT) {
    const params = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: `Category:${category}`,
      cmlimit: "50",
      cmnamespace: "0",
      format: "json",
      origin: "*"
    });
    if (cmcontinue) params.set("cmcontinue", cmcontinue);

    const data = await getJson(`https://en.wikipedia.org/w/api.php?${params}`);
    titles.push(...(data.query?.categorymembers ?? []).map((member) => member.title));
    cmcontinue = data.continue?.cmcontinue ?? "";
    if (!cmcontinue) break;
  }

  return titles.slice(0, CATEGORY_MEMBER_LIMIT);
}

async function rankByRecentPageviews(titles) {
  const results = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < titles.length) {
      const title = titles[nextIndex];
      nextIndex += 1;
      const views = await recentPageviews(title);
      results.push({ title, views });
    }
  }

  await Promise.all(Array.from({ length: PAGEVIEW_CONCURRENCY }, worker));
  return results.sort((a, b) => b.views - a.views || a.title.localeCompare(b.title));
}

async function recentPageviews(title) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const startDate = new Date(end);
  startDate.setUTCDate(end.getUTCDate() - 29);
  const startParts = formatDate(startDate);
  const endParts = formatDate(end);
  const startStamp = `${startParts.yyyy}${startParts.mm}${startParts.dd}00`;
  const endStamp = `${endParts.yyyy}${endParts.mm}${endParts.dd}00`;
  const encodedTitle = encodeURIComponent(title.replace(/ /g, "_"));
  try {
    const data = await getJson(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodedTitle}/daily/${startStamp}/${endStamp}`
    );
    return (data.items ?? []).reduce((total, item) => total + (item.views ?? 0), 0);
  } catch {
    return 0;
  }
}

async function summaryForTitle(title) {
  try {
    const data = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (data.type === "disambiguation") return null;
    return data;
  } catch {
    return null;
  }
}

async function getJson(url) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
    if (response.ok) return response.json();
    if (response.status === 429 || response.status >= 500) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  throw new Error(`Request failed after retries: ${url}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeDescription(title, description, extract, category) {
  const cleanDescription = clean(description);
  const cleanExtract = clean(extract);
  const base = cleanExtract || cleanDescription;
  if (!base) return "";

  const sentence = trimSentence(base.replace(/\s*\(born [^)]+\)/gi, ""), 185);
  if (/^A |^An |^The /i.test(sentence)) return sentence;

  const prefix = category === "animals_nature" ? "A nature pick: " : "A recognizable clue: ";
  return trimSentence(`${prefix}${sentence}`, 205);
}

function buildReviewMarkdown(cards) {
  const now = new Date().toISOString();
  const lines = [
    "# Fish Bowl Category Card Review",
    "",
    `Generated: ${now}`,
    "",
    "How to review:",
    "- Leave `Status: KEEP` for cards you like.",
    "- Change `Status: KEEP` to `Status: DELETE` for cards you do not want.",
    "- Edit `Title:`, `Description:`, or `Category:` directly if you want changes.",
    "- Valid categories: people, music, sports, fiction_games, places_objects, animals_nature.",
    "",
    "When you are done, tell Codex to apply the reviewed category cards.",
    ""
  ];

  for (const category of CATEGORY_DEFINITIONS) {
    const cardsForCategory = cards.filter((card) => card.category === category.id);
    lines.push(`## ${category.label}`, "");
    for (const card of cardsForCategory) {
      lines.push(`### ${card.title}`);
      lines.push(`Status: ${card.status}`);
      lines.push(`Category: ${card.category}`);
      lines.push(`Title: ${card.title}`);
      lines.push(`Description: ${card.description}`);
      lines.push(`Source: ${card.source}`);
      if (card.pageviews30d > 0) lines.push(`Pageviews 30d: ${card.pageviews30d}`);
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatDate(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return { yyyy, mm, dd };
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function trimSentence(value, limit) {
  const text = clean(value);
  if (text.length <= limit) return text;
  const clipped = text.slice(0, limit - 1);
  const sentenceEnd = Math.max(clipped.lastIndexOf("."), clipped.lastIndexOf(";"), clipped.lastIndexOf(","));
  const end = sentenceEnd > 60 ? sentenceEnd : clipped.lastIndexOf(" ");
  return `${clipped.slice(0, end).trim()}.`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isBlockedTitle(title) {
  if (title.includes(":")) return true;
  if (/^List of/i.test(title)) return true;
  return blockedTitlePatterns.some((pattern) => pattern.test(title));
}

function isBlockedDescription(description) {
  return blockedDescriptionPatterns.some((pattern) => pattern.test(description));
}
