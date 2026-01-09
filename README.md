## Moonlit Mafia

Moonlit Mafia is a lightweight social deduction platform for running remote Mafia game nights. Hosts can spin up shareable lobbies, configure roles on the fly, guide day and night phases, and keep players engaged with real‑time chat and quick voice memos—all deployable to Vercel’s free tier.

### Highlights
- **Instant lobbies** – generate a six-character join code and share it with friends, no accounts required.
- **Role presets & tuning** – adjust counts per role with guardrails to keep games balanced for 4–16 players.
- **Real-time sync** – Firestore listeners keep player readiness, phase transitions, votes, and chat aligned.
- **Integrated chat** – day/night channels with emoji shortcuts and system messages narrated by the host.
- **Voice memos** – optional 60-second clips saved to Firebase Storage for asynchronous plotting.
- **Host controls** – start/advance phases, archive sessions, or moderate voice clips with a click.

### Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui primitives
- Zustand + React Query for client state and caching
- Firebase Authentication, Firestore, and Storage
- Vercel-friendly configuration with dynamic routes and edge-ready components

## Getting Started

1. **Install dependencies**
	```bash
	npm install
	```

2. **Configure environment variables**
	- Copy `.env.example` to `.env.local`.
	- Fill in your Firebase project details (see the Firebase section below).

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

Moonlit Mafia relies on Firebase for authentication, Firestore (real-time state), and Storage (voice memos). These steps assume you have no prior Firebase experience.

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
- After the database is provisioned, you can optionally create a `games` collection, but it isn’t required—the app will create documents the first time a lobby is made.

### 5. Enable Cloud Storage
- Head to **Build → Storage → Get started**.
- Keep the default bucket name (e.g., `<project-id>.appspot.com`) and choose the same region as Firestore when possible.
- Update Storage rules to require authentication and limit writes to `games/{gameId}/voice/{memoId}` paths if you want stricter control.

### 6. Configure environment variables
- Copy `.env.example` to `.env.local` and fill in the following keys using the values from your Firebase web app settings.

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` from Firebase config. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain`, usually `<project-id>.firebaseapp.com`. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | The default storage bucket, e.g., `<project-id>.appspot.com`. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` value. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` from the config snippet. |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional—only needed if you enabled Analytics. |

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
4. **Add environment variables** – Under the **Environment Variables** section, add every key from your `.env.local`. Set them for **Production** and **Preview** so PR builds also work.
5. **Authorize Firebase domain** – In the Firebase console, go to **Authentication → Settings → Authorized domains** and add your Vercel domain (e.g., `moonlit-mafia.vercel.app`). This allows anonymous auth to work in production.
6. **Deploy** – Click **Deploy**. The first build takes ~2 minutes. Once finished, Vercel provides a production URL you can share.
7. **Post-deploy checks** – Visit the site, create a lobby, and confirm Firestore/Storage writes succeed. When you harden security rules, re-deploy if needed.

## Project Structure

```
app/                 # Next.js App Router pages (landing, dashboard, lobby, game room)
components/          # UI primitives, layout sections, game/chat/voice modules
hooks/               # Custom hooks for Firestore listeners and game state hydration
lib/                 # Firebase clients, game logic helpers, schema definitions
store/               # Zustand stores (UI/gameplay state)
types/               # Shared TypeScript types for game entities
```

## Contributing

Issues, feedback, and pull requests are welcome! If you plan to extend the game engine (custom win conditions, additional roles, streaming integrations), please open an issue so we can discuss architecture and avoid conflicting changes.

Enjoy telling stories under the moonlight 🌕
