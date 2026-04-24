import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Camera, Minimize2 } from 'lucide-react'
import type { ChatMessage } from '../lib/types'

interface AIChatProps {
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

const QUICK_REPLIES_GLOBAL = [
  'How do I book a photographer?',
  'What are the pricing options?',
  'Find wedding photographers',
  'How does payment work?',
]

const QUICK_REPLIES_PHOTOGRAPHER = [
  'What are your packages?',
  'Are you available this weekend?',
  'What is your pricing?',
  'How do I book you?',
]

export function AIChat({ photographerContext }: AIChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting: ChatMessage = {
        role: 'assistant',
        content: photographerContext
          ? `Hi! I'm the AI assistant for ${photographerContext.brandName}. How can I help you today? You can ask me about pricing, availability, packages, or anything else!`
          : "Hi! I'm the CaptureAfrica AI assistant 📸 I can help you find the perfect photographer, understand pricing, and guide you through the booking process. What are you looking for?",
      }
      setMessages([greeting])
    }
  }, [open, photographerContext])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          photographerContext,
        }),
      })

      if (!response.ok) throw new Error('Chat failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
      setMessages(prev => [...prev, assistantMsg])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantText }
          return updated
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const quickReplies = photographerContext ? QUICK_REPLIES_PHOTOGRAPHER : QUICK_REPLIES_GLOBAL

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 pulse-amber transition-colors"
          aria-label="Open AI Chat"
        >
          <MessageCircle size={24} className="text-stone-950" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 flex flex-col rounded-2xl shadow-2xl shadow-black/50 overflow-hidden border border-stone-700" style={{ height: '520px', background: '#1a1410' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-stone-900 border-b border-stone-700">
            <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Camera size={18} className="text-stone-950" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white truncate">
                {photographerContext ? `${photographerContext.brandName} AI` : 'CaptureAfrica Assistant'}
              </p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Online
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-white p-1">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-stone-950 rounded-tr-sm'
                      : 'bg-stone-800 text-stone-100 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-stone-800 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-stone-400 typing-dot" />
                  <div className="w-2 h-2 rounded-full bg-stone-400 typing-dot" />
                  <div className="w-2 h-2 rounded-full bg-stone-400 typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {quickReplies.map(reply => (
                <button
                  key={reply}
                  onClick={() => sendMessage(reply)}
                  className="text-xs px-3 py-1.5 rounded-full border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask anything..."
              className="flex-1 bg-stone-800 border border-stone-600 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="w-9 h-9 flex-shrink-0 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-xl flex items-center justify-center transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin text-stone-950" /> : <Send size={16} className="text-stone-950" />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
