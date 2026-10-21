// `pnpm dev`: the Hono worker (wrangler dev) and Metro (expo start), behind ONE port.
// Metro proxies /api/* to the worker (metro.config.js), so the app, the browser preview and a phone
// in Expo Go all use http(s)://<host>:8081 for both the app and its API.
//
// `pnpm dev:tunnel` (or EXPO_TUNNEL=1): Metro is also published through an Expo tunnel (ngrok), so a
// phone on ANY network can open the app — not only one on your Wi-Fi. The /api proxy travels with it,
// and the app finds its API through the tunnel by itself (src/mobile-app/lib/api.ts).
// @expo/ngrok is a devDependency, so Expo never stops to ask to install it.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { delimiter, join } from "node:path";

const WORKER_PORT = process.env.WORKER_PORT ?? "8787";
const METRO_PORT = process.env.METRO_PORT ?? "8081";
const TUNNEL = process.argv.includes("--tunnel") || process.env.EXPO_TUNNEL === "1";

// wrangler.json serves ./dist as static assets; wrangler dev refuses to start if it is missing.
// In development the app itself comes from Metro, so an empty folder is enough.
mkdirSync("dist", { recursive: true });

// The project's own wrangler/expo, also when this script is run with plain `node` rather than
// `pnpm dev` (which is what puts node_modules/.bin on PATH).
const env = {
  ...process.env,
  WORKER_PORT,
  PATH: [join(process.cwd(), "node_modules", ".bin"), process.env.PATH].filter(Boolean).join(delimiter),
};
const run = (cmd, args) => spawn(cmd, args, { stdio: "inherit", shell: true, env });

const worker = run("wrangler", ["dev", "--port", WORKER_PORT, "--ip", "127.0.0.1"]);
const metro = run("expo", ["start", "--port", METRO_PORT, ...(TUNNEL ? ["--tunnel"] : [])]);

let stopping = false;
const stop = (code) => {
  if (stopping) return;
  stopping = true;
  for (const child of [worker, metro]) if (child.exitCode === null) child.kill("SIGTERM");
  process.exit(code ?? 0);
};

// The worker dying must not take the app down: the UI keeps working and /api calls get a clear
// 502 from the proxy, which is easier to diagnose than a dead preview.
worker.on("exit", (code) => {
  if (!stopping) console.error(`\n[dev] API worker exited (code ${code}); /api calls will fail until it is restarted.\n`);
});
metro.on("exit", (code) => stop(code));
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
