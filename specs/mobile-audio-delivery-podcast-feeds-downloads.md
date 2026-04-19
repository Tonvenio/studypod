# Plan: Mobile Audio Delivery — Podcast Feeds + Direct Downloads

## Task Description

Make studypod.ai's generated audio flashcards easily consumable on mobile phones for non-technical users (students 18-22). Two complementary delivery channels:

1. **Per-user private RSS podcast feeds** — each registered user gets a unique podcast feed URL they can subscribe to in Apple Podcasts, Spotify, Pocket Casts, etc. When they generate new audio flashcards, episodes automatically appear in their podcast app.
2. **Direct MP3 downloads from the website** — a "Download MP3" button per card and a "Download all as ZIP" button per deck, plus a user-friendly guide on how to listen on mobile (transfer to phone, use Files app, etc.).

## Objective

When this plan is complete:
1. Every registered user has a private RSS feed at `/api/feed/[userId]` that works in any podcast app
2. Audio flashcards appear as podcast episodes with proper metadata (title, description, artwork)
3. Non-registered users can download individual MP3s or a ZIP of the full deck
4. A "Listen on mobile" guide page explains all options with screenshots/illustrations
5. The deck page shows clear CTAs for both channels: "Subscribe in podcast app" and "Download MP3s"

## Problem Statement

Currently, generated audio flashcards are only playable in the browser via the inline `AudioMiniPlayer`. Students study primarily on mobile, often while commuting. They need audio in apps they already use — mainly podcast apps. The current system:

- **No persistence**: Audio files live in `/tmp` and disappear on server restart
- **No RSS feeds**: No way to subscribe and get episodes pushed to a podcast app
- **No downloads**: No way to save MP3s for offline listening
- **No mobile guide**: Non-technical users don't know how to get audio onto their phones

## Solution Approach

### Architecture: Two-Track Delivery

```
┌─────────────────────┐     ┌──────────────────────┐
│  TRACK 1: PODCAST   │     │  TRACK 2: DOWNLOADS  │
│                     │     │                      │
│  User registers     │     │  No account needed   │
│       ↓             │     │       ↓              │
│  Gets private feed  │     │  "Download MP3"      │
│  /api/feed/[userId] │     │  button per card     │
│       ↓             │     │       ↓              │
│  Subscribes in      │     │  "Download all ZIP"  │
│  Apple Podcasts /   │     │  button per deck     │
│  Spotify / etc.     │     │       ↓              │
│       ↓             │     │  Guide: "How to      │
│  New decks auto-    │     │  listen on your      │
│  appear as episodes │     │  phone"              │
└─────────────────────┘     └──────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Audio storage | Supabase Storage | Persistent, URL-addressable, free tier = 1GB |
| RSS format | Standard podcast RSS 2.0 + iTunes tags | Works in all podcast apps |
| RSS library | `podcast` npm package | Same as IMR project, proven |
| Feed privacy | UUID-based URL (no auth header) | Podcast apps can't send auth headers; UUID is unguessable |
| ZIP generation | `archiver` npm package | Streams ZIP without holding all files in memory |
| Episode = | One card's audio | Each flashcard becomes one short episode (1-2 min) |
| Podcast title | "studypod: {topic}" | Clear in podcast app library |

### Per-User Podcast Feed Flow

1. User registers (or logs in) on studypod.ai
2. Profile gets a `feed_token` (UUID v4) — unique, unguessable, resettable
3. User generates a deck with audio → cards saved to Supabase (flashcards table + audio in Storage)
4. Feed URL: `https://studypod.ai/api/feed/{feed_token}`
5. User copies this URL into their podcast app
6. Podcast app fetches the feed → gets all their audio flashcards as episodes
7. When user generates new cards, they appear in the feed on next refresh

### Direct Download Flow

1. User generates a deck (no account needed)
2. Each card with audio shows a download icon → downloads the MP3 directly
3. "Download all" button → generates a ZIP of all rendered MP3s in the deck
4. Below the download buttons: link to "How to listen on mobile" guide

### Mobile Listening Guide (static page)

A friendly, visual guide at `/guide/mobile-listening` with:
- **Option 1: Podcast app** (recommended) — screenshot walkthrough for Apple Podcasts + Spotify
- **Option 2: Download + Files app** — how to save MP3 to phone and play via Files/Music app
- **Option 3: Just use the website** — the browser player works on mobile too

