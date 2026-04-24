import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Camera, MapPin, Star, ArrowRight, Users, Shield, Zap, CheckCircle, ChevronRight } from 'lucide-react'
import { PhotographerCard } from '../components/PhotographerCard'
import type { Photographer } from '../lib/types'

export const Route = createFileRoute('/')({
  component: Home,
})

const SAMPLE_CATEGORIES = [
  { label: 'Wedding', emoji: '💍', query: 'wedding' },
  { label: 'Portrait', emoji: '🎭', query: 'portrait' },
  { label: 'Events', emoji: '🎉', query: 'event' },
  { label: 'Fashion', emoji: '👗', query: 'fashion' },
  { label: 'Commercial', emoji: '💼', query: 'commercial' },
  { label: 'Travel', emoji: '✈️', query: 'travel' },
  { label: 'Family', emoji: '👨‍👩‍👧', query: 'family' },
  { label: 'Newborn', emoji: '👶', query: 'newborn' },
]

const STATS = [
  { value: '500+', label: 'Photographers' },
  { value: '50+', label: 'Cities' },
  { value: '10K+', label: 'Bookings' },
  { value: '4.9★', label: 'Rating' },
]

function Home() {
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/photographers')
      .then(r => r.json())
      .then(data => setPhotographers(data.photographers?.slice(0, 6) || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background - gradient mesh */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(217,119,6,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(180,83,9,0.1) 0%, transparent 60%), #0c0a08'
        }} />

        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full border border-amber-500/10" />
        <div className="absolute top-32 right-20 w-48 h-48 rounded-full border border-amber-500/10" />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full border border-amber-500/5" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-8">
            <Camera size={14} />
            Africa's #1 Photography Marketplace
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Discover Talented{' '}
            <span className="gradient-text">African</span>
            <br />Photographers
          </h1>

          <p className="text-lg md:text-xl text-stone-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with verified professional photographers near you.
            Browse portfolios, chat with AI assistants, and book instantly.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-12">
            <div className="flex-1 relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder="Search by location..."
                className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-stone-900 border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <Link
              to="/photographers"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition-colors"
            >
              Find Photographers <ArrowRight size={18} />
            </Link>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {SAMPLE_CATEGORIES.map(cat => (
              <Link
                key={cat.query}
                to="/photographers"
                search={{ service: cat.query }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-900 border border-stone-800 hover:border-amber-500/40 hover:text-amber-400 text-stone-300 text-sm transition-all"
              >
                <span>{cat.emoji}</span> {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-stone-600 text-xs">
          <span>Scroll to explore</span>
          <ChevronRight size={16} className="rotate-90" />
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-stone-800 bg-stone-950">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-black gradient-text mb-1">{stat.value}</p>
                <p className="text-sm text-stone-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Photographers */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Photographers</h2>
              <p className="text-stone-400">Hand-picked talent from across Africa</p>
            </div>
            <Link to="/photographers" className="hidden md:flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium text-sm">
              View all <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-stone-900 rounded-2xl h-72 animate-pulse" />
              ))}
            </div>
          ) : photographers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photographers.map(p => (
                <PhotographerCard key={p.id} photographer={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-stone-700 rounded-2xl">
              <Camera size={48} className="text-stone-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Be the first photographer!</h3>
              <p className="text-stone-400 mb-6">Join CaptureAfrica and start showcasing your work to clients across Africa.</p>
              <Link to="/auth/register?role=photographer" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition-colors">
                Join as Photographer <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {photographers.length > 0 && (
            <div className="text-center mt-8">
              <Link to="/photographers" className="inline-flex items-center gap-2 px-6 py-3 border border-stone-700 hover:border-amber-500/40 rounded-xl text-stone-300 hover:text-amber-400 font-medium transition-all">
                Browse All Photographers <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-stone-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How CaptureAfrica Works</h2>
            <p className="text-stone-400 max-w-xl mx-auto">From discovery to your perfect shoot — simple, fast, and secure.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: <Camera size={28} />, title: 'Discover', desc: 'Browse photographers by location, specialty, price, and rating. View portfolios and video reels.' },
              { step: '02', icon: <Star size={28} />, title: 'Chat & Book', desc: 'Chat with the photographer\'s AI assistant for instant answers. Select your service and book a date.' },
              { step: '03', icon: <CheckCircle size={28} />, title: 'Capture & Pay', desc: 'Attend your session, pay the photographer directly, and upload proof. Download your receipt.' },
            ].map(item => (
              <div key={item.step} className="relative">
                <div className="text-5xl font-black text-stone-800 mb-4">{item.step}</div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-stone-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Photographers CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-amber-900/40 to-stone-900 border border-amber-500/20 p-10 md:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-6">
              <Camera size={32} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Are You a Photographer?
            </h2>
            <p className="text-stone-400 mb-8 max-w-xl mx-auto text-lg">
              Join thousands of photographers growing their business on CaptureAfrica. Get your own AI assistant, manage bookings, and reach clients across Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth/register?role=photographer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition-colors text-lg"
              >
                Join as Photographer <ArrowRight size={20} />
              </Link>
              <Link
                to="/photographers"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-stone-600 hover:border-amber-500/40 text-stone-300 rounded-xl transition-colors"
              >
                See Photographers
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-stone-800">
              {[
                { icon: <Zap size={20} />, label: 'AI-Powered Assistant', desc: 'Auto-reply to clients 24/7' },
                { icon: <Shield size={20} />, label: 'Secure Platform', desc: 'Admin-verified profiles' },
                { icon: <Users size={20} />, label: 'Growing Client Base', desc: 'Thousands of active clients' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className="text-amber-400 flex justify-center mb-2">{item.icon}</div>
                  <p className="text-sm font-semibold text-stone-200">{item.label}</p>
                  <p className="text-xs text-stone-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-lg mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Camera size={14} className="text-stone-950" />
                </div>
                <span className="gradient-text">CaptureAfrica</span>
              </div>
              <p className="text-stone-500 text-sm">Africa's premier photography marketplace, connecting clients with talented photographers.</p>
            </div>
            <div>
              <h4 className="font-semibold text-stone-300 mb-3">For Clients</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><Link to="/photographers" className="hover:text-amber-400 transition-colors">Browse Photographers</Link></li>
                <li><Link to="/auth/register" className="hover:text-amber-400 transition-colors">Create Account</Link></li>
                <li><Link to="/auth/login" className="hover:text-amber-400 transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-stone-300 mb-3">For Photographers</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><Link to="/auth/register?role=photographer" className="hover:text-amber-400 transition-colors">Join CaptureAfrica</Link></li>
                <li><Link to="/dashboard/photographer" className="hover:text-amber-400 transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-stone-300 mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><span className="text-stone-600">About</span></li>
                <li><span className="text-stone-600">Terms</span></li>
                <li><span className="text-stone-600">Privacy</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-6 text-center text-stone-600 text-sm">
            &copy; 2026 CaptureAfrica. All rights reserved. Built with ❤️ for Africa.
          </div>
        </div>
      </footer>
    </div>
  )
}
