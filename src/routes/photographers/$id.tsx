import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { MapPin, Star, Calendar, Camera, Heart, Share2, CheckCircle, Package, Image, Video, ArrowLeft, Clock } from 'lucide-react'
import { AIChat } from '../../components/AIChat'
import { getUser } from '@netlify/identity'
import type { User } from '@netlify/identity'
import type { Photographer } from '../../lib/types'

export const Route = createFileRoute('/photographers/$id')({
  component: PhotographerProfile,
})

const SERVICE_LABELS: Record<string, string> = {
  wedding: 'Wedding', portrait: 'Portrait', event: 'Event', commercial: 'Commercial',
  fashion: 'Fashion', travel: 'Travel', family: 'Family', newborn: 'Newborn',
}

const BADGE_LABELS: Record<string, string> = {
  'top-rated': '⭐ Top Rated', 'most-booked': '🔥 Most Booked',
  'verified-pro': '✓ Verified Pro', 'premium': '💎 Premium',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-600'} />
      ))}
    </div>
  )
}

function PhotographerProfile() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'packages' | 'reviews'>('portfolio')
  const [isFavorited, setIsFavorited] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    fetch(`/api/photographers?id=${id}`)
      .then(r => r.json())
      .then(data => setPhotographer(data.photographer || null))
      .catch(() => {})
      .finally(() => setLoading(false))

    getUser().then(u => setCurrentUser(u))

    const favs = JSON.parse(localStorage.getItem('ca_favorites') || '[]')
    setIsFavorited(favs.includes(id))
  }, [id])

  function toggleFavorite() {
    const favs = JSON.parse(localStorage.getItem('ca_favorites') || '[]')
    const next = isFavorited ? favs.filter((f: string) => f !== id) : [...favs, id]
    localStorage.setItem('ca_favorites', JSON.stringify(next))
    setIsFavorited(!isFavorited)
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: photographer?.brandName, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied!')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="h-64 bg-stone-900 rounded-2xl animate-pulse mb-6" />
        <div className="h-8 bg-stone-900 rounded animate-pulse w-1/2 mb-3" />
        <div className="h-4 bg-stone-900 rounded animate-pulse w-1/3" />
      </div>
    )
  }

  if (!photographer) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-2">Photographer not found</h2>
        <Link to="/photographers" className="text-amber-400">Browse photographers</Link>
      </div>
    )
  }

  const aiContext = {
    name: photographer.name,
    brandName: photographer.brandName,
    bio: photographer.bio,
    services: photographer.services,
    pricePerPhoto: photographer.pricePerPhoto,
    packages: photographer.packages.map(p => ({ name: p.name, price: p.price, description: p.description })),
    location: photographer.location,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      {/* Back button */}
      <button onClick={() => navigate({ to: '/photographers' })} className="flex items-center gap-2 text-stone-400 hover:text-white mb-6 pt-6 transition-colors text-sm">
        <ArrowLeft size={16} /> Back to Photographers
      </button>

      {/* Cover */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-stone-900 mb-6">
        {photographer.coverImage ? (
          <img src={photographer.coverImage} alt={photographer.brandName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera size={64} className="text-stone-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent" />

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={toggleFavorite}
            className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-stone-800 transition-colors"
          >
            <Heart size={18} className={isFavorited ? 'fill-red-400 text-red-400' : 'text-white'} />
          </button>
          <button
            onClick={share}
            className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-stone-800 transition-colors"
          >
            <Share2 size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Profile info */}
        <div className="md:col-span-2">
          {/* Profile header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl border-2 border-amber-500 overflow-hidden bg-stone-800 flex-shrink-0">
              {photographer.profileImage ? (
                <img src={photographer.profileImage} alt={photographer.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-amber-400">
                  {photographer.brandName[0]}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold">{photographer.brandName}</h1>
                {photographer.badges.map(badge => (
                  <span key={badge} className={`text-xs px-2 py-0.5 rounded-full font-medium badge-${badge}`}>
                    {BADGE_LABELS[badge]}
                  </span>
                ))}
              </div>
              <p className="text-stone-400 flex items-center gap-1 text-sm mb-2">
                <MapPin size={14} /> {photographer.location}
              </p>
              {photographer.rating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={photographer.rating} />
                  <span className="text-sm font-medium">{photographer.rating.toFixed(1)}</span>
                  <span className="text-stone-500 text-sm">({photographer.reviewCount} reviews)</span>
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-2 mb-4">
            {photographer.services.map(s => (
              <span key={s} className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm">
                {SERVICE_LABELS[s] || s}
              </span>
            ))}
          </div>

          {/* Bio */}
          <p className="text-stone-300 leading-relaxed mb-6">{photographer.bio}</p>

          {/* Tabs */}
          <div className="flex gap-1 bg-stone-900 rounded-xl p-1 mb-6">
            {(['portfolio', 'packages', 'reviews'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  activeTab === tab ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'portfolio' && (
            <div>
              {photographer.portfolio.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photographer.portfolio.map(item => (
                    <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-stone-900 group">
                      {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={item.url} alt={item.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      )}
                      {item.type === 'video' && (
                        <div className="absolute top-2 right-2 bg-stone-950/70 rounded px-1.5 py-0.5 text-xs flex items-center gap-1 text-white">
                          <Video size={10} /> Video
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-stone-500">
                  <Image size={40} className="mx-auto mb-3 opacity-50" />
                  <p>No portfolio items yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="space-y-4">
              {/* Per-photo pricing */}
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-1">
                      <Image size={16} className="text-amber-400" /> Per Photo
                    </h3>
                    <p className="text-stone-400 text-sm">Minimum {photographer.minPhotos} photos required</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-400">₦{photographer.pricePerPhoto.toLocaleString()}</p>
                    <p className="text-stone-500 text-xs">per photo</p>
                  </div>
                </div>
              </div>

              {photographer.packages.map(pkg => (
                <div key={pkg.id} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Package size={16} className="text-amber-400" /> {pkg.name}
                      </h3>
                      <p className="text-stone-400 text-sm mt-1">{pkg.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-400">₦{pkg.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-stone-300">
                    <span className="flex items-center gap-1"><Clock size={14} /> {pkg.hours}h session</span>
                    <span className="flex items-center gap-1"><Image size={14} /> {pkg.photos} photos</span>
                    {pkg.extras.map(e => (
                      <span key={e} className="flex items-center gap-1"><CheckCircle size={14} className="text-green-400" /> {e}</span>
                    ))}
                  </div>
                </div>
              ))}

              {photographer.packages.length === 0 && (
                <p className="text-stone-500 text-center py-6">No packages defined yet. Contact for custom quotes.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center py-12 text-stone-500">
              <Star size={40} className="mx-auto mb-3 opacity-50" />
              <p>No reviews yet. Be the first to book!</p>
            </div>
          )}
        </div>

        {/* Right: Booking card */}
        <div className="space-y-4">
          {/* Quick booking card */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sticky top-20">
            <h3 className="font-bold mb-1">Book {photographer.brandName}</h3>
            <p className="text-stone-400 text-sm mb-4">Starting from <span className="text-amber-400 font-bold">₦{photographer.pricePerPhoto.toLocaleString()}/photo</span></p>

            {photographer.availableDates.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-stone-400 mb-2 flex items-center gap-1">
                  <Calendar size={12} /> Available dates
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {photographer.availableDates.slice(0, 4).map(date => (
                    <span key={date} className="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                      {new Date(date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                    </span>
                  ))}
                  {photographer.availableDates.length > 4 && (
                    <span className="text-xs text-stone-500">+{photographer.availableDates.length - 4} more</span>
                  )}
                </div>
              </div>
            )}

            <Link
              to="/book/$photographerId"
              params={{ photographerId: photographer.id }}
              className="block w-full text-center py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition-colors mb-3"
            >
              Book Now
            </Link>

            <div className="text-center">
              <p className="text-xs text-stone-500">or chat with AI assistant below</p>
            </div>

            {photographer.bankDetails?.bankName && (
              <div className="mt-4 pt-4 border-t border-stone-800">
                <p className="text-xs text-stone-500 mb-1">Payment Details</p>
                <p className="text-sm text-stone-300">{photographer.bankDetails.bankName}</p>
                <p className="text-sm text-stone-300">{photographer.bankDetails.accountNumber}</p>
                <p className="text-xs text-stone-500">{photographer.bankDetails.accountName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photographer-specific AI Chat */}
      <AIChat photographerContext={aiContext} />
    </div>
  )
}
