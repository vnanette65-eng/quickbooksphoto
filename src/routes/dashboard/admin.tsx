import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Users, Camera, Calendar, CheckCircle, X, Eye, Shield, BarChart3, RefreshCw } from 'lucide-react'
import { getUser } from '@netlify/identity'
import type { Photographer, Booking } from '../../lib/types'

export const Route = createFileRoute('/dashboard/admin')({
  component: AdminDashboard,
})

type Tab = 'photographers' | 'bookings' | 'overview'

function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    getUser().then(async user => {
      if (!user) { navigate({ to: '/auth/login' }); return }
      const role = (user?.app_metadata as any)?.roles?.[0]
      if (role !== 'admin') {
        if (role === 'photographer') navigate({ to: '/dashboard/photographer' })
        else navigate({ to: '/dashboard/client' })
        return
      }

      await loadData()
    }).finally(() => setLoading(false))
  }, [navigate])

  async function loadData() {
    const [photoRes, bookRes] = await Promise.all([
      fetch('/api/photographers?all=true').then(r => r.json()),
      fetch('/api/bookings').then(r => r.json()),
    ])
    setPhotographers(photoRes.photographers || [])
    setBookings(bookRes.bookings || [])
  }

  async function updatePhotographerStatus(id: string, status: 'approved' | 'rejected' | 'suspended') {
    setProcessing(id)
    try {
      await fetch('/api/photographers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-status', id, status }),
      })
      setPhotographers(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    } catch { alert('Failed to update status') }
    finally { setProcessing(null) }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
  }

  const pendingPhotographers = photographers.filter(p => p.status === 'pending')
  const approvedPhotographers = photographers.filter(p => p.status === 'approved')
  const filteredPhotographers = filterStatus === 'all' ? photographers : photographers.filter(p => p.status === filterStatus)

  const STATUS_COLORS: Record<string, string> = {
    pending: 'status-pending', approved: 'status-confirmed',
    rejected: 'status-rejected', suspended: 'status-cancelled',
  }

  const BOOKING_STATUS_COLORS: Record<string, string> = {
    pending: 'status-pending', 'payment-submitted': 'status-payment-submitted',
    confirmed: 'status-confirmed', completed: 'status-completed',
    cancelled: 'status-cancelled', rejected: 'status-rejected',
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-stone-400">Manage the CaptureAfrica platform</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 border border-stone-700 rounded-lg text-stone-300 hover:border-amber-500/40 hover:text-amber-400 transition-all text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Photographers', value: photographers.length, icon: <Camera size={20} />, color: 'text-amber-400' },
          { label: 'Pending Approval', value: pendingPhotographers.length, icon: <Shield size={20} />, color: 'text-yellow-400' },
          { label: 'Active (Approved)', value: approvedPhotographers.length, icon: <CheckCircle size={20} />, color: 'text-green-400' },
          { label: 'Total Bookings', value: bookings.length, icon: <Calendar size={20} />, color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <div className={`${stat.color} mb-2`}>{stat.icon}</div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-stone-500 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending approvals alert */}
      {pendingPhotographers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <p className="text-amber-400 font-medium">
            ⚠️ {pendingPhotographers.length} photographer{pendingPhotographers.length !== 1 ? 's' : ''} waiting for approval
          </p>
          <button onClick={() => { setActiveTab('photographers'); setFilterStatus('pending') }} className="text-sm text-amber-400 underline">
            Review now
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-900 rounded-xl p-1 mb-6 w-fit">
        {([
          { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
          { id: 'photographers', label: `Photographers (${photographers.length})`, icon: <Camera size={16} /> },
          { id: 'bookings', label: `Bookings (${bookings.length})`, icon: <Calendar size={16} /> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent photographers */}
          <div>
            <h3 className="font-semibold mb-3">Recent Photographers</h3>
            <div className="space-y-3">
              {photographers.slice(0, 5).map(p => (
                <div key={p.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{p.brandName}</p>
                    <p className="text-stone-500 text-sm">{p.location} • {p.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status] || 'status-pending'}`}>
                    {p.status}
                  </span>
                </div>
              ))}
              {photographers.length === 0 && <p className="text-stone-500 text-sm">No photographers yet</p>}
            </div>
          </div>

          {/* Recent bookings */}
          <div>
            <h3 className="font-semibold mb-3">Recent Bookings</h3>
            <div className="space-y-3">
              {bookings.slice(0, 5).map(b => (
                <div key={b.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{b.clientName} → {b.photographerName}</p>
                    <p className="text-stone-500 text-sm">{new Date(b.eventDate).toLocaleDateString('en-NG')} • ₦{b.totalAmount.toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${BOOKING_STATUS_COLORS[b.status] || 'status-pending'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
              {bookings.length === 0 && <p className="text-stone-500 text-sm">No bookings yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* PHOTOGRAPHERS */}
      {activeTab === 'photographers' && (
        <div>
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filterStatus === s ? 'bg-amber-500 text-stone-950' : 'border border-stone-700 text-stone-400 hover:border-stone-600'}`}
              >
                {s} {s !== 'all' && `(${photographers.filter(p => p.status === s).length})`}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredPhotographers.length === 0 ? (
              <p className="text-stone-500 text-center py-8">No photographers in this category</p>
            ) : (
              filteredPhotographers.map(p => (
                <div key={p.id} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{p.brandName}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status] || 'status-pending'}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-stone-400 text-sm">{p.email} • {p.location}</p>
                      <p className="text-stone-500 text-sm">{p.services.join(', ')} • ₦{p.pricePerPhoto.toLocaleString()}/photo</p>
                    </div>
                    <Link
                      to="/photographers/$id"
                      params={{ id: p.id }}
                      className="p-2 text-stone-400 hover:text-amber-400 transition-colors"
                    >
                      <Eye size={18} />
                    </Link>
                  </div>

                  <p className="text-stone-400 text-sm line-clamp-2 mb-4">{p.bio}</p>

                  {(p.status === 'pending' || p.status === 'approved') && (
                    <div className="flex gap-2">
                      {p.status === 'pending' && (
                        <button
                          onClick={() => updatePhotographerStatus(p.id, 'approved')}
                          disabled={processing === p.id}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/10 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                      )}
                      {p.status === 'pending' && (
                        <button
                          onClick={() => updatePhotographerStatus(p.id, 'rejected')}
                          disabled={processing === p.id}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                        >
                          <X size={14} /> Reject
                        </button>
                      )}
                      {p.status === 'approved' && (
                        <button
                          onClick={() => updatePhotographerStatus(p.id, 'suspended')}
                          disabled={processing === p.id}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/10 disabled:opacity-50 transition-colors"
                        >
                          <Shield size={14} /> Suspend
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <p className="text-stone-500 text-center py-8">No bookings yet</p>
          ) : (
            bookings.map(b => (
              <div key={b.id} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{b.clientName} → {b.photographerName}</p>
                    <p className="text-stone-400 text-sm">{b.clientEmail}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${BOOKING_STATUS_COLORS[b.status] || 'status-pending'}`}>
                    {b.status}
                  </span>
                </div>
                <div className="text-sm text-stone-500 space-y-0.5">
                  <p>📅 {new Date(b.eventDate).toLocaleDateString('en-NG')} at {b.eventTime}</p>
                  <p>💰 ₦{b.totalAmount.toLocaleString()} ({b.serviceType === 'per-photo' ? `${b.photoCount} photos` : b.packageName})</p>
                  {b.paymentProof && <a href={b.paymentProof} target="_blank" rel="noreferrer" className="text-amber-400 underline">View payment proof</a>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
