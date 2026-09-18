import { createClient } from "@fabrico/sdk";

export const getFabrico = (env: Env) => createClient({
  publishableKey: env.FABRICO_PROJECT_ID,
  apiKey: env.FABRICO_API_TOKEN,
  appUrl: env.APP_URL
});
