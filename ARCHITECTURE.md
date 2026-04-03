# Pulse Platform Architecture

## Core Concept
Live video speed dating. 5 people enter a session. Each person dates every other person for 5 minutes (25 min total). After all dates, everyone rates. Mutual likes = match. Matches can continue to private 1-to-1 video date.

## Session Model (Hybrid)
- **On-demand**: Users enter a persistent lobby. When 5+ people are waiting, a session auto-starts (countdown + opt-in).
- **Scheduled**: Admin or system creates scheduled sessions (e.g., "Friday 8pm Dubai"). Users book a seat. Session starts at scheduled time if minimum 5 present.
- **Flexible group size**: Minimum 4, optimal 5, maximum 6. Rotation adjusts automatically.

## Tech Stack
- **Frontend**: React 19 + TypeScript 5.9 + Vite 7.3 + Tailwind CSS v4
- **Backend**: Supabase (Auth, Postgres, Realtime, Storage, Edge Functions)
- **Video**: PeerJS (WebRTC) — peer-to-peer video, no media server needed at this scale
- **Signaling**: Supabase Realtime (Broadcast channels for session orchestration)
- **Hosting**: Vercel (frontend + serverless API routes)
- **Bot**: Telegram (@PulseDatingBot) — ops tool for founder only

## Database Schema

### users
```sql
id              uuid PK (= auth.users.id)
email           text UNIQUE
phone           text UNIQUE
display_name    text NOT NULL
age             int NOT NULL CHECK (age >= 18)
gender          text NOT NULL
city            text
bio             text (max 300 chars)
photo_url       text
interests       text[] (array of tags)
is_verified     boolean DEFAULT false
is_banned       boolean DEFAULT false
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
last_seen       timestamptz
```

### sessions
```sql
id              uuid PK DEFAULT gen_random_uuid()
type            text NOT NULL CHECK (type IN ('on_demand', 'scheduled'))
status          text NOT NULL DEFAULT 'waiting'
                CHECK (status IN ('waiting', 'countdown', 'live', 'rating', 'completed', 'cancelled'))
scheduled_at    timestamptz (NULL for on_demand)
started_at      timestamptz
ended_at        timestamptz
max_participants int DEFAULT 5
current_round   int DEFAULT 0
total_rounds    int (calculated from participant count)
created_at      timestamptz DEFAULT now()
```

### session_participants
```sql
id              uuid PK DEFAULT gen_random_uuid()
session_id      uuid FK → sessions.id
user_id         uuid FK → users.id
joined_at       timestamptz DEFAULT now()
left_at         timestamptz
status          text DEFAULT 'active'
                CHECK (status IN ('active', 'disconnected', 'left', 'removed'))
UNIQUE(session_id, user_id)
```

### rounds
```sql
id              uuid PK DEFAULT gen_random_uuid()
session_id      uuid FK → sessions.id
round_number    int NOT NULL
user_a          uuid FK → users.id
user_b          uuid FK → users.id
started_at      timestamptz
ended_at        timestamptz
extended        boolean DEFAULT false
spark_a         boolean DEFAULT false (user_a sent spark)
spark_b         boolean DEFAULT false (user_b sent spark)
mutual_spark    boolean GENERATED (spark_a AND spark_b)
```

### ratings
```sql
id              uuid PK DEFAULT gen_random_uuid()
session_id      uuid FK → sessions.id
round_id        uuid FK → rounds.id
rater_id        uuid FK → users.id
rated_id        uuid FK → users.id
rating          text NOT NULL CHECK (rating IN ('like', 'pass'))
created_at      timestamptz DEFAULT now()
UNIQUE(round_id, rater_id)
```

### matches
```sql
id              uuid PK DEFAULT gen_random_uuid()
session_id      uuid FK → sessions.id
user_a          uuid FK → users.id
user_b          uuid FK → users.id
matched_at      timestamptz DEFAULT now()
status          text DEFAULT 'active'
                CHECK (status IN ('active', 'blocked', 'expired'))
```

### reports
```sql
id              uuid PK DEFAULT gen_random_uuid()
reporter_id     uuid FK → users.id
reported_id     uuid FK → users.id
session_id      uuid FK → sessions.id (nullable)
reason          text NOT NULL
                CHECK (reason IN ('inappropriate', 'harassment', 'fake_profile', 'underage', 'spam', 'other'))
details         text
status          text DEFAULT 'pending'
                CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed'))
created_at      timestamptz DEFAULT now()
```

