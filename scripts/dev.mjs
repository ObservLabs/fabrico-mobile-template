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
import net from "node:net";
import { delimiter, join } from "node:path";

const WORKER_PORT = process.env.WORKER_PORT ?? "8787";
const METRO_PORT = process.env.METRO_PORT ?? "8081";
const TUNNEL = process.argv.includes("--tunnel") || process.env.EXPO_TUNNEL === "1";
const POSIX = process.platform !== "win32";

const portFree = (port, host) =>
  new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(Number(port), host);
  });

// A port that is already taken means a previous `pnpm dev` is still alive. Say so plainly instead of
// letting workerd die with "bind(): Address already in use". Never kill a process this script did
// not start.
if (!(await portFree(METRO_PORT, "0.0.0.0"))) {
  console.error(
    `\n[dev] Port ${METRO_PORT} is already in use: another \`pnpm dev\` (or Metro) is still running.` +
      `\n      Stop it, or use it as it is. Nothing was started.\n`,
  );
  process.exit(1);
}
// The worker port is only ours (127.0.0.1), so a taken one is almost always this project's worker left
// by a run that did not exit cleanly. Reuse it rather than fail: Metro still proxies /api to it.
const reuseWorker = !(await portFree(WORKER_PORT, "127.0.0.1"));
if (reuseWorker) {
  console.error(
    `\n[dev] Port ${WORKER_PORT} is already in use, most likely by the API worker of a previous \`pnpm dev\`.` +
      `\n      /api goes to it. If the API looks stale, stop that process and run \`pnpm dev\` again.\n`,
  );
}

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
// Each server runs in its OWN process group (detached), so stopping kills the whole group. With
// shell: true the direct child is only `sh`; killing it alone used to leave wrangler/workerd and
// Metro running on their ports, and the next `pnpm dev` failed with "Address already in use".
const run = (cmd, args) => spawn(cmd, args, { stdio: "inherit", shell: true, env, detached: POSIX });

const children = [];
if (!reuseWorker) children.push(run("wrangler", ["dev", "--port", WORKER_PORT, "--ip", "127.0.0.1"]));
const metro = run("expo", ["start", "--port", METRO_PORT, ...(TUNNEL ? ["--tunnel"] : [])]);
children.push(metro);

const killTree = (child) => {
  if (child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (POSIX) process.kill(-child.pid, "SIGTERM"); // the whole group: sh, wrangler/expo, workerd/Metro
    else child.kill("SIGTERM");
  } catch {
    // already gone
  }
};

let stopping = false;
const stop = (code) => {
  if (stopping) return;
  stopping = true;
  children.forEach(killTree);
  process.exit(code ?? 0);
};

// The worker dying must not take the app down: the UI keeps working and /api calls get a clear
// 502 from the proxy, which is easier to diagnose than a dead preview.
const worker = reuseWorker ? null : children[0];
worker?.on("exit", (code) => {
  if (!stopping) console.error(`\n[dev] API worker exited (code ${code}); /api calls will fail until it is restarted.\n`);
});
metro.on("exit", (code) => stop(code));
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
process.on("SIGHUP", () => stop(0));
// Last resort if this script dies on an unexpected error: still take the servers down with it.
process.on("exit", () => children.forEach(killTree));
