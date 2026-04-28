const USER_AGENT = "monikers-web-card-generator/1.0 (local development)";
const DAYS_TO_SCAN = 21;
const CARD_LIMIT = 250;
const DAILY_LIMIT = 1000;
const CATEGORY_MEMBER_LIMIT = 180;

const candidateCategories = [
  "American_film_actors",
  "American_television_actors",
  "American_comedians",
  "American_male_singers",
  "American_female_singers",
  "American_rappers",
  "British_film_actors",
  "British_television_actors",
  "Canadian_musicians",
  "Pop_singers",
  "Rock_musicians",
  "Hip-hop_musicians",
  "National_Basketball_Association_players",
  "National_Football_League_players",
  "Major_League_Baseball_players",
  "Association_football_players",
  "Tennis_players",
  "Olympic_gold_medalists_for_the_United_States",
  "Films_by_studio",
  "American_films",
  "Animated_films",
  "Superhero_films",
  "Science_fiction_films",
  "Fantasy_films",
  "Comedy_films",
  "Drama_films",
  "Horror_films",
  "American_television_series",
  "Animated_television_series",
  "Sitcoms",
  "Reality_television_series",
  "Video_games_by_genre",
  "Nintendo_games",
  "PlayStation_games",
  "Xbox_games",
  "Internet_memes",
  "Fictional_characters",
  "Animated_characters",
  "Superheroes",
  "Toy_brands",
  "Fast-food_chains",
  "Consumer_electronics_brands",
  "Tourist_attractions_in_the_United_States",
  "Landmarks_in_the_United_States"
];

const hardExclusions = new Set([
  "Main_Page",
  "Special:Search",
  "Wikipedia",
  "YouTube",
  "Google",
  "ChatGPT",
  "Deaths_in_2026",
  "2026",
  "2025",
  "2024",
  "United_States",
  "India",
  "China",
  "Russia",
  "World_War_II",
  "World_War_I",
  "Patrick_Muldoon",
  "XXXTentacion",
  "Kanye_West"
]);

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
  /presidential/i,
  /governor/i,
  /politician/i,
  /political/i,
  /scandal/i,
  /trial/i,
  /lawsuit/i,
  /rape/i,
  /suicide/i,
  /terror/i,
  /protest/i,
  /conflict/i,
  /invasion/i,
  /Israel/i,
  /Palestine/i,
  /Ukraine/i,
  /Gaza/i
];

const blockedDescriptionPatterns = [
  /politician/i,
  /political/i,
  /president/i,
  /prime minister/i,
  /governor/i,
  /senator/i,
  /criminal/i,
  /murder/i,
  /terror/i,
  /war/i,
  /conflict/i,
  /massacre/i,
  /shooting/i,
  /disaster/i,
  /died/i,
  /death/i,
  /\(\d{4}[–-]2026\)/
];

const preferredDescriptionPatterns = [
  /actor/i,
  /actress/i,
  /singer/i,
  /musician/i,
  /rapper/i,
  /comedian/i,
  /athlete/i,
  /basketball/i,
  /football/i,
  /baseball/i,
  /tennis/i,
  /film/i,
  /television/i,
  /tv/i,
  /video game/i,
  /album/i,
  /song/i,
  /band/i,
  /character/i,
  /fictional/i,
  /book/i,
  /novel/i,
  /restaurant/i,
  /brand/i,
  /company/i,
  /toy/i,
  /landmark/i,
  /museum/i,
  /park/i,
  /series/i,
  /franchise/i
];

const categoryBoostPatterns = [
  /actor/i,
  /singer/i,
  /comedian/i,
  /rapper/i,
  /athlete/i,
  /basketball/i,
  /football/i,
  /tennis/i,
  /film/i,
  /television/i,
  /video game/i,
  /character/i,
  /band/i,
  /brand/i
];

function formatDate(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return { yyyy, mm, dd };
}

