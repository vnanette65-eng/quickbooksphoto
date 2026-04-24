import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Camera, Package, Calendar, Image, Upload, Plus, Trash2, Save, CheckCircle, X, Loader2, Settings, BarChart3, CreditCard, Tag } from 'lucide-react'
import { getUser } from '@netlify/identity'
import type { Photographer, Booking, Package as PkgType } from '../../lib/types'

export const Route = createFileRoute('/dashboard/photographer')({
  component: PhotographerDashboard,
})

type Tab = 'overview' | 'portfolio' | 'bookings' | 'profile' | 'pricing' | 'availability'

function PhotographerDashboard() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile form state
  const [brandName, setBrandName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [services, setServices] = useState<string[]>([])
  const [pricePerPhoto, setPricePerPhoto] = useState(0)
  const [minPhotos, setMinPhotos] = useState(5)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [packages, setPackages] = useState<PkgType[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [newDate, setNewDate] = useState('')
  const [uploadingMedia, setUploadingMedia] = useState(false)

  const ALL_SERVICES = ['wedding', 'portrait', 'event', 'commercial', 'fashion', 'travel', 'family', 'newborn']

  useEffect(() => {
    getUser().then(async user => {
      if (!user) { navigate({ to: '/auth/login' }); return }
      const role = (user?.app_metadata as any)?.roles?.[0]
      if (role === 'client') { navigate({ to: '/dashboard/client' }); return }
      if (role === 'admin') { navigate({ to: '/dashboard/admin' }); return }

      setCurrentUser(user)

      const [photoRes, bookRes] = await Promise.all([
        fetch(`/api/photographers?id=${user.id}`).then(r => r.json()),
        fetch(`/api/bookings?photographerId=${user.id}`).then(r => r.json()),
      ])

      const p: Photographer = photoRes.photographer
      setPhotographer(p || null)
      setBookings(bookRes.bookings || [])

      if (p) {
        setBrandName(p.brandName)
        setBio(p.bio)
        setLocation(p.location)
        setServices(p.services)
        setPricePerPhoto(p.pricePerPhoto)
        setMinPhotos(p.minPhotos)
        setBankName(p.bankDetails?.bankName || '')
        setAccountNumber(p.bankDetails?.accountNumber || '')
        setAccountName(p.bankDetails?.accountName || '')
        setPackages(p.packages || [])
        setAvailableDates(p.availableDates || [])
      }
    }).finally(() => setLoading(false))
  }, [navigate])

  async function saveProfile() {
    if (!currentUser) return
    setSaving(true)
    try {
      const res = await fetch('/api/photographers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.full_name || currentUser.email,
          brandName, bio, location, services,
          pricePerPhoto, minPhotos, packages, availableDates,
          bankDetails: { bankName, accountNumber, accountName },
          ...(photographer || {}),
        }),
      })
      const data = await res.json()
      setPhotographer(data.photographer)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { alert('Save failed') }
    finally { setSaving(false) }
  }

  async function uploadPortfolioMedia(file: File, type: 'image' | 'video') {
    setUploadingMedia(true)
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
        body: JSON.stringify({ data: base64, type: file.type, filename: file.name, category: 'portfolio' }),
      })
      const { url } = await uploadRes.json()

      const newItem = {
        id: Date.now().toString(),
        type,
        url,
        caption: file.name.split('.')[0],
        createdAt: new Date().toISOString(),
      }

      const updatedPortfolio = [...(photographer?.portfolio || []), newItem]
      const res = await fetch('/api/photographers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...photographer, userId: currentUser?.id, portfolio: updatedPortfolio }),
      })
      const data = await res.json()
      setPhotographer(data.photographer)
    } catch { alert('Upload failed') }
    finally { setUploadingMedia(false) }
  }

  async function removePortfolioItem(itemId: string) {
    if (!photographer) return
    const updated = photographer.portfolio.filter(i => i.id !== itemId)
    const res = await fetch('/api/photographers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...photographer, userId: currentUser?.id, portfolio: updated }),
    })
    const data = await res.json()
    setPhotographer(data.photographer)
  }

  async function respondToBooking(bookingId: string, status: 'confirmed' | 'rejected', note?: string) {
    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-status', id: bookingId, status, photographerNote: note }),
    })
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b))
  }

  function addPackage() {
    setPackages(prev => [...prev, {
      id: Date.now().toString(),
      name: 'New Package',
      description: '',
      price: 0,
      hours: 2,
      photos: 20,
      extras: [],
    }])
  }

  function updatePackage(id: string, field: keyof PkgType, value: any) {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Image size={16} /> },
    { id: 'bookings', label: `Bookings (${bookings.length})`, icon: <Calendar size={16} /> },
    { id: 'profile', label: 'Profile', icon: <Camera size={16} /> },
    { id: 'pricing', label: 'Pricing', icon: <Tag size={16} /> },
    { id: 'availability', label: 'Availability', icon: <Calendar size={16} /> },
  ]

  const STATUS_CONFIG: Record<string, string> = {
    pending: 'status-pending', 'payment-submitted': 'status-payment-submitted',
    confirmed: 'status-confirmed', completed: 'status-completed',
    cancelled: 'status-cancelled', rejected: 'status-rejected',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">{photographer?.brandName || 'My Studio'}</h1>
          <div className="flex items-center gap-3">
            {photographer ? (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                photographer.status === 'approved' ? 'status-confirmed' :
                photographer.status === 'pending' ? 'status-pending' : 'status-rejected'
              }`}>
                {photographer.status === 'approved' ? '✓ Approved' :
                 photographer.status === 'pending' ? '⏳ Pending Approval' : '✗ Not Approved'}
              </span>
            ) : (
              <span className="text-sm text-stone-400">Complete your profile to get started</span>
            )}
          </div>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle size={16} /> Saved!
          </div>
        )}
      </div>

      {photographer?.status === 'pending' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-sm text-amber-400">
          📋 Your profile is under review. An admin will approve it within 24-48 hours. After approval, clients can find and book you.
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 flex-wrap bg-stone-900 rounded-xl p-1 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Bookings', value: bookings.length },
              { label: 'Confirmed', value: bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).length },
              { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length },
              { label: 'Portfolio Items', value: photographer?.portfolio?.length || 0 },
            ].map(s => (
              <div key={s.label} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                <p className="text-2xl font-bold text-amber-400">{s.value}</p>
                <p className="text-stone-500 text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recent bookings */}
          <div>
            <h3 className="font-semibold mb-3">Recent Bookings</h3>
            {bookings.length === 0 ? (
              <p className="text-stone-500 text-sm">No bookings yet. Complete your profile to attract clients.</p>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map(b => (
                  <div key={b.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{b.clientName}</p>
                      <p className="text-stone-400 text-sm">{new Date(b.eventDate).toLocaleDateString('en-NG')} • ₦{b.totalAmount.toLocaleString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_CONFIG[b.status] || 'status-pending'}`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PORTFOLIO */}
      {activeTab === 'portfolio' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Portfolio ({photographer?.portfolio?.length || 0} items)</h3>
            <label className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-lg cursor-pointer text-sm transition-colors">
              {uploadingMedia ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Add Media
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={async e => {
                  const files = Array.from(e.target.files || [])
                  for (const file of files) {
                    const type = file.type.startsWith('video/') ? 'video' : 'image'
                    await uploadPortfolioMedia(file, type)
                  }
                }}
              />
            </label>
          </div>

          {photographer?.portfolio?.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-stone-700 rounded-2xl">
              <Image size={40} className="text-stone-600 mx-auto mb-3" />
              <p className="font-semibold mb-2">No portfolio items yet</p>
              <p className="text-stone-400 text-sm">Upload photos and videos to showcase your work</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photographer?.portfolio?.map(item => (
                <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-stone-900 group">
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={item.url} alt={item.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                  <button
                    onClick={() => removePortfolioItem(item.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-stone-700 rounded-2xl">
              <Calendar size={40} className="text-stone-600 mx-auto mb-3" />
              <p className="font-semibold mb-2">No bookings yet</p>
            </div>
          ) : (
            bookings.map(booking => (
              <div key={booking.id} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{booking.clientName}</p>
                    <p className="text-stone-400 text-sm">{booking.clientEmail}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_CONFIG[booking.status] || 'status-pending'}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="text-sm text-stone-400 space-y-1 mb-4">
                  <p>📅 {new Date(booking.eventDate).toLocaleDateString('en-NG')} at {booking.eventTime}</p>
                  <p>📍 {booking.eventLocation}</p>
                  <p>💰 ₦{booking.totalAmount.toLocaleString()} ({booking.serviceType === 'per-photo' ? `${booking.photoCount} photos` : booking.packageName})</p>
                  {booking.notes && <p>📝 {booking.notes}</p>}
                </div>

                {booking.paymentProof && (
                  <a href={booking.paymentProof} target="_blank" rel="noreferrer" className="text-xs text-amber-400 underline block mb-3">
                    View payment proof
                  </a>
                )}

                {booking.status === 'pending' || booking.status === 'payment-submitted' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToBooking(booking.id, 'confirmed', 'Looking forward to shooting with you!')}
                      className="flex-1 py-2 text-sm font-medium text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/10 transition-colors"
                    >
                      Accept ✓
                    </button>
                    <button
                      onClick={() => respondToBooking(booking.id, 'rejected', 'Unavailable on this date.')}
                      className="flex-1 py-2 text-sm font-medium text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      Decline ✗
                    </button>
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => respondToBooking(booking.id, 'completed' as any)}
                        className="flex-1 py-2 text-sm font-medium text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                ) : booking.status === 'confirmed' && (
                  <button
                    onClick={() => respondToBooking(booking.id, 'completed' as any)}
                    className="w-full py-2 text-sm font-medium text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* PROFILE */}
      {activeTab === 'profile' && (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-stone-300 mb-2 block">Brand / Studio Name</label>
            <input value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-amber-500" placeholder="Your Brand Name" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-300 mb-2 block">Bio / Description</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-amber-500 resize-none" placeholder="Tell clients about yourself..." />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-300 mb-2 block">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-amber-500" placeholder="City, Country" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-300 mb-2 block">Services Offered</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SERVICES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  className={`px-3 py-1.5 rounded-full text-sm capitalize transition-all ${services.includes(s) ? 'bg-amber-500 text-stone-950' : 'border border-stone-700 text-stone-400 hover:border-amber-500/40'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-stone-800 pt-5">
            <h4 className="font-medium mb-3 flex items-center gap-2"><CreditCard size={16} /> Bank Details</h4>
            <div className="grid md:grid-cols-3 gap-3">
              <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name" className="px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-amber-500" />
              <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number" className="px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-amber-500" />
              <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Account Name" className="px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-amber-500" />
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold rounded-xl transition-colors">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Profile
          </button>
        </div>
      )}

      {/* PRICING */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <h4 className="font-semibold mb-4">Per-Photo Pricing</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-stone-400 mb-2 block">Price per photo (₦)</label>
                <input type="number" value={pricePerPhoto} onChange={e => setPricePerPhoto(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-sm text-stone-400 mb-2 block">Minimum photos</label>
                <input type="number" value={minPhotos} onChange={e => setMinPhotos(Number(e.target.value))} min={1} className="w-full px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-white focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Packages</h4>
              <button onClick={addPackage} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors">
                <Plus size={14} /> Add Package
              </button>
            </div>

            <div className="space-y-4">
              {packages.map(pkg => (
                <div key={pkg.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={pkg.name} onChange={e => updatePackage(pkg.id, 'name', e.target.value)} placeholder="Package name" className="px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500" />
                    <input type="number" value={pkg.price} onChange={e => updatePackage(pkg.id, 'price', Number(e.target.value))} placeholder="Price (₦)" className="px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <input value={pkg.description} onChange={e => updatePackage(pkg.id, 'description', e.target.value)} placeholder="Description" className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">Hours</label>
                      <input type="number" value={pkg.hours} onChange={e => updatePackage(pkg.id, 'hours', Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">Photos</label>
                      <input type="number" value={pkg.photos} onChange={e => updatePackage(pkg.id, 'photos', Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => setPackages(prev => prev.filter(p => p.id !== pkg.id))} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold rounded-xl transition-colors">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Pricing
          </button>
        </div>
      )}

      {/* AVAILABILITY */}
      {activeTab === 'availability' && (
        <div className="space-y-5">
          <div className="flex gap-3">
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="flex-1 px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => {
                if (newDate && !availableDates.includes(newDate)) {
                  setAvailableDates(prev => [...prev, newDate].sort())
                  setNewDate('')
                }
              }}
              className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableDates.map(date => (
              <div key={date} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-900 border border-green-500/30 text-green-400 text-sm">
                {new Date(date).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
                <button onClick={() => setAvailableDates(prev => prev.filter(d => d !== date))} className="text-green-600 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
            {availableDates.length === 0 && (
              <p className="text-stone-500 text-sm">No available dates set. Add dates clients can book you.</p>
            )}
          </div>

          <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold rounded-xl transition-colors">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Availability
          </button>
        </div>
      )}
    </div>
  )
}
