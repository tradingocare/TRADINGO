export interface PersonalInfoForm {
  firstName: string
  lastName: string
  email: string
  mobile: string
  password: string
  confirmPassword: string
  emailVerified?: boolean
  mobileVerified?: boolean
}

export interface CompanyProfileForm {
  companyName: string
  registrationNumber?: string

  companyType: 'individual' | 'partnership' | 'private_limited' | 'llp' | 'public_limited'

  yearEstablished: string

  designation: string
  industry: string
  companySize: string
  annualProcurement: string

  gstNumber?: string
  panNumber?: string
  website?: string
  description?: string
  logo?: File | null
}

export interface BusinessAddressForm {
  addressLine1: string
  addressLine2?: string
  city: string
  district: string
  state: string
  pincode: string
}

export interface BuyerPreferencesForm {
  primaryCategories: string[]
  preferredSuppliers: 'local' | 'state' | 'pan_india' | 'global'
  notificationEmail: boolean
  notificationSms: boolean
  newsletter: boolean
}

export interface BuyerConfirmationForm {
  agreedToTerms: boolean
  agreedToPrivacyPolicy: boolean
}

export interface BuyerRegistrationState {
  step: number
  personalInfo: Partial<PersonalInfoForm>
  companyProfile: Partial<CompanyProfileForm>
  businessAddress: Partial<BusinessAddressForm>
  preferences: Partial<BuyerPreferencesForm>
  confirmation: Partial<BuyerConfirmationForm>
  completedSteps: number[]
}