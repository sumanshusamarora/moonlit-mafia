## Moonlit Mafia

Moonlit Mafia is a lightweight social deduction platform for running remote Mafia game nights. Hosts can spin up shareable lobbies, configure roles on the fly, guide day and night phases, and keep players engaged with real-time chat, voice messages, and AI-powered narrative commentary—all deployable to Vercel's free tier.

### Highlights
- **Mobile-first design** – bottom tab navigation, collapsible sections, floating action buttons optimized for touch screens
- **Instant lobbies** – generate a six-character join code and share it with friends, no accounts required
- **Role presets & tuning** – adjust counts per role with guardrails to keep games balanced for 4–16 players
- **Real-time sync** – Firestore listeners keep player readiness, phase transitions, votes, and chat aligned
- **AI commentary** (optional) – dramatic game narration using OpenAI gpt-4o-mini with 30+ custom template fallbacks
- **Integrated chat** – day/night channels with emoji shortcuts, voice messages, and system messages
- **Voice messaging** – record and send audio messages directly in chat with playback controls
- **Host controls** – start/advance phases, archive sessions, and manage investigations with a click

### Tech Stack
- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS + shadcn/ui primitives
- Zustand + React Query for client state and caching
- Firebase Authentication, Firestore, and Storage
- OpenAI GPT-4o-mini (optional - uses template fallbacks if not configured)
- Vercel-friendly configuration with dynamic routes and edge-ready components

## Getting Started

1. **Install dependencies**
	```bash
	npm install
	```

2. **Configure environment variables**
	- Copy `.env.example` to `.env.local`.
	- Fill in your Firebase project details (see the Firebase section below).
	- (Optional) Add OpenAI API key for AI commentary - game uses template fallbacks if not configured.

3. **Run the dev server**
	```bash
	npm run dev
	```
	Visit `http://localhost:3000` to explore the landing page, dashboard, and lobby flows.

4. **Lint the project (optional)**
	```bash
	npm run lint
	```

## Firebase Setup (Step-by-step)

Moonlit Mafia relies on Firebase for authentication, Firestore (real-time state), and Storage (voice messages). These steps assume you have no prior Firebase experience.

