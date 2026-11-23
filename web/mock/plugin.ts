import type { Plugin } from 'vite'
import { changes, earnings, schedule } from './doctor.ts'

// Заглушка нашего сервера для `npm run dev`: отвечает на /api/... выдуманными данными.
// Настоящий сервер клиники команде не доступен и не нужен. Новые адреса добавляются в ROUTES.
const ROUTES: Record<string, (query: URLSearchParams) => unknown> = {
  '/doctor/schedule': schedule,
  '/doctor/earnings': earnings,
  '/doctor/changes': changes,
}

export function mockServer(): Plugin {
  return {
    name: 'mock-server',
    configureServer(server) {
      server.middlewares.use('/api', (req, res) => {
        const url = new URL(req.url ?? '/', 'http://mock')
        const handler = ROUTES[url.pathname]
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        if (!handler) {
          res.statusCode = 404
          res.end(
            JSON.stringify({ detail: `Заглушка не знает ${url.pathname}` })
          )
          return
        }
        res.end(JSON.stringify(handler(url.searchParams)))
      })
    },
  }
}
