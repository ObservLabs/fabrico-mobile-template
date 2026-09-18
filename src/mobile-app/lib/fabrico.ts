import { createClient } from "@fabrico/sdk";

export const fabrico = createClient({
  publishableKey: process.env.EXPO_PUBLIC_FABRICO_PUBLISHABLE_KEY,
  appUrl: process.env.EXPO_PUBLIC_APP_URL
});
