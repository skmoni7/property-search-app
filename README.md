# 🏠 Property Search App

A collaborative rental and home buying research tool built with **Next.js**, **Firebase**, and **Google Maps APIs**.

## Features
- 📍 Multiple location workspaces (e.g., Philadelphia, Austin, NYC)
- 🏘️ Separate **Rent** and **Buy** sub-pages
- 📏 Auto-calculates distance to 2 workplaces
- 🛒 Nearest Costco, Walmart, Indian grocery store
- 🏫 School ratings (Elementary/Middle/High) for buy properties
- 🗺️ Map view with numbered markers
- 👥 Invite collaborators (e.g., your spouse)
- 🔍 Filter & sort all columns
- 💾 All data saved in Firebase per location

## Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend/DB**: Firebase Firestore + Firebase Auth
- **Maps & Places**: Google Maps JavaScript API, Distance Matrix, Places API
- **Schools**: GreatSchools API
- **Property Data**: RentCast API
- **Deployment**: Vercel

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/skmoni7/property-search-app.git
cd property-search-app
npm install
```

### 2. Set up environment variables
Copy `.env.example` to `.env.local` and fill in your API keys:
```bash
cp .env.example .env.local
```

### 3. Firebase Setup
- Go to [Firebase Console](https://console.firebase.google.com)
- Create a new project named `property-search-app`
- Enable **Authentication** (Email/Password + Google)
- Enable **Firestore Database** (start in production mode)
- Copy your Firebase config into `.env.local`

### 4. Google APIs Setup
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Enable: Maps JavaScript API, Places API, Distance Matrix API, Geocoding API
- Create an API key and add to `.env.local`

### 5. Run locally
```bash
npm run dev
```

## Deployment (Vercel)
```bash
npx vercel --prod
```
Add all `.env.local` variables to Vercel environment settings.
