import fs from "node:fs";
import path from "node:path";

const REVIEW_PATH = path.join("card-review", "category-candidates.md");
const OUTPUT_PATH = path.join("lib", "category-expansion-deck.ts");

if (!fs.existsSync(REVIEW_PATH)) {
  throw new Error(`Missing ${REVIEW_PATH}. Run npm run cards:review first.`);
}

const text = fs.readFileSync(REVIEW_PATH, "utf8");
const cards = parseReview(text).filter((card) => card.status === "KEEP");

const deckCards = cards.map((card) => ({
  category: card.category,
  id: card.id,
  title: card.title,
  description: card.description
}));

const contents = `import type { StarterDeckCard } from "./starter-deck";

// Reviewed category expansion cards.
// Source file: ${REVIEW_PATH}
export const CATEGORY_EXPANSION_DECK: StarterDeckCard[] = ${JSON.stringify(deckCards, null, 2)};
`;

fs.writeFileSync(OUTPUT_PATH, `${contents}\n`);
console.log(`Wrote ${cards.length} reviewed cards to ${OUTPUT_PATH}`);

function parseReview(markdown) {
  const blocks = markdown.split(/\n(?=### )/g).filter((block) => block.startsWith("### "));
  return blocks
    .map((block) => {
      const get = (label) => {
        const match = block.match(new RegExp(`^${label}:\\\\s*(.+)$`, "m"));
        return match?.[1]?.trim() ?? "";
      };
      const title = get("Title");
      return {
        status: get("Status").toUpperCase(),
        category: get("Category"),
        id: `${get("Category")}-${slugify(title)}`,
        title,
        description: get("Description"),
        source: get("Source")
      };
    })
    .filter((card) => card.title && card.description && card.category);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