### blocks
```sql
id              uuid PK DEFAULT gen_random_uuid()
blocker_id      uuid FK → users.id
blocked_id      uuid FK → users.id
created_at      timestamptz DEFAULT now()
UNIQUE(blocker_id, blocked_id)
```

## Session Orchestration Flow

### Phase 1: Lobby (Supabase Realtime Presence)
```
User joins lobby channel → presence tracked
UI shows: avatar grid of who's waiting, count, "Session starts when 5 people are ready"
When count >= 5:
  → 30-second countdown starts (broadcast)
  → Users confirm "I'm ready" (opt-in)
  → If 4+ confirm → session created, participants locked
  → If <4 confirm → countdown resets
```

### Phase 2: Session Start
```
Server creates session + rounds (round-robin pairing)
Broadcast: session_id, round pairings, total rounds
All clients receive their schedule:
  Round 1: You + Sofia
  Round 2: You + Layla
  Round 3: You + Amira
  ...
```

### Phase 3: Live Rounds (PeerJS + Supabase Broadcast)
```
Each round:
  1. Broadcast: "round_start" { round_number, pairs: [{a, b}] }
  2. Each pair establishes PeerJS connection (peer IDs exchanged via broadcast)
  3. 5-minute timer (server-authoritative via broadcast ticks)
  4. Spark signals: user taps → broadcast to partner → mutual = reveal
  5. Extend: both agree → timer adds 2 min (once per round)
  6. Timer ends → PeerJS connections torn down
  7. 15-second transition screen
  8. Next round
```

### Phase 4: Rating
```
After all rounds complete:
  Broadcast: "session_rating_phase"
  Each user sees all dates, rates like/pass
  Ratings submitted to Supabase
  Server computes mutual likes → creates matches
```

### Phase 5: Results
```
Broadcast: "session_results" { matches: [...] }
Cascade reveal animation
Matches can start 1-to-1 private video date (PeerJS direct)
```

## Round-Robin Pairing Algorithm
For N participants, generate all unique pairs:
- 5 people → 10 pairs → 10 rounds (50 min) — TOO LONG
- BETTER: Each person dates 4 others → 5 rounds per person
- With 5 people: use round-robin tournament scheduling
  - 4 rounds, each round has 2 pairs + 1 sitting out
  - OR: 5 rounds, each round has 2 pairs, rotate who sits out
  - Total session: ~30 min (5 rounds × 5 min + transitions)

### Optimized for 5 participants:
```
Round 1: (1,2) (3,4) — 5 waits
Round 2: (1,3) (2,5) — 4 waits
Round 3: (1,4) (3,5) — 2 waits
Round 4: (1,5) (2,4) — 3 waits
Round 5: (2,3) (4,5) — 1 waits
```
Every person dates every other person exactly once. 5 rounds × 5 min = 25 min + 4 transitions × 15s = 26 min total.

## Real-time Architecture

### Channels (Supabase Realtime)
```
pulse:lobby          — Presence: who's in the lobby
pulse:session:{id}   — Broadcast: timer, round events, sparks, extends
pulse:video:{id}     — Broadcast: PeerJS peer ID exchange for WebRTC setup
```

### Event Types
```
lobby_ready_check    — countdown started, confirm participation
session_created      — session locked, here's your schedule
round_start          — begin round N, here are the pairs
round_tick           — timer sync (every 10s from server)
spark_sent           — user sent spark signal
spark_mutual         — both sparked — reveal!
extend_request       — user requested time extension
extend_confirmed     — both agreed to extend
round_end            — round over, transition
rating_phase         — all rounds done, rate your dates
results_ready        — matches computed, here they are
user_disconnected    — someone dropped, handle gracefully
user_reported        — in-session report filed
```

## Safety Architecture

### Pre-Session
- Camera + mic permission gate (no skip)
- Age verification: self-declared 18+ (legal requirement)
- Profile photo required (no anonymous users)
- Blocked users never matched in same session

### During Session
- Report button always visible (bottom corner)
- Report = instant separation from that person's rounds
- Emergency exit: "Leave Session" always available
- No screenshot notification (privacy by design)
- No recording capability exposed
- All video is peer-to-peer (never hits our servers)

### Post-Session
- Block anyone from results screen
- Report with categorized reasons
- Auto-review queue for reports
- 3+ reports → automatic temporary ban pending review
- Match expiry: matches expire after 7 days if no 1-to-1 date initiated