## Relevant Files

### Existing Files (modify)
- `supabase/migrations/001_core.sql` — Add `feed_token` column to profiles, add `audio_storage_path` to flashcards
- `src/types/flashcard.ts` — Add `audioStoragePath` field to Flashcard type
- `src/app/api/render-audio/route.ts` — After rendering, upload MP3 to Supabase Storage instead of /tmp
- `src/app/api/audio/[filename]/route.ts` — Redirect to Supabase Storage URL (or proxy)
- `src/app/deck/new/page.tsx` — Add download buttons and podcast subscribe CTA
- `src/app/deck/[deckId]/page.tsx` — Add download buttons and podcast subscribe CTA
- `src/app/dashboard/page.tsx` — Show feed URL with copy button

### New Files
- `supabase/migrations/002_feed_token.sql` — Migration for feed_token + audio storage
- `src/app/api/feed/[token]/route.ts` — RSS feed generator (podcast XML)
- `src/app/api/download/[cardId]/route.ts` — Direct MP3 download with proper headers
- `src/app/api/download-deck/[deckId]/route.ts` — ZIP download of all deck MP3s
- `src/lib/audio/storage.ts` — Supabase Storage upload/URL helpers
- `src/lib/feed/rss-generator.ts` — RSS/podcast XML builder using `podcast` package
- `src/components/PodcastSubscribe.tsx` — "Subscribe in podcast app" UI with feed URL + copy + QR code
- `src/components/DownloadButton.tsx` — MP3 download button per card
- `src/components/DownloadAllButton.tsx` — ZIP download for full deck
- `src/app/guide/mobile-listening/page.tsx` — Visual guide page

## Implementation Phases

### Phase 1: Persistent Audio Storage
Move audio from `/tmp` to Supabase Storage so files survive server restarts and are URL-addressable for podcast feeds.

- Add `audio_storage_path` column to `flashcards` table
- Create `src/lib/audio/storage.ts` with upload/getPublicUrl helpers
- Update `/api/render-audio` to upload to Supabase Storage after FFmpeg
- Update `/api/audio/[filename]` to proxy or redirect from Supabase Storage

### Phase 2: Per-User Podcast Feeds
Each user gets a private RSS feed that podcast apps can consume.

- Add `feed_token` (UUID) to `profiles` table, auto-generated on registration
- Install `podcast` npm package (same as IMR project)
- Create `src/lib/feed/rss-generator.ts` — builds podcast-compliant RSS XML
- Create `/api/feed/[token]` route — looks up user by feed_token, fetches their decks + cards with audio, generates RSS
- Each card = one episode: title = card front, description = card back + explanation, enclosure = audio URL
- Podcast metadata: title = "studypod: Your Flashcards", author = "studypod.ai", artwork = generated cover

### Phase 3: Direct Downloads
Simple MP3 and ZIP downloads for users without accounts.

- Create `/api/download/[cardId]` — serves MP3 with `Content-Disposition: attachment`
- Install `archiver` package for ZIP streaming
- Create `/api/download-deck/[deckId]` — streams ZIP of all deck MP3s
- Add download buttons to deck page and new deck page

### Phase 4: UI Integration + Mobile Guide
Wire everything together in the frontend and create the guide.

- Create `PodcastSubscribe.tsx` — shows feed URL, copy button, QR code, podcast app icons
- Create `DownloadButton.tsx` and `DownloadAllButton.tsx`
- Update `/deck/new` and `/deck/[deckId]` pages with new CTAs
- Update `/dashboard` with feed URL display
- Create `/guide/mobile-listening` static page with step-by-step illustrations

## Team Orchestration

- You operate as the team lead and orchestrate the team to execute the plan.
- You're responsible for deploying the right team members with the right context to execute the plan.
- IMPORTANT: You NEVER operate directly on the codebase. You use `Task` and `Task*` tools to deploy team members to do the building, validating, testing, deploying, and other tasks.
  - This is critical. Your job is to act as a high level director of the team, not a builder.
  - Your role is to validate all work is going well and make sure the team is on track to complete the plan.
  - You'll orchestrate this by using the Task* Tools to manage coordination between the team members.
  - Communication is paramount. You'll use the Task* Tools to communicate with the team members and ensure they're on track to complete the plan.
- Take note of the session id of each team member. This is how you'll reference them.

