import type { Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import type { Photographer } from '../../src/lib/types'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  const url = new URL(req.url)
  const store = getStore({ name: 'photographers', consistency: 'strong' })

  try {
    // GET /api/photographers - list all approved photographers
    if (req.method === 'GET' && !url.searchParams.get('id')) {
      const { blobs } = await store.list()
      const photographerList: Photographer[] = []

      for (const blob of blobs) {
        const data = await store.get(blob.key, { type: 'json' }) as Photographer | null
        if (data) {
          photographerList.push(data)
        }
      }

      const includeAll = url.searchParams.get('all') === 'true'
      const filtered = includeAll
        ? photographerList
        : photographerList.filter(p => p.status === 'approved')

      // Apply filters
      const service = url.searchParams.get('service')
      const location = url.searchParams.get('location')
      const minPrice = url.searchParams.get('minPrice')
      const maxPrice = url.searchParams.get('maxPrice')
      const minRating = url.searchParams.get('minRating')

      let results = filtered
      if (service) results = results.filter(p => p.services.includes(service as any))
      if (location) results = results.filter(p => p.location.toLowerCase().includes(location.toLowerCase()))
      if (minPrice) results = results.filter(p => p.pricePerPhoto >= Number(minPrice))
      if (maxPrice) results = results.filter(p => p.pricePerPhoto <= Number(maxPrice))
      if (minRating) results = results.filter(p => p.rating >= Number(minRating))

      // Sort by rating desc
      results.sort((a, b) => b.rating - a.rating)

      return new Response(JSON.stringify({ photographers: results }), { headers: corsHeaders() })
    }

    // GET /api/photographers?id=xxx - single photographer
    if (req.method === 'GET' && url.searchParams.get('id')) {
      const id = url.searchParams.get('id')!
      const data = await store.get(id, { type: 'json' }) as Photographer | null
      if (!data) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders() })
      return new Response(JSON.stringify({ photographer: data }), { headers: corsHeaders() })
    }

    // POST /api/photographers - create or update
    if (req.method === 'POST') {
      const body = await req.json() as Partial<Photographer> & { action?: string }

      if (body.action === 'update-status') {
        // Admin action: approve/reject
        const { id, status, note } = body as any
        const existing = await store.get(id, { type: 'json' }) as Photographer | null
        if (!existing) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders() })
        const updated = { ...existing, status, adminNote: note, updatedAt: new Date().toISOString() }
        await store.setJSON(id, updated)
        return new Response(JSON.stringify({ photographer: updated }), { headers: corsHeaders() })
      }

      // Create or update photographer profile
      const id = body.userId || body.id
      if (!id) return new Response(JSON.stringify({ error: 'User ID required' }), { status: 400, headers: corsHeaders() })

      const existing = await store.get(id, { type: 'json' }) as Photographer | null
      const photographer: Photographer = {
        id,
        userId: id,
        email: body.email || existing?.email || '',
        name: body.name || existing?.name || '',
        brandName: body.brandName || existing?.brandName || '',
        bio: body.bio || existing?.bio || '',
        location: body.location || existing?.location || '',
        latitude: body.latitude || existing?.latitude,
        longitude: body.longitude || existing?.longitude,
        services: body.services || existing?.services || [],
        pricePerPhoto: body.pricePerPhoto ?? existing?.pricePerPhoto ?? 0,
        minPhotos: body.minPhotos ?? existing?.minPhotos ?? 5,
        packages: body.packages || existing?.packages || [],
        portfolio: body.portfolio || existing?.portfolio || [],
        availableDates: body.availableDates || existing?.availableDates || [],
        blockedDates: body.blockedDates || existing?.blockedDates || [],
        bankDetails: body.bankDetails || existing?.bankDetails || { bankName: '', accountNumber: '', accountName: '' },
        status: existing ? existing.status : 'pending',
        rating: existing?.rating ?? 0,
        reviewCount: existing?.reviewCount ?? 0,
        badges: existing?.badges || [],
        profileImage: body.profileImage || existing?.profileImage || '',
        coverImage: body.coverImage || existing?.coverImage || '',
        promoCode: body.promoCode || existing?.promoCode,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await store.setJSON(id, photographer)
      return new Response(JSON.stringify({ photographer }), { headers: corsHeaders() })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders() })
  } catch (error) {
    console.error('Photographers API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders() })
  }
}

export const config = {
  path: '/api/photographers',
}
