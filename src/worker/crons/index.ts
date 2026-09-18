const cronMap: Record<string, (env: Env, ctx: ExecutionContext) => Promise<void>> = {}

export async function crons(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  const handler = cronMap[event.cron]

  if (!handler) {
    console.warn(`No handler registered for cron: ${event.cron}`)
    return
  }

  ctx.waitUntil(handler(env, ctx))
}