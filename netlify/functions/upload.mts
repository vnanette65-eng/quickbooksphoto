import type { Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders() })
  }

  try {
    const body = await req.json() as { data: string; type: string; filename: string; category: string }
    const { data, type, filename, category } = body

    if (!data || !type) {
      return new Response(JSON.stringify({ error: 'Missing data or type' }), { status: 400, headers: corsHeaders() })
    }

    // Convert base64 to buffer
    const base64Data = data.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    if (buffer.length > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large (max 10MB)' }), { status: 400, headers: corsHeaders() })
    }

    const store = getStore({ name: 'uploads' })
    const id = generateId()
    const ext = filename?.split('.').pop() || 'jpg'
    const key = `${category}/${id}.${ext}`

    await store.set(key, buffer, {
      metadata: { contentType: type, filename: filename || `upload.${ext}`, uploadedAt: new Date().toISOString() },
    })

    const url = `/api/uploads?key=${encodeURIComponent(key)}`
    return new Response(JSON.stringify({ url, key }), { headers: corsHeaders() })
  } catch (error) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500, headers: corsHeaders() })
  }
}

export const config = {
  path: '/api/upload',
}