### Team Members

- Builder
  - Name: **storage-builder**
  - Role: Migrate audio storage from /tmp to Supabase Storage, create upload helpers, update render pipeline
  - Agent Type: `general-purpose`
  - Resume: true

- Builder
  - Name: **feed-builder**
  - Role: Build per-user RSS podcast feed system (feed_token, RSS XML generation, feed API route)
  - Agent Type: `general-purpose`
  - Resume: true

- Builder
  - Name: **download-builder**
  - Role: Build MP3 download and ZIP export endpoints
  - Agent Type: `general-purpose`
  - Resume: true

- Builder
  - Name: **frontend-builder**
  - Role: Build PodcastSubscribe, DownloadButton components, update deck pages, create mobile guide
  - Agent Type: `general-purpose`
  - Resume: true

- Builder
  - Name: **ui-auditor**
  - Role: Audit the completed UI for accessibility, mobile responsiveness, and usability for non-technical users
  - Agent Type: `frontend-ui-auditor`
  - Resume: false

## Step by Step Tasks

- IMPORTANT: Execute every step in order, top to bottom. Each task maps directly to a `TaskCreate` call.
- Before you start, run `TaskCreate` to create the initial task list that all team members can see and execute.

### 1. Database Migration: feed_token + audio_storage_path
- **Task ID**: `db-migration`
- **Depends On**: none
- **Assigned To**: storage-builder
- **Agent Type**: `general-purpose`
- **Parallel**: false
- Create `supabase/migrations/002_feed_token.sql`:
  - Add `feed_token uuid default gen_random_uuid() unique` to `profiles`
  - Add `audio_storage_path text` to `flashcards`
  - Create index on `profiles(feed_token)` for fast feed lookups
  - Add trigger: auto-populate `feed_token` on profile insert if null

### 2. Supabase Storage Helpers
- **Task ID**: `storage-helpers`
- **Depends On**: `db-migration`
- **Assigned To**: storage-builder
- **Agent Type**: `general-purpose`
- **Parallel**: false
- Create `src/lib/audio/storage.ts`:
  - `uploadAudio(buffer: Buffer, path: string): Promise<string>` — upload to Supabase Storage bucket `audio`, return public URL
  - `getAudioUrl(path: string): string` — construct public URL from storage path
  - `deleteAudio(path: string): Promise<void>` — cleanup helper
  - Bucket structure: `audio/{userId}/{deckId}/{cardId}.mp3` (or `audio/anonymous/{deckId}/{cardId}.mp3` for guest decks)
- Update `src/app/api/render-audio/route.ts`:
  - After FFmpeg processing, upload MP3 to Supabase Storage
  - Store `audio_storage_path` in flashcards table (when Supabase connected)
  - Fall back to /tmp serving if Supabase not configured (dev mode)

### 3. Install podcast + archiver packages
- **Task ID**: `install-deps`
- **Depends On**: none
- **Assigned To**: feed-builder
- **Agent Type**: `general-purpose`
- **Parallel**: true (with db-migration)
- Run `npm install podcast archiver @types/archiver`
- Verify packages installed and importable

