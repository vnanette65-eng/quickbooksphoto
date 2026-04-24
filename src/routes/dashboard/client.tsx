import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Calendar, Heart, Bell, FileText, Camera, Package, Upload, Loader2, CreditCard, CheckCircle } from 'lucide-react'
import { getUser } from '@netlify/identity'
import type { Booking } from '../../lib/types'

export const Route = createFileRoute('/dashboard/client')({
  component: ClientDashboard,
})

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending Review', color: 'status-pending' },
  'payment-submitted': { label: 'Payment Submitted', color: 'status-payment-submitted' },
  confirmed: { label: 'Confirmed ✓', color: 'status-confirmed' },
  completed: { label: 'Completed', color: 'status-completed' },
  cancelled: { label: 'Cancelled', color: 'status-cancelled' },
  rejected: { label: 'Rejected', color: 'status-rejected' },
}

function ClientDashboard() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'bookings' | 'favorites'>('bookings')
  const [uploading, setUploading] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<any[]>([])

  useEffect(() => {
    getUser().then(async user => {
      if (!user) { navigate({ to: '/auth/login' }); return }
      const role = (user?.app_metadata as any)?.roles?.[0]
      if (role === 'photographer') { navigate({ to: '/dashboard/photographer' }); return }
      if (role === 'admin') { navigate({ to: '/dashboard/admin' }); return }

      setCurrentUser(user)

      const [bookingsRes] = await Promise.all([
        fetch(`/api/bookings?clientId=${user.id}`).then(r => r.json()),
      ])
      setBookings(bookingsRes.bookings || [])

      // Load favorites from localStorage
      const favIds = JSON.parse(localStorage.getItem('ca_favorites') || '[]')
      if (favIds.length > 0) {
        const photoRes = await fetch('/api/photographers').then(r => r.json())
        const allPhotographers = photoRes.photographers || []
        setFavorites(allPhotographers.filter((p: any) => favIds.includes(p.id)))
      }
    }).finally(() => setLoading(false))
  }, [navigate])

  async function uploadPaymentProof(bookingId: string, file: File) {
    setUploading(bookingId)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: base64, type: file.type, filename: file.name, category: 'payment-proofs' }),
      })
      const { url } = await uploadRes.json()

      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-status', id: bookingId, status: 'payment-submitted', paymentProof: url }),
      })

      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'payment-submitted' as const, paymentProof: url } : b))
    } catch {
      alert('Upload failed. Try again.')
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
  }

  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: <Calendar size={20} /> },
    { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length, icon: <CheckCircle size={20} /> },
    { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, icon: <Package size={20} /> },
    { label: 'Favorites', value: favorites.length, icon: <Heart size={20} /> },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">My Dashboard</h1>
        <p className="text-stone-400">Welcome back, {currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0]}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <div className="text-amber-400 mb-2">{s.icon}</div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-stone-500 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick action */}
      <div className="mb-6">
        <Link to="/photographers" className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition-colors text-sm">
          <Camera size={16} /> Find a Photographer
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-900 rounded-xl p-1 mb-6 w-fit">
        {(['bookings', 'favorites'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-stone-700 rounded-2xl">
              <Calendar size={40} className="text-stone-600 mx-auto mb-3" />
              <p className="font-semibold mb-2">No bookings yet</p>
              <p className="text-stone-400 text-sm mb-4">Browse photographers and book your first session</p>
              <Link to="/photographers" className="text-amber-400 hover:text-amber-300 text-sm font-medium">Browse Photographers →</Link>
            </div>
          ) : (
            bookings.map(booking => {
              const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending
              return (
                <div key={booking.id} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{booking.photographerName}</h3>
                      <p className="text-stone-400 text-sm">{new Date(booking.eventDate).toLocaleDateString('en-NG', { weekday: 'short', month: 'long', day: 'numeric' })} at {booking.eventTime}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConf.color}`}>{statusConf.label}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-stone-500 text-sm">{booking.serviceType === 'per-photo' ? `${booking.photoCount} photos` : booking.packageName}</p>
                      <p className="font-bold text-amber-400">₦{booking.totalAmount.toLocaleString()}</p>
                    </div>

                    <div className="flex gap-2">
                      {booking.status === 'pending' && (
                        <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 cursor-pointer transition-colors">
                          {uploading === booking.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          Upload Proof
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadPaymentProof(booking.id, f) }}
                          />
                        </label>
                      )}
                      <Link
                        to="/bookings/$id"
                        params={{ id: booking.id }}
                        className="px-3 py-2 text-xs font-medium text-stone-300 border border-stone-700 rounded-lg hover:border-stone-600 transition-colors"
                      >
                        <FileText size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Favorites tab */}
      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-stone-700 rounded-2xl">
              <Heart size={40} className="text-stone-600 mx-auto mb-3" />
              <p className="font-semibold mb-2">No favorites yet</p>
              <p className="text-stone-400 text-sm mb-4">Heart photographers you love to save them here</p>
              <Link to="/photographers" className="text-amber-400 hover:text-amber-300 text-sm font-medium">Browse Photographers →</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {favorites.map((p: any) => (
                <Link
                  key={p.id}
                  to="/photographers/$id"
                  params={{ id: p.id }}
                  className="bg-stone-900 border border-stone-800 rounded-xl p-4 hover:border-amber-500/30 transition-all flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-xl bg-stone-800 flex-shrink-0 overflow-hidden">
                    {p.profileImage ? <img src={p.profileImage} alt={p.brandName} className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-amber-400">{p.brandName[0]}</div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{p.brandName}</p>
                    <p className="text-stone-400 text-sm">{p.location}</p>
                    <p className="text-amber-400 text-sm font-bold">₦{p.pricePerPhoto.toLocaleString()}/photo</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
