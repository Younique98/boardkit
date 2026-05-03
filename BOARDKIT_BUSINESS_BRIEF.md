# BoardKit — Business & Marketing Brief

## What It Is

BoardKit is a **Progressive Web App (PWA)** that automates GitHub project board generation. Users pick a template, connect their GitHub account, and generate a fully structured project board — with issues, labels, phases, and columns — in seconds instead of hours.

**Live at**: Deployed on Vercel (web) + Google Play Store (installable PWA)

---

## The Problem It Solves

Setting up a GitHub project board manually is brutal:
- Creating 30–100+ individual issues by hand
- Organizing them into phases (Sprint 1, MVP, Backlog, etc.)
- Assigning labels, colors, priorities
- Structuring columns for team workflows

This takes 2–6 hours for a medium-sized project. **BoardKit does it in under 60 seconds.**

**Target users**: Indie developers, startup founders, dev teams, freelancers, engineering managers — anyone starting a new software project on GitHub.

---

## How It Works

1. User signs in with GitHub OAuth
2. Selects a pre-built template (or creates a custom one)
3. Picks a target repository
4. Clicks "Generate Board"
5. BoardKit creates all issues, labels, and project columns via GitHub API automatically

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 + React 19 |
| Styling | Tailwind CSS |
| Auth | NextAuth.js v5 (GitHub OAuth) |
| GitHub API | Octokit.js (REST + GraphQL) |
| State | TanStack React Query v5 |
| PWA | @ducanh2912/next-pwa (Workbox) |
| Rate Limiting | Upstash Redis |
| Validation | Zod |
| Hosting | Vercel + Google Play Store |
| Language | TypeScript |

---

## Key Features

- **21+ pre-built templates** (SaaS MVP, E-commerce, Fitness App, Telemedicine, Rideshare, LMS, etc.)
- **Custom template builder** — create, save, and reuse your own
- **Template import/export** — CSV and JSON support
- **GitHub Projects v2 integration** — creates real kanban boards with columns
- **Label management** — auto-creates colored labels in your repo
- **PWA** — installable on Android (Play Store), iOS (homescreen), and desktop
- **Rate limiting** — distributed via Redis to handle scale
- **Duplicate detection** — won't re-create existing issues or labels

---

## Codebase Architecture

```
/app                  — Next.js App Router pages + API routes
/components           — React UI components
/lib                  — GitHub service, auth config, rate limiting, utilities
/data/templates/      — 21 JSON template definitions
/public               — PWA assets, icons, manifest
```

Key files:
- `lib/github.ts` — Full GitHub API service (issue creation, label creation, project board generation)
- `lib/auth.ts` — NextAuth + GitHub OAuth with encrypted JWT sessions
- `lib/rate-limit.ts` — Redis-backed distributed rate limiting
- `components/template-form.tsx` — 1100+ line template builder with validation + drag-and-drop
- `data/templates/` — All 21 template JSON files

---

## Business Model Opportunities

### Current State (Free / MVP)
- Fully functional, deployed, on Play Store
- No monetization yet — pure value delivery

### Monetization Paths to Explore
1. **Freemium** — Free tier (3 boards/month), paid tier (unlimited + private templates)
2. **Pro Templates** — Premium template packs ($5–15 one-time or subscription)
3. **Team Plan** — Shared template libraries, org-level boards, collaboration features
4. **API Access** — Sell API access to CI/CD pipelines, other dev tools
5. **White Label** — License to dev agencies or enterprise teams
6. **Marketplace** — Let community sell templates, take a % cut

### Pricing Anchors (comparable tools)
- Linear: $8–16/user/month
- Notion: $8–16/user/month
- GitHub itself: free to $21/user/month
- BoardKit is *adjacent* — not a PM tool, but a board *setup* accelerator

---

## Distribution Channels

- **Google Play Store** — already submitted
- **Product Hunt** — strong fit for developer tools
- **GitHub Marketplace** — could list as a GitHub App
- **Dev Twitter/X** — viral potential with "before/after" demo content
- **Hacker News** (Show HN) — developer-heavy audience, loves OSS/indie tools
- **Dev.to / Hashnode** — write tutorials around it
- **YouTube / TikTok** — 60-second "I saved 4 hours using this tool" format
- **Reddit** — r/webdev, r/programming, r/SideProject, r/github
- **IndieHackers** — ideal community for solo founders

---

## Competitive Positioning

**Direct competitors**: None that do exactly this (GitHub board auto-generation from templates)

**Adjacent tools**:
- GitHub's own project templates (very limited, no issues auto-created)
- Linear (full PM tool, not GitHub-native)
- Zenhub (GitHub plugin, expensive, complex)

**Moat**: Deep GitHub API integration + template system + PWA = unique positioning as the "fast start" tool for GitHub-native teams.

---

## Founder Vision

This is the first app in a portfolio of small, focused SaaS tools built by a solo founder operating as a CTO-in-training. The goal:

- Build and ship multiple small apps / websites
- Each product solves a specific developer or business pain point
- Operate lean, charge fair prices, compound learnings
- Grow toward running a small product studio or engineering team
- Use each product as a resume piece, revenue source, and learning vehicle

BoardKit is **Product #1**.

---

## Questions for a Marketing / Strategy Conversation

1. What's the right launch sequence? (Soft launch → Product Hunt → Press?)
2. Should it stay free to grow users first, or gate behind a paywall from day 1?
3. What's the best niche to dominate first? (Solo devs? Startups? Dev agencies?)
4. How do I build an audience *before* I launch the next product?
5. What does a one-person SaaS studio org structure look like?
6. How do I price this without leaving money on the table or scaring users off?
7. GitHub App vs. OAuth web app — which distribution model wins long term?
8. How do I get featured on Product Hunt, GitHub Marketplace, or Play Store?

---

*Created: May 2026 | Project: BoardKit | Founder: Building toward CTO & SaaS studio*
