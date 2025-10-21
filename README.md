# ☔ RSS → Raindrop.io + Discord Notifier

A lightweight Node.js script that automatically pulls new posts from your
favorite RSS feeds, adds them to [Raindrop.io](https://raindrop.io), and
notifies you on Discord when fresh content drops.  
Runs hands‑free on a [GitHub Actions](https://docs.github.com/en/actions)
schedule – no servers, no state, no fuss.


Built with Node.js, TypeScript sensibilities, and caffeine. ☕


---

## 🚀 Features

- 🕒 Runs on a schedule (default: every 6 hours, configurable)
- 📬 Filters new posts from the last `N` hours (no local cache required)
- 💾 Adds fresh items directly to Raindrop.io
- 🔔 Posts a neat **Discord embed** with titles, links, and timestamps
- 🧩 Feeds live in `feeds.js` – easy to update once in a while
- ☁ 100% GitHub Actions – no deployment, no VM, no tears

---

## 🧠 How It Works

1. GitHub Actions triggers the script every few hours.
2. It fetches each RSS feed from `feeds.js`.
3. Any items published in the last `HOURS_BACK` hours are:
   - Saved to Raindrop.io via its REST API.
   - Announced to Discord in one beautiful message.

---

## ⚙️ Setup

### 1. Clone & install dependencies

```bash
git clone https://github.com/yourname/rss-to-raindrop.git
cd rss-to-raindrop
npm install
```

### 2. Configure your feeds

Edit `feeds.js`:

```js
export const RSS_FEEDS = [
  "https://example.com/feed.xml",
  "https://another.com/rss.xml",
];
```

### 3. Create GitHub secrets

In your repository → **Settings → Secrets and variables → Actions → New secret**

| Variable | Default | Purpose |
|-----------|----------|----------|
| `HOURS_BACK` | 6 | How far back to look for new posts |
| `RAINDROP_COLLECTION_ID` | — | The Raindrop collection ID to use |
| `RAINDROP_TOKEN` | — | Your Raindrop.io API token from [Raindrop Integrations](https://app.raindrop.io/settings/integrations) |
| `DISCORD_WEBHOOK` | — | Discord webhook URL from your target channel |

### 4. Configure workflow

Edit `.github/workflows/rss-to-raindrop.yml` if you’d like to change:
- **Schedule** (`cron`)
- **Raindrop Collection ID**
- **Time window** (`HOURS_BACK`)

---

## 🧾 Example GitHub Action

The default workflow runs every 6 hours and uses Node 24:

```yaml
name: RSS to Raindrop
on:
  schedule:
    - cron: "0 */6 * * *" # chage the 6 match your value for HOURS_BACK
  workflow_dispatch:
```

---

## 🧩 Project Structure

```text
.
├── feeds.js                  # List of RSS feeds
├── index.js                  # Main script
├── package.json              # Dependencies
└── .github/workflows/
└── rss-to-raindrop.yml   # GitHub Action config
```

---

## 🐛 Troubleshooting

| Issue | Possible Cause |
|--------|----------------|
| No items found | Feed lacks valid `pubDate` data |
| Discord embed not sent | Missing or invalid `DISCORD_WEBHOOK` |
| Raindrop API error | Invalid token or collection ID |

---
