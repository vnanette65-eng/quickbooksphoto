import type { Context } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { messages, photographerContext } = await req.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      photographerContext?: {
        name: string
        brandName: string
        bio: string
        services: string[]
        pricePerPhoto: number
        packages: Array<{ name: string; price: number; description: string }>
        location: string
      }
    }

    const systemPrompt = photographerContext
      ? `You are an AI assistant for ${photographerContext.brandName}, a professional photographer based in ${photographerContext.location}.

About the photographer:
- Name: ${photographerContext.name}
- Specialties: ${photographerContext.services.join(', ')}
- Bio: ${photographerContext.bio}
- Price per photo: ₦${photographerContext.pricePerPhoto} (minimum ${5} photos)
- Packages: ${photographerContext.packages.map(p => `${p.name} (₦${p.price}): ${p.description}`).join('; ')}

You help clients understand services, pricing, and booking. Be warm, professional, and helpful. Guide clients toward making a booking. Answer questions about availability, pricing, and what to expect during a photography session. Always represent the photographer professionally.`
      : `You are a helpful assistant for CaptureAfrica, Africa's premier photography marketplace. You help clients:
- Find the right photographer for their needs (weddings, portraits, events, commercial, fashion, travel, family)
- Understand pricing and packages
- Navigate the booking process
- Learn about different photography styles
- Get recommendations based on their budget and location

Be warm, enthusiastic about African photography talent, and guide users toward discovering and booking photographers. If asked about specific photographers, recommend they browse the photographers section. Always encourage users to create an account for the best experience.`

    const stream = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: systemPrompt,
      messages,
      stream: true,
    })

    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(new TextEncoder().encode(event.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return new Response(JSON.stringify({ error: 'Chat unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config = {
  path: '/api/chat',
}
