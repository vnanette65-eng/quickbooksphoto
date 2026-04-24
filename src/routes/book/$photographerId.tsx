import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, MapPin, Clock, Image, Package, CreditCard, CheckCircle, Upload, Loader2 } from 'lucide-react'
import { getUser } from '@netlify/identity'
import type { Photographer } from '../../lib/types'

export const Route = createFileRoute('/book/$photographerId')({
  component: BookingPage,
})

type Step = 'service' | 'datetime' | 'details' | 'confirm' | 'payment'

function BookingPage() {
  const { photographerId } = Route.useParams()
  const navigate = useNavigate()
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('service')
  const [submitting, setSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)

  // Form state
  const [serviceType, setServiceType] = useState<'per-photo' | 'package'>('per-photo')
  const [selectedPackageId, setSelectedPackageId] = useState('')
  const [photoCount, setPhotoCount] = useState(5)
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentProof, setPaymentProof] = useState('')
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/photographers?id=${photographerId}`).then(r => r.json()),
      getUser(),
    ]).then(([photoData, user]) => {
      setPhotographer(photoData.photographer || null)
      setCurrentUser(user)
    }).finally(() => setLoading(false))
  }, [photographerId])

  function getTotalAmount() {
    if (!photographer) return 0
    if (serviceType === 'package') {
      const pkg = photographer.packages.find(p => p.id === selectedPackageId)
      return pkg?.price || 0
    }
    return photoCount * photographer.pricePerPhoto
  }

  async function uploadProof(file: File) {
    setUploadingProof(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: base64, type: file.type, filename: file.name, category: 'payment-proofs' }),
      })
      const data = await res.json()
      setPaymentProof(data.url)
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploadingProof(false)
    }
  }

  async function submitBooking() {
    if (!currentUser) { navigate({ to: '/auth/login' }); return }
    setSubmitting(true)

    try {
      const selectedPkg = photographer?.packages.find(p => p.id === selectedPackageId)
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: currentUser.id,
          clientEmail: currentUser.email,
          clientName: currentUser.user_metadata?.full_name || currentUser.email,
          photographerId: photographer!.id,
          photographerName: photographer!.brandName,
          photographerEmail: photographer!.email,
          serviceType,
          packageId: serviceType === 'package' ? selectedPackageId : undefined,
          packageName: serviceType === 'package' ? selectedPkg?.name : undefined,
          photoCount: serviceType === 'per-photo' ? photoCount : undefined,
          eventDate,
          eventTime,
          eventLocation,
          notes,
          totalAmount: getTotalAmount(),
        }),
      })
      const data = await res.json()
      setBookingId(data.booking.id)
      setStep('payment')
    } catch {
      alert('Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitPaymentProof() {
    if (!bookingId || !paymentProof) return
    setSubmitting(true)
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-status', id: bookingId, status: 'payment-submitted', paymentProof }),
      })
      navigate({ to: '/bookings/$id', params: { id: bookingId } })
    } catch {
      alert('Failed to submit proof. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
  }

  if (!photographer) {
    return <div className="text-center py-20"><p className="text-stone-400">Photographer not found</p></div>
  }

  const steps: Step[] = ['service', 'datetime', 'details', 'confirm', 'payment']
  const stepIndex = steps.indexOf(step)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate({ to: '/photographers/$id', params: { id: photographerId } })} className="flex items-center gap-2 text-stone-400 hover:text-white mb-6 text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Profile
      </button>

      <h1 className="text-2xl font-bold mb-2">Book {photographer.brandName}</h1>
      <p className="text-stone-400 mb-8">{photographer.location}</p>

      {/* Progress */}
      {step !== 'payment' && (
        <div className="flex items-center gap-2 mb-8">
          {(['service', 'datetime', 'details', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                steps.indexOf(s) < stepIndex ? 'bg-amber-500 text-stone-950' :
                steps.indexOf(s) === stepIndex ? 'bg-amber-500 text-stone-950' :
                'bg-stone-800 text-stone-500'
              }`}>
                {steps.indexOf(s) < stepIndex ? <CheckCircle size={16} /> : i + 1}
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 ${steps.indexOf(s) < stepIndex ? 'bg-amber-500' : 'bg-stone-800'}`} />}
            </div>
          ))}
        </div>
      )}

      {/* STEP 1: Service selection */}
      {step === 'service' && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg mb-4">Choose a Service</h2>

          <button
            onClick={() => setServiceType('per-photo')}
            className={`w-full p-5 rounded-xl border-2 text-left transition-all ${serviceType === 'per-photo' ? 'border-amber-500 bg-amber-500/10' : 'border-stone-800 hover:border-stone-700'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image size={20} className="text-amber-400" />
                <div>
                  <p className="font-semibold">Per Photo</p>
                  <p className="text-sm text-stone-400">Pay per photo taken</p>
                </div>
              </div>
              <p className="font-bold text-amber-400">₦{photographer.pricePerPhoto.toLocaleString()}/photo</p>
            </div>
            {serviceType === 'per-photo' && (
              <div className="mt-4 pt-4 border-t border-stone-800">
                <label className="text-sm text-stone-400 mb-2 block">Number of photos (min {photographer.minPhotos})</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPhotoCount(Math.max(photographer.minPhotos, photoCount - 1))} className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center hover:bg-stone-700">-</button>
                  <span className="text-xl font-bold w-12 text-center">{photoCount}</span>
                  <button onClick={() => setPhotoCount(photoCount + 1)} className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center hover:bg-stone-700">+</button>
                </div>
                <p className="text-amber-400 font-bold mt-2">Total: ₦{(photoCount * photographer.pricePerPhoto).toLocaleString()}</p>
              </div>
            )}
          </button>

          {photographer.packages.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => { setServiceType('package'); setSelectedPackageId(pkg.id) }}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all ${serviceType === 'package' && selectedPackageId === pkg.id ? 'border-amber-500 bg-amber-500/10' : 'border-stone-800 hover:border-stone-700'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-amber-400" />
                  <div>
                    <p className="font-semibold">{pkg.name}</p>
                    <p className="text-sm text-stone-400">{pkg.description}</p>
                  </div>
                </div>
                <p className="font-bold text-amber-400">₦{pkg.price.toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-stone-400">
                <span>⏱ {pkg.hours}h session</span>
                <span>📸 {pkg.photos} photos</span>
                {pkg.extras.map(e => <span key={e}>✓ {e}</span>)}
              </div>
            </button>
          ))}

          <button
            onClick={() => setStep('datetime')}
            disabled={serviceType === 'package' && !selectedPackageId}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold rounded-xl transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {/* STEP 2: Date & Time */}
      {step === 'datetime' && (
        <div className="space-y-5">
          <h2 className="font-semibold text-lg mb-4">Choose Date & Time</h2>

          <div>
            <label className="text-sm font-medium text-stone-300 mb-2 flex items-center gap-2"><Calendar size={14} /> Event Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-amber-500"
            />
            {photographer.availableDates.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <p className="w-full text-xs text-stone-500 mb-1">Suggested available dates:</p>
                {photographer.availableDates.slice(0, 6).map(d => (
                  <button key={d} onClick={() => setEventDate(d)} className="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20">
                    {new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-stone-300 mb-2 flex items-center gap-2"><Clock size={14} /> Preferred Time</label>
            <select
              value={eventTime}
              onChange={e => setEventTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Select time</option>
              {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('service')} className="flex-1 py-3 border border-stone-700 rounded-xl text-stone-300 hover:border-stone-600 transition-colors">Back</button>
            <button
              onClick={() => setStep('details')}
              disabled={!eventDate || !eventTime}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold rounded-xl transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Details */}
      {step === 'details' && (
        <div className="space-y-5">
          <h2 className="font-semibold text-lg mb-4">Event Details</h2>

          <div>
            <label className="text-sm font-medium text-stone-300 mb-2 flex items-center gap-2"><MapPin size={14} /> Event Location</label>
            <input
              type="text"
              value={eventLocation}
              onChange={e => setEventLocation(e.target.value)}
              placeholder="Where is the event?"
              className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-300 mb-2">Additional Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special requests, dress codes, mood, references..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('datetime')} className="flex-1 py-3 border border-stone-700 rounded-xl text-stone-300 hover:border-stone-600 transition-colors">Back</button>
            <button
              onClick={() => setStep('confirm')}
              disabled={!eventLocation}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold rounded-xl transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-5">
          <h2 className="font-semibold text-lg mb-4">Confirm Booking</h2>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Photographer</span>
              <span className="font-medium">{photographer.brandName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Service</span>
              <span className="font-medium">{serviceType === 'per-photo' ? `${photoCount} photos` : photographer.packages.find(p => p.id === selectedPackageId)?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Date</span>
              <span className="font-medium">{new Date(eventDate).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Time</span>
              <span className="font-medium">{eventTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Location</span>
              <span className="font-medium">{eventLocation}</span>
            </div>
            <div className="border-t border-stone-800 pt-3 flex justify-between">
              <span className="font-semibold">Total Amount</span>
              <span className="font-bold text-amber-400 text-lg">₦{getTotalAmount().toLocaleString()}</span>
            </div>
          </div>

          {photographer.bankDetails?.bankName && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-400 font-semibold text-sm mb-2 flex items-center gap-2"><CreditCard size={14} /> Payment Details</p>
              <p className="text-sm text-stone-300">{photographer.bankDetails.bankName}</p>
              <p className="text-sm font-mono text-white">{photographer.bankDetails.accountNumber}</p>
              <p className="text-sm text-stone-400">{photographer.bankDetails.accountName}</p>
              <p className="text-xs text-stone-500 mt-2">Pay ₦{getTotalAmount().toLocaleString()} to the above account after booking</p>
            </div>
          )}

          {!currentUser && (
            <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-sm text-stone-400">
              <Link to="/auth/login" className="text-amber-400 hover:text-amber-300">Sign in</Link> to complete your booking
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep('details')} className="flex-1 py-3 border border-stone-700 rounded-xl text-stone-300 hover:border-stone-600 transition-colors">Back</button>
            <button
              onClick={submitBooking}
              disabled={submitting || !currentUser}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Payment Proof */}
      {step === 'payment' && (
        <div className="space-y-5">
          <div className="text-center py-6">
            <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
            <h2 className="font-bold text-xl mb-2">Booking Confirmed!</h2>
            <p className="text-stone-400">Now upload your payment proof to complete the process</p>
          </div>

          {photographer.bankDetails?.bankName && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-400 font-semibold text-sm mb-2">Pay Now</p>
              <p className="font-bold text-white text-lg">₦{getTotalAmount().toLocaleString()}</p>
              <p className="text-sm text-stone-300 mt-1">{photographer.bankDetails.bankName}</p>
              <p className="text-sm font-mono text-white">{photographer.bankDetails.accountNumber}</p>
              <p className="text-sm text-stone-400">{photographer.bankDetails.accountName}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-stone-300 mb-2 flex items-center gap-2"><Upload size={14} /> Upload Payment Proof</label>
            <div
              className="border-2 border-dashed border-stone-700 rounded-xl p-8 text-center hover:border-amber-500/40 transition-colors cursor-pointer"
              onClick={() => document.getElementById('proof-upload')?.click()}
            >
              {paymentProof ? (
                <div className="space-y-2">
                  <CheckCircle size={32} className="text-green-400 mx-auto" />
                  <p className="text-green-400 font-medium">Proof uploaded!</p>
                  <p className="text-xs text-stone-500">{paymentFile?.name}</p>
                </div>
              ) : uploadingProof ? (
                <div className="space-y-2">
                  <Loader2 size={32} className="text-amber-400 mx-auto animate-spin" />
                  <p className="text-stone-400">Uploading...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={32} className="text-stone-500 mx-auto" />
                  <p className="text-stone-400">Click to upload receipt / bank screenshot</p>
                  <p className="text-xs text-stone-600">PNG, JPG, PDF up to 10MB</p>
                </div>
              )}
            </div>
            <input
              id="proof-upload"
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0]
                if (file) { setPaymentFile(file); await uploadProof(file) }
              }}
            />
          </div>

          <button
            onClick={submitPaymentProof}
            disabled={!paymentProof || submitting}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit Payment Proof'}
          </button>

          <button
            onClick={() => bookingId && navigate({ to: '/bookings/$id', params: { id: bookingId } })}
            className="w-full py-3 text-stone-400 hover:text-white text-sm transition-colors"
          >
            Do this later from my dashboard
          </button>
        </div>
      )}
    </div>
  )
}
