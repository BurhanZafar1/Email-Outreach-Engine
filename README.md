# ⚡ Outreach Engine

Automated cold outreach system for landing finance internships. Discovers 100 companies/week, researches them, finds decision-maker emails, drafts personalized cold emails, and tracks follow-ups.

---

## Prerequisites

You need **one thing** installed: [Node.js](https://nodejs.org/) (v18+)

Check if you have it:
```bash
node --version
```
If not, download from https://nodejs.org (pick the LTS version).

---

## Option 1: Run Locally (Fastest — 2 minutes)

```bash
# 1. Open terminal, navigate to this folder
cd outreach-engine

# 2. Install dependencies
npm install

# 3. Start the app
npm run dev
```

Open **http://localhost:3000** in your browser. Done.

---

## Option 2: Deploy to Vercel (Free — Public URL)

This gives you a live URL you can access from any device.

### First time setup:
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. From the project folder, deploy
cd outreach-engine
vercel

# 3. Follow the prompts:
#    - Log in with GitHub/email
#    - Accept default settings
#    - It will give you a URL like: https://outreach-engine-xxx.vercel.app
```

### To update after changes:
```bash
vercel --prod
```

---

## Option 3: Deploy to Netlify (Free — Alternative)

```bash
# 1. Build the project
npm run build

# 2. Install Netlify CLI
npm install -g netlify-cli

# 3. Deploy
netlify deploy --prod --dir=dist
```

Or drag-and-drop: Run `npm run build`, then go to https://app.netlify.com/drop and drag the `dist` folder.

---

## Option 4: Deploy to GitHub Pages (Free)

```bash
# 1. Create a GitHub repo and push your code
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/outreach-engine.git
git push -u origin main

# 2. Install gh-pages
npm install --save-dev gh-pages

# 3. Add to package.json scripts:
#    "deploy": "vite build && gh-pages -d dist"

# 4. Add to vite.config.js:
#    base: '/outreach-engine/',

# 5. Deploy
npm run deploy
```

---

## Setup Once Deployed

1. Open the app in your browser
2. Go to **Settings** tab
3. Paste your **Claude API Key** — get one at https://console.anthropic.com
   - New accounts get $5 free credits (enough for ~2000+ emails)
4. Optionally paste your **Hunter.io Key** — get one at https://hunter.io
   - Free tier: 25 email lookups/month
5. Enter your Gmail address

## Weekly Workflow

```
Monday:    Click "Discover 100 Companies" → "Run Full Pipeline"
Tuesday:   Go to Outbox → Send 20-30 emails (attach resume in Gmail)
Wednesday: Send another 20-30 emails
Thursday:  Send remaining emails + check Follow-ups tab
Friday:    Check for replies, respond to any conversations
Weekend:   Click "Start New Week" → repeat
```

## API Costs

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| Claude API | $5 credit (new accounts) | ~$0.003/email |
| Hunter.io | 25 searches/month | $49/mo for 500 |
| Gmail | Unlimited | Free |
| Vercel hosting | Free tier | Free |

**Estimated cost per week**: ~$0.30 for 100 fully researched & drafted emails.

---

## Troubleshooting

**"CORS error" when calling Claude API:**
This happens in some browsers. Fix: Use Chrome, or deploy to Vercel (which proxies the requests).

**Emails going to spam:**
- Don't send more than 50/day from a new Gmail
- Ramp up: 10/day week 1, 20/day week 2, 50/day week 3
- Always personalize (the app does this automatically)

**Hunter.io not finding emails:**
The app falls back to Claude API web search for contact finding. Results vary. You can also manually add contacts in the pipeline view.

**API key not working:**
Make sure you're using the key from https://console.anthropic.com/settings/keys (starts with `sk-ant-`).
