# BoardKit Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name:** BoardKit (or your preferred name)
   - **Homepage URL:** `http://localhost:3000` (for development)
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Note down your **Client ID** and **Client Secret**

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your GitHub OAuth credentials:
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
   NODE_ENV=development
   ```

3. Generate a secret for `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## 📱 Testing PWA Features

### On Desktop (Chrome)

1. Run `npm run build && npm start`
2. Open `http://localhost:3000`
3. Look for the install icon in the address bar
4. Click to install as a desktop app

### On Mobile

1. Deploy to Vercel or similar hosting
2. Open the URL on your mobile device
3. Look for "Add to Home Screen" prompt
4. Install and test

## 🚢 Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
vercel
```

### 3. Set Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env`
3. Update `NEXTAUTH_URL` to your production URL
4. Update GitHub OAuth app callback URL to match

### 4. Update GitHub OAuth App

Update the callback URL to:
```
https://your-app.vercel.app/api/auth/callback/github
```

## 📦 Play Store Submission

### Prerequisites

1. Google Play Developer account ($25 one-time fee)
2. App built and deployed
3. Privacy policy URL
4. App screenshots

### Steps

1. **Generate Production Build**
   ```bash
   npm run build
   npm start
   ```

2. **Create TWA (Trusted Web Activity)**
   - Use Bubblewrap: https://github.com/GoogleChromeLabs/bubblewrap
   - Or PWABuilder: https://www.pwabuilder.com/

3. **Generate Screenshots**
   - Phone: 1080x1920 or 1080x2340
   - Tablet: 1920x1200
   - Take screenshots of:
     - Landing page
     - Template gallery
     - Template details
     - Repository selection
     - Success state

4. **Create Store Listing**
   - App name: BoardKit
   - Short description (80 chars)
   - Full description (4000 chars max)
   - Category: Productivity
   - Tags: github, developer tools, project management

5. **Privacy Policy**
   - Create a privacy policy page
   - Host it publicly
   - Link in Play Store listing

6. **Submit for Review**
   - Upload APK/AAB
   - Complete all required fields
   - Submit for review (1-7 days)

## 🔧 Troubleshooting

### Authentication Issues

If GitHub OAuth isn't working:
1. Check your callback URL matches exactly
2. Verify environment variables are set
3. Clear browser cookies and try again
4. Check GitHub OAuth app is not suspended

### Build Issues

If the build fails:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### PWA Not Installing

1. Must be served over HTTPS (except localhost)
2. Must have valid manifest.json
3. Must have service worker registered
4. Check browser console for PWA errors

## 📝 Additional Configuration

### Custom Domain

1. Add domain in Vercel
2. Update `NEXTAUTH_URL` environment variable
3. Update GitHub OAuth callback URL

### Analytics

Add analytics by integrating:
- Vercel Analytics (built-in)
- Google Analytics
- PostHog
- Mixpanel

### Error Tracking

Add error tracking with:
- Sentry
- LogRocket
- Datadog

## 🆘 Support

- GitHub Issues: https://github.com/Younique98/boardkit/issues
- Documentation: See README.md

## 🎉 Success!

Your BoardKit instance should now be running. Happy generating!
