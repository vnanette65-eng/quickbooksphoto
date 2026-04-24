import type { Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import type { Booking } from '../../src/lib/types'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  const url = new URL(req.url)
  const store = getStore({ name: 'bookings', consistency: 'strong' })

  try {
    // GET /api/bookings?clientId=xxx or ?photographerId=xxx or ?id=xxx
    if (req.method === 'GET') {
      const bookingId = url.searchParams.get('id')
      if (bookingId) {
        const booking = await store.get(bookingId, { type: 'json' }) as Booking | null
        if (!booking) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders() })
        return new Response(JSON.stringify({ booking }), { headers: corsHeaders() })
      }

      const clientId = url.searchParams.get('clientId')
      const photographerId = url.searchParams.get('photographerId')

      const { blobs } = await store.list()
      const allBookings: Booking[] = []
      for (const blob of blobs) {
        const b = await store.get(blob.key, { type: 'json' }) as Booking | null
        if (b) allBookings.push(b)
      }

      let results = allBookings
      if (clientId) results = results.filter(b => b.clientId === clientId)
      if (photographerId) results = results.filter(b => b.photographerId === photographerId)
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return new Response(JSON.stringify({ bookings: results }), { headers: corsHeaders() })
    }

    // POST /api/bookings - create or update
    if (req.method === 'POST') {
      const body = await req.json() as Partial<Booking> & { action?: string }

      if (body.action === 'update-status') {
        const { id, status, photographerNote, paymentProof } = body as any
        const existing = await store.get(id, { type: 'json' }) as Booking | null
        if (!existing) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders() })

        const receiptId = status === 'confirmed' && !existing.receiptId
          ? `RCP-${Date.now()}`
          : existing.receiptId

        const updated: Booking = {
          ...existing,
          status,
          photographerNote: photographerNote || existing.photographerNote,
          paymentProof: paymentProof || existing.paymentProof,
          receiptId,
          updatedAt: new Date().toISOString(),
        }
        await store.setJSON(id, updated)
        return new Response(JSON.stringify({ booking: updated }), { headers: corsHeaders() })
      }

      // Create new booking
      const id = generateId()
      const booking: Booking = {
        id,
        clientId: body.clientId || '',
        clientEmail: body.clientEmail || '',
        clientName: body.clientName || '',
        photographerId: body.photographerId || '',
        photographerName: body.photographerName || '',
        photographerEmail: body.photographerEmail || '',
        serviceType: body.serviceType || 'per-photo',
        packageId: body.packageId,
        packageName: body.packageName,
        photoCount: body.photoCount,
        eventDate: body.eventDate || '',
        eventTime: body.eventTime || '',
        eventLocation: body.eventLocation || '',
        notes: body.notes || '',
        totalAmount: body.totalAmount || 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await store.setJSON(id, booking)
      return new Response(JSON.stringify({ booking }), { status: 201, headers: corsHeaders() })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders() })
  } catch (error) {
    console.error('Bookings API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders() })
  }
}

export const config = {
  path: '/api/bookings',
}
