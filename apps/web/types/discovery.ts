export type EntityType = 'product' | 'service' | 'company'

export type SearchMode = 'all' | 'products' | 'services' | 'companies'

export type GeoScope =
  | 'near_me' | 'city' | 'district'
  | 'state'   | 'pan_india' | 'global'

export interface SearchFilters {
  q:            string
  mode:         SearchMode
  geoScope:     GeoScope
  city?:        string
  state?:       string
  lat?:         number
  lng?:         number
  kmRadius?:    number
  categoryId?:  string
  subCategory?: string
  minPrice?:    number
  maxPrice?:    number
  minMoq?:      number
  verified?:    boolean
  topRated?:    boolean
  inStock?:     boolean
  fastResponse?: boolean
  sellerType?:  'manufacturer' | 'wholesaler' | 'distributor' | 'service_provider'
  sortBy?:      'relevance' | 'distance' | 'rating' | 'price_asc' | 'price_desc' | 'newest'
  page?:        number
  limit?:       number
}

export interface DiscoveryResult {
  id:           string
  type:         EntityType
  name:         string
  slug:         string
  images:       string[]
  description?: string
  categoryName: string
  subCategory?: string
  isVerified:   boolean
  trustScore:   number
  rating:       number
  reviewCount:  number
  responseTime: string
  distanceKm?:  number
  geoLabel?:    string
  geoRing:      number
  city:         string
  state:        string
  seller: {
    id:           string
    name:         string
    slug?:        string
    isVerified:   boolean
    trustScore:   number
    isTradgoElite?: boolean
  }
  price?:           number
  originalPrice?:   number
  unit?:            string
  moq?:             number
  inStock?:         boolean
  stockQty?:        number
  priceSlabs?:      { minQty:number; maxQty:number|null; price:number }[]
  deliveryEta?:     string
  gocashEarn?:      number
  serviceType?:     string
  experience?:      string
  pricingModel?:    'fixed' | 'hourly' | 'project' | 'monthly'
  coverageArea?:    string
  availability?:    string
}

export interface DiscoveryResponse {
  results:     DiscoveryResult[]
  total:       number
  page:        number
  pages:       number
  geoBreakdown: { ring: number; label: string; count: number }[]
  meta: {
    query:       string
    language:    string
    intent?:     string
    corrected?:  string
    fromCache:   boolean
    responseMs:  number
  }
}

export interface AISearchResult {
  answer:      string
  confidence:  number
  suggestions: DiscoveryResult[]
  followUp:    string[]
}