function titleFromArticle(article) {
  return decodeURIComponent(article).replace(/_/g, " ");
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isProbablyAwkward(title) {
  if (hardExclusions.has(title.replace(/ /g, "_"))) return true;
  if (title.includes(":")) return true;
  if (/^List of/i.test(title)) return true;
  if (/^Deaths in/i.test(title)) return true;
  return blockedTitlePatterns.some((pattern) => pattern.test(title));
}

function isPreferredDescription(description) {
  return preferredDescriptionPatterns.some((pattern) => pattern.test(description));
}

function isBlockedDescription(description) {
  return blockedDescriptionPatterns.some((pattern) => pattern.test(description));
}

async function getJson(url) {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.json();
}

async function pageviewsForDay(date) {
  const { yyyy, mm, dd } = formatDate(date);
  const data = await getJson(
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${yyyy}/${mm}/${dd}`
  );
  return data.items?.[0]?.articles ?? [];
}

async function summaryForTitle(title) {
  const data = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  return {
    title: data.title,
    description: data.description || "",
    type: data.type || "",
    extract: data.extract || ""
  };
}

async function categoryMembers(category) {
  const params = new URLSearchParams({
    action: "query",
    list: "categorymembers",
    cmtitle: `Category:${category}`,
    cmlimit: String(CATEGORY_MEMBER_LIMIT),
    cmnamespace: "0",
    format: "json",
    origin: "*"
  });
  const data = await getJson(`https://en.wikipedia.org/w/api.php?${params}`);
  return (data.query?.categorymembers ?? []).map((member) => member.title);
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

const aggregate = new Map();
const start = new Date();
start.setUTCDate(start.getUTCDate() - 1);

for (let offset = 0; offset < DAYS_TO_SCAN; offset += 1) {
  const date = new Date(start);
  date.setUTCDate(start.getUTCDate() - offset);
  const articles = await pageviewsForDay(date);
  for (const article of articles.slice(0, DAILY_LIMIT)) {
    const title = titleFromArticle(article.article);
    if (isProbablyAwkward(title)) continue;
    const current = aggregate.get(title) ?? { title, views: 0, days: 0, bestRank: Infinity };
    current.views += article.views ?? 0;
    current.days += 1;
    current.bestRank = Math.min(current.bestRank, article.rank ?? Infinity);
    aggregate.set(title, current);
  }
}

const candidates = [...aggregate.values()]
  .sort((a, b) => b.views - a.views || a.bestRank - b.bestRank)
  .slice(0, 900);

const categoryTitles = new Set();
for (const category of candidateCategories) {
  try {
    const titles = await categoryMembers(category);
    for (const title of titles) {
      if (!isProbablyAwkward(title)) categoryTitles.add(title);
    }
  } catch {
    // Category names drift over time; skip missing categories.
  }
}

const categoryCandidates = [];
for (const title of [...categoryTitles].slice(0, 1800)) {
  if (aggregate.has(title)) continue;
  const views = await recentPageviews(title);
  if (views < 3000) continue;
  categoryCandidates.push({ title, views, days: 30, bestRank: 9999 });
}

const allCandidates = [...candidates, ...categoryCandidates].sort(
  (a, b) => b.views - a.views || a.bestRank - b.bestRank
);

const cards = [];
const seen = new Set();

for (const candidate of allCandidates) {
  if (cards.length >= CARD_LIMIT) break;
  if (seen.has(candidate.title.toLowerCase())) continue;

  try {
    const summary = await summaryForTitle(candidate.title);
    const description = summary.description || summary.extract;
    if (!description || isBlockedDescription(description)) continue;
    if (!isPreferredDescription(description)) continue;
    if (!isPreferredDescription(description) && !categoryBoostPatterns.some((pattern) => pattern.test(candidate.title))) continue;

    const title = summary.title || candidate.title;
    if (title.length > 52 || isProbablyAwkward(title)) continue;
    seen.add(title.toLowerCase());
    cards.push({
      id: `wiki-${slugify(title)}`,
      title,
      description: `A high-viewed Wikipedia page about ${description.toLowerCase()}.`
    });
  } catch {
    // Some top-viewed entries are redirects or protected special cases. Skip them.
  }
}

console.log(JSON.stringify(cards, null, 2));
