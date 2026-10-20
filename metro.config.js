const http = require("node:http");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// One port for everything in development: Metro serves the app (native bundles and the web build)
// and forwards /api/* to the Hono worker that `wrangler dev` runs on WORKER_PORT (scripts/dev.mjs).
// The phone, the browser preview and the app's own fetch calls then all use the same URL.
//
// enhanceMiddleware is deprecated in Metro, but Expo CLI 57 still composes it
// (@expo/cli .../metro/instantiateMetro.js) and mounts it BEFORE its web history fallback, which
// answers every request without an expo-platform header with index.html. If an Expo upgrade
// changes that order, /api calls start returning HTML: check here first.
const WORKER_PORT = Number(process.env.WORKER_PORT ?? 8787);
const enhanceDefault = config.server.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, server) => {
    const downstream = enhanceDefault ? enhanceDefault(metroMiddleware, server) : metroMiddleware;
    return (req, res, next) => {
      if (!req.url || !req.url.startsWith("/api/")) return downstream(req, res, next);

      const upstream = http.request(
        {
          host: "127.0.0.1",
          port: WORKER_PORT,
          method: req.method,
          path: req.url,
          headers: { ...req.headers, host: `127.0.0.1:${WORKER_PORT}` },
        },
        (response) => {
          res.writeHead(response.statusCode ?? 502, response.headers);
          response.pipe(res);
        },
      );
      upstream.on("error", (err) => {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `The API worker is not reachable on port ${WORKER_PORT}: ${err.message}` }));
      });
      req.pipe(upstream);
    };
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });
