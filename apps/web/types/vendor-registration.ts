export interface BusinessIdentityForm {
  businessName: string
  tradeName?: string
  businessType: 'sole_proprietorship' | 'partnership' | 'private_limited' | 'llp' | 'public_limited' | 'huf' | 'trust' | 'other'
  sellerType: 'manufacturer' | 'wholesaler' | 'distributor' | 'retailer' | 'service_provider'
  yearEstablished: string
  totalEmployees: string
  annualTurnover: string
  website?: string
}

export interface ContactCredentialsForm {
  ownerName: string
  designation: string
  email: string
  mobileNumber: string
  alternateMobile?: string
  password: string
  confirmPassword: string
  emailVerified?: boolean
  mobileVerified?: boolean
}

export interface PANForm {
  panNumber: string
  panHolderName: string
  dateOfBirth?: string
  panCardImage?: File | null
  panVerified?: boolean
}

export interface GSTForm {
  hasGst: boolean
  gstNumber?: string
  gstCertificateImage?: File | null
  gstBusinessName?: string
  gstAddress?: string
  gstState?: string
  gstVerified?: boolean
  gstExemptReason?: 'turnover_below_limit' | 'agriculture' | 'exempt_category' | 'new_business'
}

export interface BusinessProfileForm {
  description: string
  tagline?: string
  primaryCategory: string
  secondaryCategories: string[]
  productTypes: string
  moqRange: string
  supplyCapacity: string
  leadTime: string
  exportCapability: boolean
  exportCountries?: string
  addressLine1: string
  addressLine2?: string
  city: string
  district: string
  state: string
  pincode: string
  logo?: File | null
  bannerImage?: File | null
}

export interface BankDetailsForm {
  accountHolderName: string
  accountNumber: string
  confirmAccountNumber: string
  ifscCode: string
  bankName: string
  branchName: string
  accountType: 'current' | 'savings'
  cancelledChequeImage?: File | null
}

export interface PlanSelectionForm {
  planId: string
  agreedToTerms: boolean
  agreedToSellerPolicy: boolean
  agreedToPrivacyPolicy: boolean
  referralCode?: string
  rmCode?: string
}

export interface VendorRegistrationState {
  step: number
  businessIdentity: Partial<BusinessIdentityForm>
  contactCredentials: Partial<ContactCredentialsForm>
  pan: Partial<PANForm>
  gst: Partial<GSTForm>
  businessProfile: Partial<BusinessProfileForm>
  bankDetails: Partial<BankDetailsForm>
  planSelection: Partial<PlanSelectionForm>
  draftId?: string
  completedSteps: number[]
}
