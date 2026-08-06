export interface Qualification {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  price: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  url: string;
}

export type VerificationStatus =
  | 'pending'
  | 'documents_submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'needs_resubmission'
  | 'suspended'
  | 'expired';

export interface VerificationData {
  status: VerificationStatus;
  submittedAt: string;
  estimatedReviewDays: number;
  slug: string;
  categorySlug: string;
}

export interface RegistrationData {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  professionalTitle: string;
  bio: string;
  yearsOfExperience: string;
  qualifications: Qualification[];
  certifications: Certification[];
  languages: string[];
  category: string;
  services: ServiceOffering[];
  pricingModel: 'hourly' | 'fixed' | 'project' | '';
  priceMin: string;
  priceMax: string;
  projects: Project[];
  identityDocName: string;
  qualificationDocNames: string[];
  otherDocNames: string[];
  plan: 'individual' | 'company' | '';
  agreedToTerms: boolean;
}

export const EMPTY_REGISTRATION: RegistrationData = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  professionalTitle: '',
  bio: '',
  yearsOfExperience: '',
  qualifications: [],
  certifications: [],
  languages: [],
  category: '',
  services: [],
  pricingModel: '',
  priceMin: '',
  priceMax: '',
  projects: [],
  identityDocName: '',
  qualificationDocNames: [],
  otherDocNames: [],
  plan: '',
  agreedToTerms: false,
};

export const STEPS = [
  { id: 1, title: 'Basic Information', key: 'basic' },
  { id: 2, title: 'Professional Info', key: 'professional' },
  { id: 3, title: 'Services', key: 'services' },
  { id: 4, title: 'Portfolio', key: 'portfolio' },
  { id: 5, title: 'Documents', key: 'documents' },
  { id: 6, title: 'Membership', key: 'membership' },
  { id: 7, title: 'Review & Submit', key: 'review' },
] as const;

export const DRAFT_KEY = 'tradeserv-registration-draft';
export const VERIFICATION_KEY = 'tradeserv-verification';

export const CATEGORIES = [
  'Chartered Accountant',
  'GST Consultant',
  'Company Secretary',
  'Trademark Consultant',
  'Legal Advisor',
  'Business Consultant',
  'Brand Consultant',
  'Export Consultant',
  'Product Photographer',
  'Packaging Designer',
];

export const LANGUAGES = [
  'English', 'Hindi', 'Hinglish', 'Tamil', 'Telugu',
  'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali',
  'Punjabi', 'Urdu', 'Arabic', 'French',
];

export const PRICING_MODELS = [
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'project', label: 'Project Based' },
];

export const PLANS = [
  {
    value: 'individual' as const,
    title: 'Individual Professional',
    price: '₹2,499',
    period: '/year',
    description: 'For solo consultants, freelancers, and independent professionals.',
    features: [
      'Professional profile with portfolio',
      'TRADTRUST verification badge',
      'AI-powered discovery visibility',
      'Secure communication via TRADCONNECT',
      'GOCASH rewards on engagements',
      'Basic analytics dashboard',
      'Email support',
    ],
  },
  {
    value: 'company' as const,
    title: 'Company / Agency',
    price: '₹5,999',
    period: '/year',
    description: 'For firms, agencies, and multi-member professional practices.',
    features: [
      'Everything in Individual plan',
      'Multi-team member profiles',
      'Priority AI matching',
      'Enhanced search visibility',
      'Lead management dashboard',
      'CRM integration',
      'Priority support',
    ],
  },
];

export const PLAN_FEATURES_COMPARISON = [
  { feature: 'Professional profile with portfolio', individual: true, company: true },
  { feature: 'TRADTRUST verification badge', individual: true, company: true },
  { feature: 'AI-powered discovery visibility', individual: true, company: true },
  { feature: 'Secure communication via TRADCONNECT', individual: true, company: true },
  { feature: 'GOCASH rewards on engagements', individual: true, company: true },
  { feature: 'Email support', individual: true, company: true },
  { feature: 'Multi-team member profiles', individual: false, company: true },
  { feature: 'Priority AI matching', individual: false, company: true },
  { feature: 'Enhanced search visibility', individual: false, company: true },
  { feature: 'Lead management dashboard', individual: false, company: true },
  { feature: 'CRM integration', individual: false, company: true },
  { feature: 'Basic analytics dashboard', individual: true, company: false },
  { feature: 'Priority support', individual: false, company: true },
];

export const VERIFICATION_STATES: { value: VerificationStatus; label: string; description: string }[] = [
  { value: 'pending', label: 'Pending', description: 'Awaiting document submission' },
  { value: 'documents_submitted', label: 'Documents Submitted', description: 'Documents received, pending review' },
  { value: 'under_review', label: 'Under Review', description: 'Admin is reviewing your application' },
  { value: 'needs_resubmission', label: 'Needs Resubmission', description: 'Additional information required' },
  { value: 'approved', label: 'Approved', description: 'Verification complete — profile published' },
  { value: 'rejected', label: 'Rejected', description: 'Application did not meet requirements' },
  { value: 'suspended', label: 'Suspended', description: 'Profile temporarily disabled' },
  { value: 'expired', label: 'Expired', description: 'Membership has expired' },
];

export const VERIFICATION_TIMELINE = [
  { step: 1, label: 'Registration Completed', key: 'registered' },
  { step: 2, label: 'Membership Selected', key: 'membership' },
  { step: 3, label: 'Documents Submitted', key: 'documents' },
  { step: 4, label: 'Admin Review', key: 'admin_review' },
  { step: 5, label: 'TradTrust Review', key: 'tradtrust_review' },
  { step: 6, label: 'Approved', key: 'approved' },
  { step: 7, label: 'Public Profile Ready', key: 'published' },
];
