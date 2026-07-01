export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SELLER' | 'BUYER' | 'ADMIN' | 'SUPER_ADMIN';
  phone?: string;
  isVerified: boolean;
  emailVerifiedAt?: string;
  verificationLevel?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  type: string;
  gst?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  status: 'active' | 'inactive' | 'suspended';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  unit: string;
  minOrder?: number;
  stock: number;
  images?: string[];
  status: 'active' | 'draft' | 'archived';
  trustScoreSnapshot?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Rfq {
  id: string;
  companyId: string;
  productName: string;
  description?: string;
  quantity: number;
  unit: string;
  budget?: number;
  city?: string;
  status: 'open' | 'quoted' | 'closed' | 'cancelled';
  responseCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  rfqId: string;
  sellerId: string;
  amount: number;
  deliveryDays?: number;
  validityDate: string;
  notes?: string;
  status: 'submitted' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  rfqId?: string;
  quoteId?: string;
  buyerId: string;
  sellerId: string;
  productName: string;
  quantity: number;
  unit: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'disputed';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partially_paid';
  escrowId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  fromId: string;
  toId: string;
  amount: number;
  type: 'ORDER_PAYMENT' | 'ESCROW_RELEASE' | 'REFUND' | 'GOCASH_EARNED' | 'GOCASH_REDEEMED';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  createdAt: string;
}

export interface Escrow {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: 'held' | 'released' | 'refunded' | 'disputed';
  createdAt: string;
  releasedAt?: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  raisedById: string;
  reason: string;
  description?: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: { userId: string; name: string; role: string }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
}

export interface GocashEntry {
  id: string;
  companyId: string;
  amount: number;
  type: 'earned' | 'spent' | 'redeemed';
  description: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export interface TradgoRace {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  participants: number;
  prize?: string;
}

export interface TradgoBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'rfq' | 'quote' | 'payment' | 'kyc' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  gmv: number;
  totalSellers: number;
  totalBuyers: number;
  rfqs: number;
  orders: number;
  disputes: number;
  payments: number;
  settlements: number;
  growth: { revenue: number; growthRate: number };
  period: { start: string; end: string };
}

export interface LeaderboardEntry {
  rank: number;
  companyId: string;
  companyName: string;
  slug: string;
  logo: string | null;
  trustScore: number | null;
  totalProducts: number | null;
  verificationLevel: string;
  score: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface KYCSubmission {
  id: string;
  companyId: string;
  company?: { id: string; name: string; slug: string };
  level: string;
  status: string;
  documents: { id: string; documentType: string; status: string }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewer?: { id: string; name: string };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: string[];
}
