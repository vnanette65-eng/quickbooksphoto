import { Link } from '@tanstack/react-router'
import { MapPin, Star, Heart, Camera, Award } from 'lucide-react'
import type { Photographer } from '../lib/types'

interface PhotographerCardProps {
  photographer: Photographer
  onFavorite?: (id: string) => void
  isFavorited?: boolean
}

const SERVICE_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  portrait: 'Portrait',
  event: 'Event',
  commercial: 'Commercial',
  fashion: 'Fashion',
  travel: 'Travel',
  family: 'Family',
  newborn: 'Newborn',
}

const BADGE_CONFIG = {
  'top-rated': { label: '⭐ Top Rated', className: 'badge-top-rated' },
  'most-booked': { label: '🔥 Most Booked', className: 'badge-most-booked' },
  'verified-pro': { label: '✓ Verified Pro', className: 'badge-verified-pro' },
  'premium': { label: '💎 Premium', className: 'badge-premium' },
}

export function PhotographerCard({ photographer, onFavorite, isFavorited }: PhotographerCardProps) {
  const coverImg = photographer.coverImage || photographer.portfolio[0]?.url

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden card-hover group">
      {/* Cover image */}
      <div className="relative h-52 bg-stone-800 overflow-hidden">
        {coverImg ? (
          <img
            src={coverImg}
            alt={photographer.brandName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera size={40} className="text-stone-600" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent" />

        {/* Favorite button */}
        {onFavorite && (
          <button
            onClick={e => { e.preventDefault(); onFavorite(photographer.id) }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-900/70 backdrop-blur-sm flex items-center justify-center hover:bg-stone-800 transition-colors"
          >
            <Heart
              size={16}
              className={isFavorited ? 'fill-red-400 text-red-400' : 'text-stone-300'}
            />
          </button>
        )}

        {/* Badges */}
        {photographer.badges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {photographer.badges.slice(0, 2).map(badge => (
              <span
                key={badge}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_CONFIG[badge]?.className}`}
              >
                {BADGE_CONFIG[badge]?.label}
              </span>
            ))}
          </div>
        )}

        {/* Profile pic */}
        <div className="absolute bottom-3 left-3">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500 overflow-hidden bg-stone-700">
            {photographer.profileImage ? (
              <img src={photographer.profileImage} alt={photographer.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-amber-400">
                {photographer.brandName[0]}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-white">{photographer.brandName}</h3>
            <p className="text-sm text-stone-400 flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {photographer.location}
            </p>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Star size={14} className="fill-amber-400" />
            <span className="text-sm font-medium">{photographer.rating > 0 ? photographer.rating.toFixed(1) : 'New'}</span>
            {photographer.reviewCount > 0 && (
              <span className="text-xs text-stone-500">({photographer.reviewCount})</span>
            )}
          </div>
        </div>

        <p className="text-sm text-stone-400 line-clamp-2 mb-3">{photographer.bio}</p>

        {/* Services */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {photographer.services.slice(0, 3).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {SERVICE_LABELS[s] || s}
            </span>
          ))}
          {photographer.services.length > 3 && (
            <span className="text-xs text-stone-500">+{photographer.services.length - 3}</span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-800">
          <div>
            <span className="text-xs text-stone-500">From</span>
            <p className="font-bold text-amber-400">₦{photographer.pricePerPhoto.toLocaleString()}<span className="text-xs font-normal text-stone-400">/photo</span></p>
          </div>
          <Link
            to="/photographers/$id"
            params={{ id: photographer.id }}
            className="text-sm font-semibold px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
