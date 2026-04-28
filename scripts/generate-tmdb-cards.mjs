import fs from "node:fs";

const envText = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const token = process.env.TMDB_READ_ACCESS_TOKEN ?? env.TMDB_READ_ACCESS_TOKEN;
if (!token) {
  throw new Error("Missing TMDB_READ_ACCESS_TOKEN in .env.local.");
}

const headers = {
  accept: "application/json",
  authorization: `Bearer ${token}`
};

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function yearFromDate(value) {
  return value ? value.slice(0, 4) : "";
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function truncate(value, limit = 155) {
  const text = clean(value);
  if (text.length <= limit) return text;
  const clipped = text.slice(0, limit - 1);
  return `${clipped.slice(0, clipped.lastIndexOf(" "))}.`;
}

async function tmdb(path) {
  const response = await fetch(`https://api.themoviedb.org/3${path}`, { headers });
  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status} ${path}`);
  }
  return response.json();
}

async function paged(path, pages = 5) {
  const results = [];
  for (let page = 1; page <= pages; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const data = await tmdb(`${path}${separator}page=${page}`);
    results.push(...(data.results ?? []));
  }
  return results;
}

const today = new Date().toISOString().slice(0, 10);

const [movieGenres, tvGenres, popularMovies, topMovies, trendingMovies, discoverMovies, popularTv, topTv, trendingTv, discoverTv, popularPeople, trendingPeople] =
  await Promise.all([
    tmdb("/genre/movie/list?language=en-US"),
    tmdb("/genre/tv/list?language=en-US"),
    paged("/movie/popular?language=en-US&region=US", 10),
    paged("/movie/top_rated?language=en-US&region=US", 8),
    paged("/trending/movie/week?language=en-US", 5),
    paged(`/discover/movie?language=en-US&region=US&sort_by=vote_count.desc&include_adult=false&include_video=false&vote_count.gte=3000&release_date.lte=${today}`, 12),
    paged("/tv/popular?language=en-US", 10),
    paged("/tv/top_rated?language=en-US", 8),
    paged("/trending/tv/week?language=en-US", 5),
    paged(`/discover/tv?language=en-US&sort_by=vote_count.desc&include_adult=false&vote_count.gte=1000&first_air_date.lte=${today}`, 10),
    paged("/person/popular?language=en-US", 5),
    paged("/trending/person/week?language=en-US", 5)
  ]);

const movieGenreMap = new Map((movieGenres.genres ?? []).map((genre) => [genre.id, genre.name]));
const tvGenreMap = new Map((tvGenres.genres ?? []).map((genre) => [genre.id, genre.name]));

const seen = new Set();
const cards = [];

function addCard(card) {
  if (!card.title || !card.description) return;
  if (card.title.length > 48) return;
  const key = card.title.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  cards.push({
    id: `tmdb-${card.kind}-${slugify(card.title)}`,
    title: card.title,
    description: truncate(card.description)
  });
}

function movieDescription(movie) {
  const year = yearFromDate(movie.release_date);
  const genres = (movie.genre_ids ?? []).map((id) => movieGenreMap.get(id)).filter(Boolean).slice(0, 2).join(" and ");
  return `A ${year ? `${year} ` : ""}${genres ? `${genres.toLowerCase()} ` : ""}movie from TMDB's high-recognition movie lists.`;
}

function tvDescription(show) {
  const year = yearFromDate(show.first_air_date);
  const genres = (show.genre_ids ?? []).map((id) => tvGenreMap.get(id)).filter(Boolean).slice(0, 2).join(" and ");
  return `A ${year ? `${year} ` : ""}${genres ? `${genres.toLowerCase()} ` : ""}TV series from TMDB's high-recognition TV lists.`;
}

function personDescription(person) {
  const known = (person.known_for ?? [])
    .map((item) => item.title ?? item.name)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  return `${person.known_for_department || "Entertainment"} figure on TMDB${known ? `, known for ${known}` : ""}.`;
}

function isReleasedMovie(movie) {
  return movie.release_date && movie.release_date <= today && (movie.vote_count ?? 0) >= 1000;
}

function isReleasedTv(show) {
  return show.first_air_date && show.first_air_date <= today && (show.vote_count ?? 0) >= 600;
}

for (const movie of [...discoverMovies, ...topMovies, ...popularMovies, ...trendingMovies].filter(isReleasedMovie)) {
  addCard({ kind: "movie", title: movie.title, description: movieDescription(movie) });
}

for (const show of [...discoverTv, ...topTv, ...popularTv, ...trendingTv].filter(isReleasedTv)) {
  addCard({ kind: "tv", title: show.name, description: tvDescription(show) });
}

for (const person of [...trendingPeople, ...popularPeople]) {
  addCard({ kind: "person", title: person.name, description: personDescription(person) });
}

console.log(JSON.stringify(cards, null, 2));