### 1. Create a Firebase project
- Visit [console.firebase.google.com](https://console.firebase.google.com/) and click **Add project**.
- Give it a name (e.g., `moonlit-mafia`) and select your preferred region.
- Analytics is optional—you can leave it enabled or disabled.

### 2. Register the web app
- Inside the new project, click **Add app → Web**.
- Enter an app nickname (e.g., `moonlit-mafia-web`) and click **Register app**.
- Firebase will show a config snippet containing keys such as `apiKey`, `authDomain`, etc.—copy these values for your `.env.local` file.

### 3. Enable Anonymous Authentication
- In the left nav, go to **Build → Authentication** and click **Get started**.
- Open the **Sign-in method** tab, add the **Anonymous** provider, and click **Save**.
- (Optional) Add additional providers later if you want persistent player identities.

### 4. Create the Firestore database
- Navigate to **Build → Firestore Database** and click **Create database**.
- Choose a region close to your players and select **Start in test mode** while prototyping. Test mode automatically expires after 30 days; before launch, replace it with production rules that validate document shapes and ensure only authenticated users can read/write.
- After the database is provisioned, you can optionally create a `games` collection, but it isn't required—the app will create documents the first time a lobby is made.

### 5. Enable Firebase Storage (for voice messages)
- Navigate to **Build → Storage** and click **Get started**.
- Choose **Start in test mode** for initial setup, then click **Next**.
- Select the same region as your Firestore database and click **Done**.
- After setup, go to the **Rules** tab and replace the default rules with the contents from `storage.rules` in this repository. This allows authenticated users to upload voice messages up to 5MB.

### 6. Configure environment variables
- Copy `.env.example` to `.env.local` and fill in the following keys using the values from your Firebase web app settings.

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` from Firebase config. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain`, usually `<project-id>.firebaseapp.com`. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket URL, usually `<project-id>.appspot.com`. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` value. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` from the config snippet. |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional—only needed if you enabled Analytics. |
| `OPENAI_API_KEY` | Optional—OpenAI API key for AI commentary. Game uses 30+ custom templates as fallback if not set. Uses gpt-4o-mini model for fast, cost-effective, dramatic narration. |

Restart `npm run dev` after adding env vars so Next.js can pick them up.

## Available Scripts

- `npm run dev` – start the Next.js development server.
- `npm run build` – create a production build.
- `npm run start` – run the production server locally.
- `npm run lint` – execute ESLint across the project.

## Deploying to Vercel

1. **Create a Git repository** – Commit this project and push it to GitHub, GitLab, or Bitbucket.
2. **Import into Vercel** – Sign in at [vercel.com](https://vercel.com/), click **Add New → Project**, and select your repository.
3. **Verify settings** – Vercel auto-detects Next.js. Keep the root directory as `.` and the default build command (`npm run build`).
4. **Add environment variables** – Under the **Environment Variables** section, add every key from your `.env.local` (including optional `OPENAI_API_KEY`). Set them for **Production** and **Preview** so PR builds also work.
5. **Authorize Firebase domain** – In the Firebase console, go to **Authentication → Settings → Authorized domains** and add your Vercel domain (e.g., `moonlit-mafia.vercel.app`). This allows anonymous auth to work in production.
6. **Deploy** – Click **Deploy**. The first build takes ~2 minutes. Once finished, Vercel provides a production URL you can share.
7. **Post-deploy checks** – Visit the site, create a lobby, and confirm Firestore writes succeed. When you harden security rules, re-deploy if needed.

## Mobile-First UI Features

The game interface has been redesigned with mobile-first principles:

### Mobile View (< 1024px)
- **Bottom Tab Navigation**: 4 tabs (Action, Players, Chat, Host/Activity) with badge indicators
- **Collapsible Sections**: Accordion-style controls to conserve vertical space
- **Floating Action Button (FAB)**: Primary actions (Ready Up, Start Game, Eliminate) with 56x56px touch target
- **Compact Player Cards**: 2-3 column grid layout with status indicators

### Desktop View (≥ 1024px)
- **3-Column Layout**: Players sidebar, Action Center, Chat panel
- **Expanded Controls**: All host controls visible without collapsing
- **Activity Timeline**: Integrated into sidebar

## AI Commentary System

The game features an intelligent commentary system with two modes:

### OpenAI Mode (if API key configured)
- Uses **gpt-4o-mini** model for fast, cost-effective responses
- Generates dramatic, context-aware narration for game events
- Automatically falls back to templates if API fails

### Template Mode (default)
- **30+ Custom Templates** across 5 scenarios:
  - Night eliminations (10 variations)
  - Doctor saves (10 variations)
  - Peaceful nights (10 variations)
  - Mafia eliminated during day (10 variations)
  - Innocent eliminated during day (10 variations)
- Intelligent template selection based on game outcome
- No external dependencies required

## Automated UI Smoke Test

Opening four browsers just to sanity-check a session is tedious, so the repo ships with a Playwright-powered Python script that spins up the minimum number of players, starts a game, and posts a chat message.

### Prerequisites
1. Start the Next.js app locally (`npm run dev`) or have a deployed URL handy.
2. Create a virtual environment (optional but recommended) and install the test dependencies:
	```bash
	python -m venv .venv
	source .venv/bin/activate
	pip install -r tests/automation/requirements.txt
	python -m playwright install
	```

### Running the smoke test
```bash
python tests/automation/moonlit_mafia_smoke.py --base-url http://localhost:3000
```

What it does:
- Creates a lobby as the host, captures the join code, and shares it with three additional browser contexts (the minimum required to start a match).
- Toggles each player to "Ready", starts the game as the host, and posts a chat message once the first night begins.
- Fails fast if any UI element is missing or unresponsive (e.g., Ready/Start buttons stay disabled), returning a non-zero exit code for CI.

Flags & tips:
- Pass `--headed` to watch the browsers drive the UI; omit it to run headless (default).
- Override the target URL with `--base-url https://your-vercel-domain.vercel.app` or set the `MAFIA_BASE_URL` env var.
- Adjust `--player-count` (4–6) if you want to mimic a larger lobby; names auto-generate beyond the included presets.

## Project Structure

```
app/                 # Next.js App Router pages (landing, dashboard, lobby, game room)
components/          # UI primitives, layout sections, game chat modules, mobile components
  ui/                # Reusable UI components (tabs-mobile, collapsible-section, FAB)
  game/              # Game-specific components (action-center, player-list-compact)
  chat/              # Chat panel and messaging
hooks/               # Custom hooks for Firestore listeners and game state hydration
lib/                 # Firebase clients, game logic helpers, AI commentary, schema definitions
  ai/                # AI commentary system with templates and OpenAI integration
  firebase/          # Firebase client initialization
  game/              # Game service layer and business logic
store/               # Zustand stores (UI/gameplay state)
types/               # Shared TypeScript types for game entities
```

## Contributing

Issues, feedback, and pull requests are welcome! If you plan to extend the game engine (custom win conditions, additional roles, streaming integrations), please open an issue so we can discuss architecture and avoid conflicting changes.

Enjoy telling stories under the moonlight 🌕
