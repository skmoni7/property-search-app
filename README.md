# Property Search App 🏡

A collaborative rental and home buying research tool with location workspaces, distance calculations, school ratings, and map visualization.

## ✨ Features

### Two Sub-Pages: Rent & Buy
- **Rent Page**: Manual price/sqft entry + auto-populated distances and amenities
- **Buy Page**: Auto-fetched property details (beds/baths/sqft/lot/price) + school ratings + distances

### Location Workspaces
- Create separate workspaces for each city (e.g., Philadelphia, Austin, New York)
- Each workspace saves its own Rent and Buy property lists
- Switch between locations seamlessly
- Invite your spouse or collaborators to view and edit together in real-time

### Smart Auto-Population
When you add a property address, the app automatically calculates:
- ✅ Distance & drive time to Workplace 1 & 2 (you set these once)
- ✅ Nearest Costco (name, distance, drive time)
- ✅ Nearest Walmart (name, distance, drive time)
- ✅ Nearest Indian grocery store (name, distance, drive time)
- ✅ **For Buy properties only**: Beds, baths, sqft, lot size, price, nearby school names

### Manual Editing with Inline Pencil Icons
- Every cell in the table has a **pencil icon** on hover
- Click to edit any value (even auto-populated ones)
- Yellow dot indicator shows which fields you've manually overridden
- School ratings (E/M/H format like `8/7/9`) must be entered manually via pencil icon
  - Visit [GreatSchools.org](https://www.greatschools.org) or [Niche.com](https://www.niche.com) to look up ratings

### Smart Caching (Saves Your API Quota!)
- RentCast API data is permanently cached in Firestore
- **You only have 50 free calls/month** — once an address is fetched, it's never called again
- Even if you delete a property and re-add the same address later, cache is used (0 API calls)

### Map View with Numbered Markers
- Toggle between table and map view
- Properties shown as numbered markers (1, 2, 3...) matching table row numbers
- Workplaces shown as different colored pins
- Click marker for property summary popup

### Filter & Sort
- Filter and sort on all columns
- Save custom filter views (optional feature)

### Add/Delete Rows
- "Add Property" button at top of each page
- Delete button on each row

### Collaboration
- **Invite** button to share location workspace with your wife or others
- Real-time sync via Firebase Firestore
- Both users see updates instantly

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 14 (React, TypeScript) |
| Backend | Firebase (Auth + Firestore) |
| Hosting | Vercel |
| Maps | Google Maps JavaScript API |
| Geocoding | Google Geocoding API |
| Places | Google Places API (Nearby Search) |
| Distance | Google Distance Matrix API |
| Property Data | RentCast API (50 free/month) |
| School Ratings | Manual entry (GreatSchools has no free API) |

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/skmoni7/property-search-app.git
cd property-search-app
npm install
```

### 2. Get Your API Keys

#### Firebase (Free)
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. **Enable Authentication**:
   - Go to Build → Authentication → Get Started
   - Enable Email/Password and Google sign-in
4. **Enable Firestore**:
   - Go to Build → Firestore Database → Create Database
   - Start in production mode
5. **Add Firestore Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth.uid == userId;
       }
       match /locations/{locationId} {
         allow read, write: if request.auth != null &&
           (resource.data.ownerId == request.auth.uid ||
            resource.data.collaborators.hasAny([request.auth.token.email]));
         match /{subcollection}/{docId} {
           allow read, write: if request.auth != null;
         }
       }
       match /propertyCache/{cacheId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
6. Go to Project Settings → Copy your Firebase config values

#### Google Maps APIs (Free $200/month)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services → Library**
4. Enable these **4 APIs**:
   - Maps JavaScript API
   - Geocoding API
   - Places API (New)
   - Distance Matrix API
5. Go to **Credentials → Create API Key**
6. Copy your API key
7. **IMPORTANT**: Set daily quotas to prevent surprise charges:
   - Go to **APIs & Services → Quotas**
   - Set each API to max **500 requests/day**

#### RentCast API (Free 50 calls/month)
1. Go to [rentcast.io/api](https://rentcast.io/api)
2. Sign up for free account
3. Copy your API key

### 3. Create `.env.local` File

Copy `.env.example` to `.env.local` and fill in your real values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys (see the file for full template).

**NEVER commit `.env.local` to GitHub!** It's already in `.gitignore`.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
npx vercel --prod
```

Then add all your `.env.local` variables in **Vercel Dashboard → Your Project → Settings → Environment Variables**.

---

## 📊 Data Structure

### Firestore Collections

```
users/
  {userId}/
    email, workplace1, workplace2

locations/
  {locationId}/  (e.g., "philadelphia")
    name, ownerId, collaborators[]
    
    rentProperties/
      {propertyId}/
        address, price, sqft, distances, amenities, notes, manualOverrides{}
    
    buyProperties/
      {propertyId}/
        address, beds, baths, sqft, lotSize, price, schoolRating, distances, amenities, notes, manualOverrides{}

propertyCache/  (RentCast API cache)
  {normalizedAddress}/
    beds, baths, sqft, lotSize, price, source, fetchedAt
```

---

## 🎯 How It Works

### Rent Page Workflow
1. User enters property address
2. App geocodes address → gets lat/lng
3. Parallel API calls:
   - Distance to Workplace 1 & 2
   - Nearest Costco, Walmart, Indian store
4. User manually enters price and sqft
5. Row populates in table with loading states
6. All data saved to Firestore

### Buy Page Workflow
1. User enters property address
2. **Check RentCast cache first** (Firestore `propertyCache` collection)
   - Cache HIT → Use stored data (0 API calls) ✅
   - Cache MISS → Call RentCast API → Save to cache forever
3. Parallel calls for distances and amenities (same as Rent)
4. Nearby school names fetched via Google Places
5. School ratings default to `?/?/?` → user edits via pencil icon
6. Row populates in table
7. All data saved to Firestore

### Inline Editing
- Hover over any table cell → pencil icon appears
- Click pencil → input field activates
- Edit value → press Enter or click outside to save
- Yellow dot appears next to manually edited fields
- `manualOverrides` object tracks which fields were edited

---

## 🔑 Environment Variables Reference

See `.env.example` for the complete template. Here's what each key does:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps/Places/Distance/Geocoding |
| `RENTCAST_API_KEY` | RentCast property data (server-side only) |

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. `RENTCAST_API_KEY` has no prefix, so it's server-side only for security.

---

## 💡 Tips & Best Practices

### API Quota Management
- Google Maps free tier: 10,000 req/month per API
- RentCast free tier: 50 req/month
- **Always check cache before calling RentCast!** (already implemented)
- Set daily quotas in Google Cloud Console to avoid surprise charges

### School Ratings
- GreatSchools has **no free API tier**
- School names are auto-fetched via Google Places
- Ratings must be manually entered:
  1. Visit [greatschools.org](https://www.greatschools.org)
  2. Search the property address
  3. Note the Elementary/Middle/High ratings (e.g., 8/7/9)
  4. Click pencil icon in "Schools E/M/H" column
  5. Type `8/7/9` format

### Collaboration
- Invite collaborators via email address
- They must sign up with that same email to see the workspace
- Both users see real-time updates via Firestore listeners

### Map Markers
- Properties numbered 1, 2, 3... matching table row order
- Workplaces shown as different colored pins
- Click any marker for quick summary popup

---

## 📝 License

MIT

---

## 🤝 Contributing

This is a personal project for property search. Feel free to fork and customize for your own use!

---

**Built with ❤️ for smarter home searching**
