import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, MapPin, Star, SlidersHorizontal, X, Camera } from 'lucide-react'
import { PhotographerCard } from '../../components/PhotographerCard'
import type { Photographer, PhotographerService } from '../../lib/types'
import { z } from 'zod'

const SERVICES: { value: PhotographerService; label: string }[] = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'event', label: 'Event' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'travel', label: 'Travel' },
  { value: 'family', label: 'Family' },
  { value: 'newborn', label: 'Newborn' },
]

export const Route = createFileRoute('/photographers/')({
  validateSearch: z.object({
    service: z.string().optional(),
    location: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    minRating: z.string().optional(),
  }),
  component: PhotographersBrowse,
})

function PhotographersBrowse() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/photographers/' })
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [localService, setLocalService] = useState(search.service || '')
  const [localLocation, setLocalLocation] = useState(search.location || '')
  const [localMinPrice, setLocalMinPrice] = useState(search.minPrice || '')
  const [localMaxPrice, setLocalMaxPrice] = useState(search.maxPrice || '')
  const [localMinRating, setLocalMinRating] = useState(search.minRating || '')

  const loadPhotographers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search.service) params.set('service', search.service)
    if (search.location) params.set('location', search.location)
    if (search.minPrice) params.set('minPrice', search.minPrice)
    if (search.maxPrice) params.set('maxPrice', search.maxPrice)
    if (search.minRating) params.set('minRating', search.minRating)

    try {
      const res = await fetch(`/api/photographers?${params}`)
      const data = await res.json()
      setPhotographers(data.photographers || [])
    } catch {
      setPhotographers([])
    } finally {
      setLoading(false)
    }
  }, [search.service, search.location, search.minPrice, search.maxPrice, search.minRating])

  useEffect(() => {
    loadPhotographers()
  }, [loadPhotographers])

  useEffect(() => {
    const saved = localStorage.getItem('ca_favorites')
    if (saved) setFavorites(JSON.parse(saved))
  }, [])

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id]
    setFavorites(next)
    localStorage.setItem('ca_favorites', JSON.stringify(next))
  }

  function applyFilters() {
    navigate({
      search: {
        service: localService || undefined,
        location: localLocation || undefined,
        minPrice: localMinPrice || undefined,
        maxPrice: localMaxPrice || undefined,
        minRating: localMinRating || undefined,
      },
    })
    setShowFilters(false)
  }

  function clearFilters() {
    setLocalService('')
    setLocalLocation('')
    setLocalMinPrice('')
    setLocalMaxPrice('')
    setLocalMinRating('')
    navigate({ search: {} })
    setShowFilters(false)
  }

  const hasActiveFilters = !!(search.service || search.location || search.minPrice || search.maxPrice || search.minRating)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Your Photographer</h1>
        <p className="text-stone-400">Browse {photographers.length > 0 ? `${photographers.length} ` : ''}verified photographers across Africa</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={localLocation}
            onChange={e => setLocalLocation(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Search by location..."
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
            hasActiveFilters
              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
              : 'border-stone-700 text-stone-300 hover:border-stone-600'
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-amber-500" />}
        </button>
      </div>

      {/* Service filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SERVICES.map(s => (
          <button
            key={s.value}
            onClick={() => {
              const next = localService === s.value ? '' : s.value
              setLocalService(next)
              navigate({ search: { ...search, service: next || undefined } })
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              search.service === s.value || localService === s.value
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-900 border border-stone-800 text-stone-300 hover:border-amber-500/40 hover:text-amber-400'
            }`}
          >
            {s.label}
          </button>
        ))}
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-4 py-2 rounded-full text-sm text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-all">
            <X size={14} /> Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Filter size={16} /> Advanced Filters
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Min Price (₦/photo)</label>
              <input
                type="number"
                value={localMinPrice}
                onChange={e => setLocalMinPrice(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Max Price (₦/photo)</label>
              <input
                type="number"
                value={localMaxPrice}
                onChange={e => setLocalMaxPrice(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Min Rating</label>
              <select
                value={localMinRating}
                onChange={e => setLocalMinRating(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="">Any rating</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="4.5">4.5+ stars</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={applyFilters} className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-lg transition-colors text-sm">
              Apply Filters
            </button>
            <button onClick={clearFilters} className="px-6 py-2 border border-stone-700 rounded-lg text-stone-300 hover:border-stone-600 transition-colors text-sm">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-stone-900 rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      ) : photographers.length > 0 ? (
        <>
          <p className="text-stone-500 text-sm mb-4">{photographers.length} photographer{photographers.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photographers.map(p => (
              <PhotographerCard
                key={p.id}
                photographer={p}
                onFavorite={toggleFavorite}
                isFavorited={favorites.includes(p.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20 border border-dashed border-stone-700 rounded-2xl">
          <Camera size={48} className="text-stone-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No photographers found</h3>
          <p className="text-stone-400 mb-4">
            {hasActiveFilters ? 'Try adjusting your filters' : 'No photographers available yet'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-amber-400 hover:text-amber-300 text-sm font-medium">
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
