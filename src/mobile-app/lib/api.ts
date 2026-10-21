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
 */
function apiBase(): string {
  if (Platform.OS === 'web') return '';

  // experienceUrl is exp://host[:port] (or exps://), e.g. exp://192.168.1.10:8081 on Wi-Fi or
  // exp://abc-anonymous-8081.exp.direct through a tunnel.
  const match = /^(exps?):\/\/([^/?#]+)/.exec(Constants.experienceUrl ?? '');
  if (__DEV__ && match) {
    const [, scheme, host] = match;
    const secure = scheme === 'exps' || host.endsWith(':443');
    return `${secure ? 'https' : 'http'}://${host.replace(/:443$/, '')}`;
  }

  return process.env.EXPO_PUBLIC_APP_URL ?? '';
}

/** Absolute URL for an API path: fetchApi(apiUrl('/api/bookings')). */
export const apiUrl = (path: string): string => `${apiBase()}${path}`;
