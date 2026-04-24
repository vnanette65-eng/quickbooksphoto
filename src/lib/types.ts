export type PhotographerService = 'wedding' | 'portrait' | 'event' | 'commercial' | 'fashion' | 'travel' | 'family' | 'newborn'

export type BookingStatus = 'pending' | 'payment-submitted' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'

export type AdStatus = 'pending' | 'payment-submitted' | 'active' | 'expired' | 'rejected'

export type AdPlacement = 'homepage-banner' | 'featured-photographer' | 'sidebar'

export type PhotographerBadge = 'top-rated' | 'most-booked' | 'verified-pro' | 'premium'

export interface Package {
  id: string
  name: string
  description: string
  price: number
  hours: number
  photos: number
  extras: string[]
}

export interface PortfolioItem {
  id: string
  type: 'image' | 'video'
  url: string
  caption: string
  createdAt: string
}

export interface BankDetails {
  bankName: string
  accountNumber: string
  accountName: string
}

export interface PromoCode {
  code: string
  discount: number
  expiresAt: string
  usageLimit: number
  usageCount: number
}

export interface Review {
  id: string
  clientId: string
  clientName: string
  rating: number
  comment: string
  createdAt: string
}

export interface Photographer {
  id: string
  userId: string
  email: string
  name: string
  brandName: string
  bio: string
  location: string
  latitude?: number
  longitude?: number
  services: PhotographerService[]
  pricePerPhoto: number
  minPhotos: number
  packages: Package[]
  portfolio: PortfolioItem[]
  availableDates: string[]
  blockedDates: string[]
  bankDetails: BankDetails
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  rating: number
  reviewCount: number
  badges: PhotographerBadge[]
  profileImage: string
  coverImage: string
  promoCode?: PromoCode
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: string
  clientId: string
  clientEmail: string
  clientName: string
  photographerId: string
  photographerName: string
  photographerEmail: string
  serviceType: 'per-photo' | 'package'
  packageId?: string
  packageName?: string
  photoCount?: number
  eventDate: string
  eventTime: string
  eventLocation: string
  notes: string
  totalAmount: number
  status: BookingStatus
  paymentProof?: string
  photographerNote?: string
  receiptId?: string
  createdAt: string
  updatedAt: string
}

export interface Ad {
  id: string
  photographerId: string
  photographerName: string
  bannerUrl: string
  targetUrl: string
  placement: AdPlacement
  status: AdStatus
  paymentProof?: string
  startsAt?: string
  expiresAt?: string
  createdAt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'client' | 'photographer' | 'admin'
  emailVerified: boolean
}
