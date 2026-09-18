import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const routes = new OpenAPIHono<{ Bindings: Env }>()

const helloRoute = createRoute({
  method: 'get',
  path: '/hello',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ message: z.string().openapi({ example: 'Hello back' }) }),
        },
      },
      description: 'Hello response',
    },
  },
})

routes.openapi(helloRoute, (c) => c.json({ message: 'Hello back' }))

export { routes }