### Data Privacy
- Video streams: peer-to-peer only, never stored
- Chat messages (if any): end-to-end, not stored
- Profile photos: stored in Supabase Storage (user can delete)
- Session data: retained for safety review, anonymized after 90 days

## Auth Flow
1. User opens app → marketing page → sign up
2. Sign up: email or phone → Supabase Auth OTP
3. Verify OTP → profile creation (name, age, gender, city, photo, bio)
4. Profile complete → enters lobby
5. Session tokens: Supabase JWT, auto-refreshed

## File Structure (New)
```
src/
├── App.tsx                     # Router (updated with auth gating)
├── main.tsx
├── index.css
├── theme.ts
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── auth.ts                 # Auth helpers (signup, login, logout, session)
│   ├── lobby.ts                # Lobby presence + ready checks
│   ├── session.ts              # Session CRUD + orchestration
│   ├── video.ts                # PeerJS wrapper + connection management
│   ├── realtime.ts             # Supabase Realtime channel management
│   ├── safety.ts               # Report, block, consent helpers
│   └── pairing.ts              # Round-robin pairing algorithm
├── hooks/
│   ├── useAuth.ts              # Auth state + user profile
│   ├── useLobby.ts             # Lobby presence + counts
│   ├── useSession.ts           # Session state machine
│   ├── useVideo.ts             # Video stream management
│   ├── useTimer.ts             # Server-synced countdown
│   └── useRealtime.ts          # Channel subscription management
├── screens/
│   ├── MarketingPage.tsx       # (existing)
│   ├── WaitlistPage.tsx        # → becomes SignUpPage.tsx
│   ├── LoginScreen.tsx         # → real auth
│   ├── ProfileSetup.tsx        # NEW: onboarding profile creation
│   ├── HomeScreen.tsx          # → lobby entry point
│   ├── Lobby.tsx               # NEW: real-time lobby with presence
│   ├── SessionLobby.tsx        # → pre-round countdown + schedule
│   ├── LiveSession.tsx         # → real WebRTC rounds
│   ├── TransitionScreen.tsx    # (existing, minor updates)
│   ├── MatchSurvey.tsx         # → real ratings
│   ├── MatchResults.tsx        # → real matches
│   ├── VideoDate.tsx           # → 1-to-1 post-match (existing PeerJS)
│   ├── ProfileScreen.tsx       # NEW: edit profile, settings
│   ├── ReportScreen.tsx        # NEW: report flow
│   └── InvestorClose.tsx       # (existing)
├── components/
│   ├── PulseLogo.tsx           # (existing)
│   ├── BackgroundOrbs.tsx      # (existing)
│   ├── MatchCard.tsx           # (existing)
│   ├── CameraPreview.tsx       # NEW: camera check + consent
│   ├── ParticipantGrid.tsx     # NEW: lobby avatars
│   ├── VideoTile.tsx           # NEW: individual video stream
│   ├── Timer.tsx               # NEW: synced countdown
│   ├── SparkButton.tsx         # NEW: spark interaction
│   ├── ReportButton.tsx        # NEW: in-session report
│   └── SafetyBanner.tsx        # NEW: consent + safety info
└── data/
    ├── people.ts               # (existing, becomes fallback)
    └── sponsors.ts             # (existing)

api/
├── telegram.ts                 # (existing)
├── session-create.ts           # NEW: create session from lobby
├── session-tick.ts             # NEW: cron-based timer authority
└── compute-matches.ts          # NEW: mutual like computation
```

## Edge Functions (Vercel API Routes)
- `POST /api/session-create` — Lock lobby participants, create session + rounds, broadcast start
- `POST /api/session-tick` — Server-authoritative timer (prevents client manipulation)
- `POST /api/compute-matches` — After ratings, compute mutual likes, create match records, broadcast results

## Deployment
- Frontend: Vercel (auto-deploy from main)
- Database: Supabase (managed Postgres)
- Auth: Supabase Auth
- Realtime: Supabase Realtime (WebSocket)
- Video: PeerJS Cloud (free STUN/TURN via PeerJS default server)
- Bot: Vercel serverless function

## Scaling Notes (Future)
- PeerJS Cloud has limits; will need own TURN server at scale (Twilio or Cloudflare)
- Supabase Realtime: 200 concurrent connections on free tier, 500 on Pro
- Video quality: 720p default, adaptive bitrate via PeerJS
- For 1000+ concurrent users: consider SFU (Selective Forwarding Unit) instead of mesh
