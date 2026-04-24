import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronDown, Camera } from 'lucide-react'

export const Route = createFileRoute('/faq')({
  component: FAQ,
})

const faqs = [
  {
    question: 'How do I book a photographer on CaptureAfrica?',
    answer: 'Browse photographers, visit their profile, and click "Book Now". Select your service (per-photo or package), choose a date and time, add event details, and confirm. Then pay the photographer directly and upload your proof.',
  },
  {
    question: 'How does payment work?',
    answer: 'Payments are made directly to the photographer via their bank account. After booking, transfer the amount and upload your payment receipt as proof. The photographer will confirm receipt and your booking will be confirmed.',
  },
  {
    question: 'How do I become a photographer on CaptureAfrica?',
    answer: 'Sign up with "I am a photographer" selected. After registration, complete your profile with your portfolio, pricing, and availability. An admin will review and approve your profile within 24-48 hours.',
  },
  {
    question: 'What is the AI assistant?',
    answer: 'Every photographer gets an AI assistant trained on their pricing, services, and availability. Clients can chat with it 24/7 to get instant answers about booking. There\'s also a global AI assistant to help you find photographers.',
  },
  {
    question: 'What if I need to cancel a booking?',
    answer: 'Contact your photographer directly via the messaging system. Cancellation policies vary by photographer. Always communicate early to arrange a refund or rescheduling.',
  },
  {
    question: 'How long does photographer approval take?',
    answer: 'Photographer profiles are reviewed within 24-48 hours. We verify that profiles are complete and professional before approval. You\'ll be notified by email once approved.',
  },
]

function FAQ() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <Camera size={14} /> Help Center
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-stone-400 max-w-xl mx-auto">Everything you need to know about CaptureAfrica.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Accordion key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-stone-400 mb-4">Still have questions?</p>
          <Link to="/" className="text-amber-400 hover:text-amber-300 font-medium">
            Chat with our AI assistant →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Accordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden hover:border-amber-500/20 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="font-medium text-stone-100">{question}</span>
        <ChevronDown
          size={18}
          className={`text-amber-400 flex-shrink-0 ml-3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-stone-400 leading-relaxed border-t border-stone-800 pt-4">{answer}</div>
      )}
    </div>
  )
}
