import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { Camera, Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react'
import { signup, AuthError, MissingIdentityError } from '@netlify/identity'
import { z } from 'zod'

export const Route = createFileRoute('/auth/register')({
  validateSearch: z.object({ role: z.enum(['client', 'photographer']).optional() }),
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { role: defaultRole } = useSearch({ from: '/auth/register' })
  const [role, setRole] = useState<'client' | 'photographer'>(defaultRole || 'client')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    try {
      const user = await signup(email, password, {
        full_name: name,
        role,
      })

      if (user.emailVerified) {
        if (role === 'photographer') navigate({ to: '/dashboard/photographer' })
        else navigate({ to: '/dashboard/client' })
      } else {
        setSuccess(true)
      }
    } catch (err) {
      if (err instanceof MissingIdentityError) {
        setError('Authentication service unavailable. Please use netlify dev or deploy the site.')
      } else if (err instanceof AuthError) {
        if (err.status === 403) setError('Signups are currently disabled. Contact the admin.')
        else if (err.status === 422) setError('Invalid email or weak password. Use at least 8 characters.')
        else setError(err.message)
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-400 mx-auto mb-6">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Check Your Email!</h2>
          <p className="text-stone-400 mb-6">
            We sent a confirmation link to <strong className="text-white">{email}</strong>.
            Click it to activate your account.
          </p>
          {role === 'photographer' && (
            <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              📸 After confirming your email, your profile will be reviewed by an admin before becoming visible to clients.
            </p>
          )}
          <Link to="/" className="inline-flex items-center gap-2 mt-6 text-amber-400 hover:text-amber-300">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'radial-gradient(ellipse at center, rgba(217,119,6,0.08) 0%, transparent 70%), #0c0a08' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Camera size={20} className="text-stone-950" />
            </div>
            <span className="gradient-text">CaptureAfrica</span>
          </Link>
          <h1 className="text-2xl font-bold mt-6">Create your account</h1>
          <p className="text-stone-400 mt-1">Join Africa's photography community</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'client', label: 'I need a photographer', icon: '📸' },
              { value: 'photographer', label: 'I am a photographer', icon: '🎯' },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value as 'client' | 'photographer')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  role === option.value
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-stone-700 text-stone-400 hover:border-stone-600'
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                <div className="text-xs font-medium">{option.label}</div>
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                {role === 'photographer' ? 'Your Name / Brand Name' : 'Full Name'}
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={role === 'photographer' ? 'Studio Name' : 'Your full name'}
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  className="w-full pl-9 pr-10 py-3 rounded-xl bg-stone-800 border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {role === 'photographer' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                📋 After registration, your profile will be reviewed by our admin team before becoming visible to clients. This usually takes 24-48 hours.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold rounded-xl transition-colors mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-stone-400 mt-6">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-amber-400 hover:text-amber-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
