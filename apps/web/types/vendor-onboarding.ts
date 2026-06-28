export interface CategoryNode {
  id:           string
  name:         string
  slug:         string
  icon?:        string
  description?: string
  productCount: number
  children?: CategoryNode[]
}

export interface SpecField {
  key:         string
  label:       string
  type:        'text'|'number'|'select'|'boolean'
  options?:    string[]
  required:    boolean
}

export interface VendorProduct {
  id?:           string
  productMasterId?: string
  name:          string
  description:   string
  price:         number
  originalPrice?: number
  unit:          string
  moq:           number
  maxOrderQty?:  number
  inStock:       boolean
  stockQty?:     number
  categoryId:    string
  subcategoryId: string
  images:        (File | string)[]
  priceSlabs:    PriceSlab[]
  specifications: { key:string; label:string; value:string }[]
  deliveryEta?:  string
  hsnCode?:      string
  gstRate?:      number
  tags:          string[]
  isBestseller?: boolean
}

export interface PriceSlab {
  minQty:  number
  maxQty:  number | null
  price:   number
}

export interface OnboardingState {
  completionScore: number
  sections: {
    basicInfo:        SectionState
    categories:       SectionState
    visuals:          SectionState
    aiImages:         SectionState
    catalog:          SectionState
    documents:        SectionState
    websiteAndSocial: SectionState
    products:         SectionState
    ratingsSetup:     SectionState
  }
}

export interface SectionState {
  completed:  boolean
  score:      number
  maxScore:   number
  lastSaved?: string
}

export interface SectionProps {
  vendor: any
  onSave: (data: { score: number }) => void
  onNext?: () => void
  onBack?: () => void
  totalScore?: number
  onGoLive?: () => void
}
