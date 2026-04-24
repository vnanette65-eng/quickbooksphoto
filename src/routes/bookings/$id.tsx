import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ArrowLeft, Download, Share2, Camera, CheckCircle, Clock, MapPin, CreditCard, Calendar } from 'lucide-react'
import type { Booking } from '../../lib/types'

export const Route = createFileRoute('/bookings/$id')({
  component: BookingDetail,
})

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'status-pending', icon: <Clock size={14} /> },
  'payment-submitted': { label: 'Payment Submitted', color: 'status-payment-submitted', icon: <CreditCard size={14} /> },
  confirmed: { label: 'Confirmed', color: 'status-confirmed', icon: <CheckCircle size={14} /> },
  completed: { label: 'Completed', color: 'status-completed', icon: <CheckCircle size={14} /> },
  cancelled: { label: 'Cancelled', color: 'status-cancelled', icon: <Clock size={14} /> },
  rejected: { label: 'Rejected', color: 'status-rejected', icon: <Clock size={14} /> },
}

function BookingDetail() {
  const { id } = Route.useParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/bookings?id=${id}`)
      .then(r => r.json())
      .then(data => setBooking(data.booking))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  function printReceipt() {
    window.print()
  }

  function shareBooking() {
    if (navigator.share) {
      navigator.share({ title: `Booking with ${booking?.photographerName}`, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied!')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
  }

  if (!booking) {
    return <div className="text-center py-20"><p className="text-stone-400">Booking not found</p></div>
  }

  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/dashboard/client" className="flex items-center gap-2 text-stone-400 hover:text-white mb-6 text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {/* Receipt card - printable */}
      <div id="receipt" className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
        {/* Receipt header */}
        <div className="bg-gradient-to-r from-amber-900/40 to-stone-900 p-6 border-b border-stone-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <Camera size={16} className="text-stone-950" />
              </div>
              <span className="gradient-text">CaptureAfrica</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
              {status.icon} {status.label}
            </div>
          </div>

          {booking.receiptId && (
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Receipt ID</p>
              <p className="font-mono font-bold text-white text-lg">{booking.receiptId}</p>
            </div>
          )}
        </div>

        {/* Booking details */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Photographer</p>
              <p className="font-semibold text-white">{booking.photographerName}</p>
              <p className="text-xs text-stone-500">{booking.photographerEmail}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Client</p>
              <p className="font-semibold text-white">{booking.clientName}</p>
              <p className="text-xs text-stone-500">{booking.clientEmail}</p>
            </div>
          </div>

          <div className="border-t border-stone-800 pt-5 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-stone-400 text-xs">Date & Time</p>
                <p className="font-medium">{new Date(booking.eventDate).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {booking.eventTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={16} className="text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-stone-400 text-xs">Location</p>
                <p className="font-medium">{booking.eventLocation}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-800 pt-5">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">Service Breakdown</p>
            <div className="bg-stone-950 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">
                  {booking.serviceType === 'per-photo'
                    ? `Photography (${booking.photoCount} photos)`
                    : booking.packageName || 'Package'}
                </span>
                <span className="font-medium">₦{booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-stone-800 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-amber-400">₦{booking.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {booking.photographerNote && (
            <div className="border-t border-stone-800 pt-5">
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Message from Photographer</p>
              <p className="text-stone-300 text-sm italic">"{booking.photographerNote}"</p>
            </div>
          )}

          {booking.notes && (
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Your Notes</p>
              <p className="text-stone-400 text-sm">{booking.notes}</p>
            </div>
          )}

          <div className="text-xs text-stone-600 border-t border-stone-800 pt-4">
            <p>Booking created: {new Date(booking.createdAt).toLocaleString('en-NG')}</p>
            <p>Last updated: {new Date(booking.updatedAt).toLocaleString('en-NG')}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={printReceipt}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-stone-700 rounded-xl text-stone-300 hover:border-amber-500/40 hover:text-amber-400 transition-all text-sm font-medium"
        >
          <Download size={16} /> Download Receipt
        </button>
        <button
          onClick={shareBooking}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-stone-700 rounded-xl text-stone-300 hover:border-amber-500/40 hover:text-amber-400 transition-all text-sm font-medium"
        >
          <Share2 size={16} /> Share
        </button>
      </div>

      {/* Status steps */}
      <div className="mt-6 bg-stone-900 border border-stone-800 rounded-xl p-5">
        <p className="text-sm font-semibold mb-4">Booking Progress</p>
        {[
          { status: 'pending', label: 'Booking Submitted', done: true },
          { status: 'payment-submitted', label: 'Payment Proof Uploaded', done: ['payment-submitted', 'confirmed', 'completed'].includes(booking.status) },
          { status: 'confirmed', label: 'Photographer Confirmed', done: ['confirmed', 'completed'].includes(booking.status) },
          { status: 'completed', label: 'Session Completed', done: booking.status === 'completed' },
        ].map((item, i) => (
          <div key={item.status} className="flex items-center gap-3 py-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-500' : 'bg-stone-800'}`}>
              {item.done ? <CheckCircle size={14} className="text-white" /> : <span className="text-xs text-stone-500">{i + 1}</span>}
            </div>
            <span className={`text-sm ${item.done ? 'text-white' : 'text-stone-500'}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
