import type { Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url)
  const key = url.searchParams.get('key')
  if (!key) return new Response('Missing key', { status: 400 })

  try {
    const store = getStore({ name: 'uploads' })
    const result = await store.getWithMetadata(key)
    if (!result) return new Response('Not found', { status: 404 })

    const { data, metadata } = result
    const contentType = (metadata?.contentType as string) || 'application/octet-stream'

    return new Response(data as any, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}

export const config = {
  path: '/api/uploads',
}
