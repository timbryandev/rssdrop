import Parser from "rss-parser";
import fetch from "node-fetch";
import { RSS_FEEDS } from "./feeds.js";

const parser = new Parser();

// --- Config ---
const RAINDROP_TOKEN = process.env.RAINDROP_TOKEN;
const COLLECTION_ID = process.env.RAINDROP_COLLECTION_ID;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const HOURS_BACK = Number(process.env.HOURS_BACK || 6);

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fetchFeedWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await parser.parseURL(url);
    } catch (err) {
      if (err.message.includes("429") && i < retries - 1) {
        const delay = 5000 * (i + 1);
        console.warn(`⚠️ Rate limited, retrying in ${delay / 1000}s...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
}

async function addToRaindrop(item) {
  const response = await fetch("https://api.raindrop.io/rest/v1/raindrop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RAINDROP_TOKEN}`,
    },
    body: JSON.stringify({
      collection: { id: COLLECTION_ID },
      link: item.link,
      title: item.title,
      excerpt: item.contentSnippet || "",
      tags: ["rss-import"],
    }),
  });

  if (!response.ok) {
    throw new Error(`Raindrop API error: ${response.status}`);
  }
}

function isNewerThanHoursAgo(dateString, hours) {
  const pub = new Date(dateString);
  if (isNaN(pub)) return false;
  const cutoff = Date.now() - hours * 3600 * 1000;
  return pub.getTime() > cutoff;
}

async function postToDiscord(newItems) {
  if (!DISCORD_WEBHOOK) {
    console.warn("⚠️ No DISCORD_WEBHOOK set — skipping Discord notification.");
    return;
  }

  const content =
    "📰 **New RSS items added to Raindrop.io!**\n\n" +
    newItems
      .map((i) => `• [${i.title}](${i.link}) (${i.feedTitle})`)
      .join("\n");

  const res = await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) console.error(`❌ Discord webhook failed: ${res.status}`);
}

async function processFeed(url) {
  console.log(`\n🔗 Checking feed: ${url}`);
  const feed = await fetchFeedWithRetry(url);

  const recentItems = feed.items.filter((i) =>
    isNewerThanHoursAgo(i.pubDate, HOURS_BACK)
  );

  for (const item of recentItems) {
    try {
      await addToRaindrop(item);
      item.feedTitle = feed.title || "RSS Feed";
      console.log(`✅ Added: ${item.title}`);
    } catch (err) {
      console.error(`❌ Failed to add ${item.title}: ${err.message}`);
    }
  }

  return recentItems;
}

async function main() {
  console.log(`🕒 Looking for posts from the last ${HOURS_BACK} hours...`);

  const allNewItems = [];

  for (const feedUrl of RSS_FEEDS) {
    const newItems = await processFeed(feedUrl);
    allNewItems.push(...newItems);
  }

  if (allNewItems.length > 0) {
    await postToDiscord(allNewItems);
  } else {
    console.log("No new posts found.");
  }

  console.log("\n✨ Done.");
}

await main();
