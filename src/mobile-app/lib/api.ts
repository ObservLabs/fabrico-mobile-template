import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where /api calls go. Metro serves the app and proxies /api/* to the worker (metro.config.js),
 * so the API always lives on the same server the app came from:
 *
 * - Web (dev server or the published site): same origin, so a relative path.
 * - A phone in development: the dev server this bundle was loaded from, whether that is your
 *   LAN address, an Expo tunnel (`pnpm dev:tunnel`) or the Fabrico sandbox. A tunnel URL changes
 *   every session, which is why this is not read from .env.
 * - A phone outside development (store builds, later): EXPO_PUBLIC_APP_URL, the deployed app.
 *
 * Every API call carries the user's session token, so only addresses that stay on the local network
 * (your Wi-Fi, this machine) may use plain http. Anything that can cross the internet — an Expo
 * tunnel, the Fabrico sandbox — is forced to https, whatever scheme the dev server advertises: the
 * tunnel serves both, but its manifest says http.
 */
function isPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname.endsWith('.local')) return true;
  const ip = hostname.split('.').map(Number);
  if (ip.length !== 4 || ip.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = ip;
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

function apiBase(): string {
  if (Platform.OS === 'web') return '';

  // experienceUrl is exp://host[:port] (or exps://), e.g. exp://192.168.1.10:8081 on Wi-Fi or
  // exp://abc-anonymous-8081.exp.direct through a tunnel.
  const match = /^exps?:\/\/([^/?#]+)/.exec(Constants.experienceUrl ?? '');
  if (__DEV__ && match) {
    const host = match[1];
    const [hostname, port] = host.split(':');
    if (isPrivateHost(hostname)) return `http://${host}`;
    // Public: https only. A standard port is dropped; an unusual one is kept, so a server without
    // TLS fails loudly instead of the token travelling in cleartext.
    return `https://${hostname}${port && port !== '80' && port !== '443' ? `:${port}` : ''}`;
  }

  return process.env.EXPO_PUBLIC_APP_URL ?? '';
}

/** Absolute URL for an API path: fetchApi(apiUrl('/api/bookings')). */
export const apiUrl = (path: string): string => `${apiBase()}${path}`;
