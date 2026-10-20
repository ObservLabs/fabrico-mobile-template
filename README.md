# Fabrico Mobile Template

A React Native (Expo) mobile template mirroring the architecture of the Fabrico fullstack web template. Powered by the [Fabrico SDK](https://fabrico.diy) for authentication, database access, and real-time syncing.

## 🚀 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Styling**: [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **Navigation**: [React Navigation](https://reactnavigation.org/)
- **Backend**: [Hono](https://hono.dev/) on Cloudflare Workers
- **SDK**: [@fabrico/sdk](https://www.npmjs.com/package/@fabrico/sdk)

## 📂 Project Structure

```text
.
├── src/
│   ├── mobile-app/           # React Native application code
│   │   ├── components/       # Reusable UI elements (e.g., Auth)
│   │   ├── lib/              # SDK initialization (fabrico.ts)
│   │   └── pages/            # App screens (e.g., Home.tsx)
│   └── worker/               # Hono backend for API proxying and edge logic
├── App.tsx                   # Main entry point and Navigation hub
├── tailwind.config.js        # NativeWind/Tailwind configuration
├── global.css                # Global styles for NativeWind
├── nativewind-env.d.ts       # TypeScript declarations for className support
├── wrangler.json             # Cloudflare worker configuration
└── package.json
```

## 🛠️ Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root of your project to configure the Expo app and Worker:

```env
# Frontend (Expo)
EXPO_PUBLIC_FABRICO_PUBLISHABLE_KEY=your_publishable_key
EXPO_PUBLIC_APP_URL=your_app_url

# Backend (Worker)
FABRICO_PROJECT_ID=your_project_id
FABRICO_API_TOKEN=your_api_token
ENVIRONMENT=development
```

### 2. Install Dependencies

Since we are using specific React Native dependencies that may conflict with the web-focused Fabrico SDK peer dependencies, we recommend installing with `npm` using legacy peer dependencies:

```bash
npm install --legacy-peer-deps
```

*Note: If using `pnpm`, you may need to configure `.npmrc` to loosely resolve peers.*

### 3. Run the App

One command starts both the app and its API, behind a single port (8081):

```bash
pnpm dev
# Scan the QR code with Expo Go, or open http://localhost:8081 for the web version.
```

Metro serves the app and forwards every `/api/*` request to the Hono worker, which `wrangler dev`
runs on port 8787 (see `metro.config.js` and `scripts/dev.mjs`). So `EXPO_PUBLIC_APP_URL` is the
same URL for the app and its API:

- web: `http://localhost:8081`
- a phone in Expo Go: `http://<your computer's LAN IP>:8081` (a phone cannot reach `localhost`)

Other scripts:

| Script | What it does |
|---|---|
| `pnpm start` | Metro only (no API) |
| `pnpm build` | `expo export --platform web` → `dist/`, which the worker serves when deployed |
| `pnpm check` | type check, web build, then `wrangler deploy --dry-run` |

## 🎨 Styling with NativeWind

This template uses NativeWind v4, which allows you to style React Native components using standard Tailwind CSS classes via the `className` prop.

Example:
```tsx
<View className="flex-1 items-center justify-center bg-white">
  <Text className="text-xl font-bold text-blue-500">Hello Fabrico!</Text>
</View>
```

## 🔐 Authentication

The Fabrico SDK is already initialized in `src/mobile-app/lib/fabrico.ts`. We have also included basic structural views for Auth (`SignIn.tsx`) inside `src/mobile-app/components/auth` for you to customize.
