# BoardKit - GitHub Project Board Generator

> 🚀 **MVP Deadline:** November 29, 2025

## 🎯 Overview

BoardKit is a Progressive Web App (PWA) that generates structured GitHub project boards from pre-built templates. Create comprehensive project boards in seconds instead of hours.

## 💡 The Problem

Creating comprehensive project boards on GitHub is time-consuming:
- Manually creating dozens/hundreds of issues
- Organizing them into logical phases
- Adding appropriate labels and metadata
- Structuring for team collaboration

This can take hours for a single project setup.

## ✨ The Solution

1. Choose from pre-built project templates
2. Authenticate with GitHub OAuth
3. Generate complete project boards with one click
4. Customize templates before generation
5. Save and share custom templates

## 🚀 Features (MVP - Product Idea 2)

### Must-Have for Nov 29, 2025
- ✅ Template gallery (5-10 pre-built templates)
- ✅ GitHub OAuth authentication
- ✅ One-click board generation
- ✅ Military rideshare template included
- ✅ PWA installable on mobile devices

### Enhanced Features (Product Idea 1)
- 📋 Pre-built templates (Startup MVP, Feature Development, Bug Tracking)
- 🎨 Customizable phases and tasks
- 📱 Create project boards from your phone
- 💾 Save custom templates
- 🤝 Share templates with team

## 🛠 Tech Stack

- **Framework:** Next.js 15 (React 19)
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js with GitHub OAuth
- **GitHub API:** Octokit.js
- **PWA:** next-pwa
- **Hosting:** Vercel (web) + Google Play Store (PWA)

## 🏃 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
boardkit/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utilities and helpers
├── types/                 # TypeScript type definitions
├── public/                # Static assets
│   ├── manifest.json      # PWA manifest
│   └── icons/             # App icons
└── package.json           # Dependencies
```

## 🎨 Templates

Templates are structured as JSON objects with phases, issues, and labels:

```json
{
  "name": "Startup MVP",
  "description": "Complete project plan for MVP development",
  "phases": [...],
  "labels": [...],
  "issues": [...]
}
```

## 🔒 Security & Privacy

- OAuth tokens stored securely (encrypted)
- No storage of repository code
- Clear data usage policy
- User can revoke access anytime

## 📈 Success Metrics

### Launch Goals (By Nov 29, 2025)
- ✅ Published to Google Play Store
- ✅ Functional web app at custom domain
- 🎯 50+ board generations
- 🎯 10+ active users

## 📚 Reference

- [GitHub Issues API](https://docs.github.com/en/rest/issues)
- [GitHub Labels API](https://docs.github.com/en/rest/issues/labels)
- [Octokit.js](https://octokit.github.io/rest.js/)
- [NextAuth.js](https://next-auth.js.org/)

## 👩‍💻 Development Timeline

**Week 1-2:** Foundation (Next.js, GitHub OAuth, UI/UX)
**Week 3:** Core Functionality (API integration, templates)
**Week 4:** Polish & Launch (PWA optimization, testing, deployment)

## 📝 License

MIT

---

**Developer:** Erica Thompson
**Status:** In Development
**Created:** November 23, 2025
