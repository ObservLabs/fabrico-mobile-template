import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { routes } from './routes'
import { crons } from './crons'

const app = new OpenAPIHono<{ Bindings: Env }>()

app.use('/api/*', cors())

app.route('/api', routes)

app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }))

app.doc('/api/openapi.json', {
  openapi: '3.0.0',
  info: { version: '1.0.0', title: 'Fabrico API' },
})

export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
    await crons(event, env, ctx)
  },
}