### 4. RSS Feed Generator Library
- **Task ID**: `rss-generator`
- **Depends On**: `install-deps`
- **Assigned To**: feed-builder
- **Agent Type**: `general-purpose`
- **Parallel**: false
- Create `src/lib/feed/rss-generator.ts`:
  - Use `podcast` npm package (same pattern as IMR's `xmlFeedUtility.ts`)
  - `generateUserFeed(user, decks, baseUrl): string` — generates podcast-compliant RSS XML
  - Podcast metadata: title "studypod.ai: {username}'s Flashcards", description, language, artwork URL
  - iTunes categories: "Education" > "Self-Improvement"
  - Each flashcard with audio becomes one `<item>` with `<enclosure>` pointing to the audio URL
  - Episode title: card front text (truncated to 120 chars)
  - Episode description: card back + explanation
  - Episode pubDate: card created_at
  - Group episodes by deck with episode numbers

### 5. Feed API Route
- **Task ID**: `feed-route`
- **Depends On**: `rss-generator`, `storage-helpers`
- **Assigned To**: feed-builder
- **Agent Type**: `general-purpose`
- **Parallel**: false
- Create `src/app/api/feed/[token]/route.ts`:
  - GET handler: look up `profiles` by `feed_token`, fetch user's decks + flashcards with audio
  - Return RSS XML with `Content-Type: application/rss+xml`
  - Cache for 5 minutes (`Cache-Control: public, max-age=300`)
  - Return 404 if token not found
  - Include `<itunes:image>` with a default studypod.ai cover

### 6. MP3 Download Route
- **Task ID**: `download-route`
- **Depends On**: `storage-helpers`
- **Assigned To**: download-builder
- **Agent Type**: `general-purpose`
- **Parallel**: true (with feed-route)
- Create `src/app/api/download/[cardId]/route.ts`:
  - GET handler: fetch card by ID, get audio URL/path
  - Stream the MP3 with headers: `Content-Type: audio/mpeg`, `Content-Disposition: attachment; filename="studypod-{topic}-{number}.mp3"`
  - For /tmp files: read and stream; for Supabase Storage: proxy or redirect

### 7. ZIP Download Route
- **Task ID**: `zip-route`
- **Depends On**: `download-route`
- **Assigned To**: download-builder
- **Agent Type**: `general-purpose`
- **Parallel**: false
- Create `src/app/api/download-deck/[deckId]/route.ts`:
  - GET handler: fetch all cards in deck with audio
  - Use `archiver` to stream a ZIP containing all MP3s
  - Filename: `studypod-{topic}.zip`
  - Each MP3 named: `{number}-{front-text-slug}.mp3`
  - Stream response — don't buffer entire ZIP in memory

### 8. PodcastSubscribe Component
- **Task ID**: `podcast-subscribe-ui`
- **Depends On**: `feed-route`
- **Assigned To**: frontend-builder
- **Agent Type**: `general-purpose`
- **Parallel**: true (with zip-route)
- Create `src/components/PodcastSubscribe.tsx`:
  - Shows the user's private feed URL in a copyable input field
  - "Copy link" button with success feedback
  - QR code of the feed URL (use inline SVG generation or `qrcode` package)
  - Podcast app icons: Apple Podcasts, Spotify, Pocket Casts, Overcast
  - Brief instruction: "Paste this URL in your podcast app to subscribe"
  - Collapsible "How to subscribe" section with 3 steps

### 9. Download Buttons Components
- **Task ID**: `download-buttons-ui`
- **Depends On**: `download-route`
- **Assigned To**: frontend-builder
- **Agent Type**: `general-purpose`
- **Parallel**: true (with podcast-subscribe-ui)
- Create `src/components/DownloadButton.tsx`:
  - Small download icon button per card
  - Downloads the MP3 via `/api/download/{cardId}`
  - Loading spinner while downloading
- Create `src/components/DownloadAllButton.tsx`:
  - "Download all MP3s (ZIP)" button
  - Downloads via `/api/download-deck/{deckId}`
  - Shows file count and estimated size

### 10. Update Deck Pages with Audio Delivery CTAs
- **Task ID**: `update-deck-pages`
- **Depends On**: `podcast-subscribe-ui`, `download-buttons-ui`
- **Assigned To**: frontend-builder
- **Agent Type**: `general-purpose`
- **Parallel**: false
- Update `src/app/deck/new/page.tsx`:
  - Add download icon button on each card (next to audio player)
  - Add "Download all MP3s" button in the header actions row
  - Add "Subscribe as podcast" section after the action buttons (for logged-in users)
- Update `src/app/deck/[deckId]/page.tsx`:
  - Same additions as deck/new
- Update `src/app/dashboard/page.tsx`:
  - Add "Your podcast feed" section with PodcastSubscribe component
  - Show feed URL with copy button

### 11. Mobile Listening Guide Page
- **Task ID**: `mobile-guide`
- **Depends On**: none
- **Assigned To**: frontend-builder
- **Agent Type**: `general-purpose`
- **Parallel**: true (with other frontend tasks)
- Create `src/app/guide/mobile-listening/page.tsx`:
  - **Section 1: Subscribe as Podcast** (recommended)
    - Step 1: Create account on studypod.ai
    - Step 2: Copy your feed URL from dashboard
    - Step 3: Open podcast app → "Add by URL" → paste
    - Step 4: New flashcards appear automatically
    - Screenshots/diagrams for Apple Podcasts, Spotify, Pocket Casts
  - **Section 2: Download MP3s**
    - Click download button on any card
    - "Download all" gets a ZIP
    - Transfer to phone via AirDrop, email, or cloud storage
    - Open in Files app (iOS) or file manager (Android)
  - **Section 3: Listen in Browser**
    - studypod.ai works on mobile Safari/Chrome
    - Add to home screen for app-like experience
  - Dark theme matching the rest of the site
  - Link to this guide from deck pages and landing page footer

### 12. Build Verification
- **Task ID**: `verify-build`
- **Depends On**: `update-deck-pages`, `mobile-guide`
- **Assigned To**: storage-builder
- **Agent Type**: `general-purpose`
- **Parallel**: false
- Run `npm run build` — verify no TypeScript errors
- Run `npm run lint` — verify code quality
- Verify all new routes appear in the build output
- Test feed XML is valid (well-formed XML with required podcast tags)

### 13. UI Audit
- **Task ID**: `ui-audit`
- **Depends On**: `verify-build`
- **Assigned To**: ui-auditor
- **Agent Type**: `frontend-ui-auditor`
- **Parallel**: false
- Audit all new/modified pages for:
  - Mobile responsiveness (375px+)
  - Accessibility (WCAG 2.1 AA)
  - Dark mode contrast
  - Non-technical user friendliness (clear labels, no jargon)
  - Download UX (progress indicators, error states)
  - Podcast subscribe UX (clear instructions, copy feedback)

## Acceptance Criteria

1. **Podcast feed**: `/api/feed/{token}` returns valid RSS 2.0 XML with iTunes podcast tags
2. **Feed content**: Each flashcard with audio appears as a podcast episode with enclosure URL
3. **Podcast app compatibility**: Feed URL works when pasted into Apple Podcasts, Spotify, or Pocket Casts
4. **MP3 download**: Individual cards downloadable as MP3 with proper filename
5. **ZIP download**: Full deck downloadable as ZIP with all rendered MP3s
6. **Dashboard**: Logged-in users see their feed URL with copy button
7. **Deck pages**: Download and subscribe CTAs visible on both `/deck/new` and `/deck/[deckId]`
8. **Mobile guide**: `/guide/mobile-listening` page with visual instructions for all 3 options
9. **Build**: `npm run build` completes without errors
10. **Persistence**: Audio files persist in Supabase Storage (not /tmp)

## Validation Commands

```bash
# 1. Build check
cd /Users/marc/GitHub/studypod-ai && npm run build

# 2. Lint check
npm run lint

# 3. Verify new routes exist
grep -r "route.ts" src/app/api/feed/ src/app/api/download/ src/app/api/download-deck/

# 4. Verify new components exist
ls src/components/PodcastSubscribe.tsx src/components/DownloadButton.tsx src/components/DownloadAllButton.tsx

# 5. Verify guide page exists
ls src/app/guide/mobile-listening/page.tsx

# 6. Verify migration exists
ls supabase/migrations/002_feed_token.sql

# 7. Verify podcast package installed
npm ls podcast archiver

# 8. Test feed XML validity (manual)
# curl http://localhost:3002/api/feed/{test-token} | xmllint --noout -
```

## Notes

### Why Per-User Feeds (Not Per-Deck)
- Students will generate many decks over time
- A single feed URL is simpler than managing N feed URLs
- Podcast apps handle one subscription better than many
- Episodes are grouped by deck title in the feed description

### Spotify Limitation
- Spotify doesn't support custom RSS feeds for end users (only via Spotify for Podcasters)
- The guide should mention this and recommend Apple Podcasts, Pocket Casts, or Overcast instead
- Spotify might work via podcast hosting platforms (future consideration)

### Audio Storage Sizing
- Average card audio: ~1.5 MB (1-2 min @ 128kbps mono)
- 20 cards per deck: ~30 MB
- Supabase free tier: 1 GB → supports ~33 decks
- Scale path: Cloudflare R2 (S3-compatible, no egress fees)

### Alternative: "Smart" Podcast Episode Per Deck
Instead of 1 episode per card (20 short episodes), consider offering an optional **"full deck episode"** that concatenates all card audios into one longer episode (20-40 min). This is more natural for podcast consumption. Could be a Phase 5 enhancement.

### Security
- Feed tokens are UUID v4 — unguessable, but not secret-level
- Users can regenerate their feed token from dashboard (invalidates old subscriptions)
- Public decks' audio is accessible via Storage URL regardless of feed subscription
