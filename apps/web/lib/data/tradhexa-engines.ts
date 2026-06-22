import { Search, GitCompare, FileText, MessageSquare, ShieldCheck, CreditCard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface EngineData {
  id: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  description: string;
  purpose: string;
  features: string[];
  buyerBenefits: string[];
  sellerBenefits: string[];
  useCases: string[];
  faqs: { q: string; a: string }[];
  color: string;
  gradient: string;
  href: string;
}

export const engines: EngineData[] = [
  {
    id: 'tradfind',
    name: 'TRADFIND',
    tagline: 'Smart Discovery Engine',
    icon: Search,
    description: 'Product and business discovery powered by AI. Find exactly what you need across millions of listings, categories, and suppliers.',
    purpose: 'TRADFIND is the discovery layer of the TRADINGO ecosystem. It uses AI-powered search, category browsing, location-based discovery, and smart recommendations to help buyers find the right products and sellers find the right audience.',
    features: [
      'AI Search with natural language understanding',
      'Category-based browsing across 1,200+ categories',
      'Near Me location-based discovery',
      'Industry-specific search filters',
      'State and region-based filtering',
      'Smart Recommendations based on browsing history',
      'Visual product search',
      'Saved searches and alerts',
    ],
    buyerBenefits: [
      'Find products 3x faster with AI-powered search',
      'Discover sellers near your location',
      'Get personalized product recommendations',
      'Access hard-to-find categories and products',
    ],
    sellerBenefits: [
      'Increase product visibility to targeted buyers',
      'Get discovered by buyers searching for your niche',
      'Appear in location-based and industry-specific searches',
      'Reach high-intent buyers actively looking for your products',
    ],
    useCases: [
      'A manufacturer in Gujarat searching for raw chemical suppliers',
      'A retailer in Delhi looking for FMCG distributors',
      'A startup founder discovering packaging material vendors',
    ],
    faqs: [
      { q: 'How does AI Search work?', a: 'Our AI engine understands natural language queries and context, delivering relevant results even with partial or vague search terms.' },
      { q: 'Can I search by location?', a: 'Yes, the Near Me feature lets you find sellers and products in your city, state, or region.' },
      { q: 'How are recommendations generated?', a: 'Recommendations are based on your browsing history, past purchases, and trending products in your industry.' },
    ],
    color: '#D4AF37',
    gradient: 'from-[#D4AF37] to-[#F5E6A3]',
    href: '/tradhexa/tradfind',
  },
  {
    id: 'tradmatch',
    name: 'TRADMATCH',
    tagline: 'AI Matchmaking Engine',
    icon: GitCompare,
    description: 'Automatically connects buyers with the right sellers using intelligent matching, trust scores, and intent detection.',
    purpose: 'TRADMATCH is the intelligent matchmaking layer that automatically connects buyers and sellers based on product compatibility, location proximity, trust scores, and trading intent.',
    features: [
      'AI-powered buyer-seller recommendations',
      'Smart Matching based on product and category affinity',
      'Location-based matching for logistics efficiency',
      'Trust Score integration for quality matches',
      'Intent Detection to identify serious buyers',
      'Automated lead distribution to relevant sellers',
      'Match quality scoring and feedback loop',
    ],
    buyerBenefits: [
      'Get matched with verified, high-quality sellers',
      'Receive relevant product suggestions automatically',
      'Save time searching for the right trading partners',
      'Higher match accuracy over time with AI learning',
    ],
    sellerBenefits: [
      'Receive qualified, high-intent buyer leads',
      'Higher conversion rates from smart-matched prospects',
      'Reduced effort in finding the right buyers',
      'Priority matching for high Trust Score sellers',
    ],
    useCases: [
      'A buyer looking for specific industrial valves gets matched with precision manufacturers',
      'A FMCG distributor receives automated buyer leads from nearby retailers',
      'An exporter gets connected with international buyers seeking their products',
    ],
    faqs: [
      { q: 'How does TRADMATCH know what to recommend?', a: 'It analyzes product categories, past trades, buyer behavior, seller performance, and location data to find the best matches.' },
      { q: 'Can I control who I get matched with?', a: 'Yes, you can set preferences for match criteria including location, trust score minimums, and industry verticals.' },
      { q: 'How accurate are the matches?', a: 'Match accuracy improves over time as the AI learns from your interactions, feedback, and completed trades.' },
    ],
    color: '#60A5FA',
    gradient: 'from-[#60A5FA] to-[#93C5FD]',
    href: '/tradhexa/tradmatch',
  },
  {
    id: 'tradrfq',
    name: 'TRADRFQ',
    tagline: 'Smart RFQ & Negotiation Engine',
    icon: FileText,
    description: 'Post requirements, receive competitive quotes, compare bids, and negotiate with multiple sellers in real-time.',
    purpose: 'TRADRFQ streamlines the request-for-quote process. Buyers post their requirements once, and multiple verified sellers compete to offer the best price and terms — all within a transparent, auditable system.',
    features: [
      'One-click RFQ creation with smart templates',
      'Automated quote comparison across sellers',
      'Multi-seller counter-offer negotiation',
      'AI-powered price suggestions and market insights',
      'Batch RFQ posting for bulk procurement',
      'Real-time quote status tracking',
      'Historical pricing data and analytics',
    ],
    buyerBenefits: [
      'Get competitive pricing from multiple sellers',
      'Save time with one-to-many requirement posting',
      'Transparent comparison of quotes side-by-side',
      'Better negotiation leverage with counter-offers',
    ],
    sellerBenefits: [
      'Access buyers with active, verified requirements',
      'Respond to RFQs matching your product catalog',
      'Win more business with competitive quoting',
      'Build relationships with repeat buyers',
    ],
    useCases: [
      'A procurement manager posting a bulk steel requirement gets 12 competitive quotes',
      'A restaurant chain sources kitchen equipment across multiple suppliers via RFQ',
      'An exporter finds the best logistics partner through competitive bidding',
    ],
    faqs: [
      { q: 'How many sellers can respond to my RFQ?', a: 'There is no limit. Your RFQ is visible to all relevant verified sellers in the category, ensuring maximum competition.' },
      { q: 'Can I negotiate after receiving quotes?', a: 'Yes, you can send counter-offers to specific sellers and negotiate terms including price, quantity, and delivery timelines.' },
      { q: 'Are the quotes binding?', a: 'Quotes submitted by sellers are binding offers. Once accepted, they convert into protected orders through TRADZERO.' },
    ],
    color: '#A78BFA',
    gradient: 'from-[#A78BFA] to-[#C4B5FD]',
    href: '/tradhexa/tradrfq',
  },
  {
    id: 'tradconnect',
    name: 'TRADCONNECT',
    tagline: 'Communication Engine',
    icon: MessageSquare,
    description: 'Seamless business communication with integrated chat, voice, video calls, document sharing, and smart notifications.',
    purpose: 'TRADCONNECT is the communication backbone of the TRADINGO ecosystem. It enables buyers and sellers to negotiate, share documents, and build relationships through a unified messaging platform.',
    features: [
      'Real-time business chat with typing indicators',
      'Voice and video calling for face-to-face negotiations',
      'Secure document and file sharing',
      'Smart notifications for quotes, orders, and updates',
      'Message threading for organized conversations',
      'Read receipts and delivery confirmation',
      'Conversation history and search',
    ],
    buyerBenefits: [
      'Communicate directly with sellers without switching apps',
      'Share requirement documents securely',
      'Get instant notifications on quote updates and counter-offers',
      'Build relationships through direct, personal communication',
    ],
    sellerBenefits: [
      'Respond to buyer inquiries instantly',
      'Share product catalogs and samples via chat',
      'Close deals faster with real-time negotiation',
      'Maintain organized communication history per buyer',
    ],
    useCases: [
      'A buyer and seller negotiate pricing details via video call within the platform',
      'A distributor shares a product catalog PDF directly in chat with a retailer',
      'An exporter receives real-time updates on order status and shipping documents',
    ],
    faqs: [
      { q: 'Is my communication private?', a: 'Yes, all communications are encrypted and private between the trading parties. TRADINGO does not access your messages.' },
      { q: 'Can I share files and documents?', a: 'Yes, you can share PDFs, images, spreadsheets, and other business documents securely within the chat.' },
      { q: 'Do I need to install additional software?', a: 'No, everything works within the TRADINGO platform — no external tools or downloads required.' },
    ],
    color: '#34D399',
    gradient: 'from-[#34D399] to-[#6EE7B7]',
    href: '/tradhexa/tradconnect',
  },
  {
    id: 'tradtrust',
    name: 'TRADTRUST',
    tagline: 'Trust & Verification Engine',
    icon: ShieldCheck,
    description: 'Build trust with verified KYC, GST, PAN checks, ratings, reviews, badges, and a comprehensive Trust Score system.',
    purpose: 'TRADTRUST is the verification and reputation layer that ensures every business on TRADINGO is authenticated, rated, and trustworthy. It eliminates fraudulent listings and builds confidence in every transaction.',
    features: [
      '5-layer KYC verification for all businesses',
      'GST and PAN verification against government databases',
      'Business ratings and reviews system',
      'Performance badges for reliability and quality',
      'Comprehensive Trust Score algorithm',
      'Verified business seals and certifications',
      'Dispute resolution history transparency',
    ],
    buyerBenefits: [
      'Trade only with verified, authenticated businesses',
      'See seller ratings and reviews before purchasing',
      'Make informed decisions with Trust Scores',
      'Reduced risk of fraud and counterfeit products',
    ],
    sellerBenefits: [
      'Build credibility with verified business badges',
      'Earn higher Trust Scores through quality trades',
      'Stand out from unverified competitors',
      'Attract more buyers with verified status',
    ],
    useCases: [
      'A buyer checks a seller\'s Trust Score and GST verification before placing a large order',
      'A manufacturer displays their 5-layer KYC badge to attract premium buyers',
      'An exporter verifies their international buyer\'s credentials before shipping',
    ],
    faqs: [
      { q: 'What documents are required for verification?', a: 'Business registration, GST certificate, PAN card, address proof, and authorized signatory identification.' },
      { q: 'How is the Trust Score calculated?', a: 'Trust Score considers verification status, trade history, order completion rate, dispute record, ratings, and account longevity.' },
      { q: 'Can I see who viewed my profile?', a: 'Yes, verified sellers can see profile views, buyer interest, and engagement analytics.' },
    ],
    color: '#F472B6',
    gradient: 'from-[#F472B6] to-[#F9A8D4]',
    href: '/tradhexa/tradtrust',
  },
  {
    id: 'tradzero',
    name: 'TRADZERO',
    tagline: 'Zero-Risk Transaction Engine',
    icon: CreditCard,
    description: 'Secure every transaction with escrow protection, milestone payments, dispute management, and a full refund system.',
    purpose: 'TRADZERO is the financial safety layer that makes every transaction risk-free. Funds are held in escrow, released only upon satisfaction, and disputes are resolved fairly — ensuring zero-risk trading for both parties.',
    features: [
      'Escrow-protected payment for every transaction',
      'Milestone-based payment release for large orders',
      'Structured dispute management and resolution',
      'Automated refund system for failed deliveries',
      'Protected order status tracking',
      'Multi-currency transaction support',
      'Transaction insurance for high-value trades',
    ],
    buyerBenefits: [
      'Pay with confidence — funds released only on satisfaction',
      'Get full refund protection for failed deliveries',
      'Milestone payments for large or complex orders',
      'No financial risk in any transaction',
    ],
    sellerBenefits: [
      'Guaranteed payment upon successful delivery',
      'Protection against fraudulent chargebacks',
      'Professional dispute resolution for fair outcomes',
      'Build trust with escrow-backed transactions',
    ],
    useCases: [
      'A buyer places a $50,000 order knowing funds are secure in escrow',
      'A seller ships goods confidently with guaranteed payment release',
      'A dispute over product quality is resolved through structured mediation',
    ],
    faqs: [
      { q: 'How does the escrow system work?', a: 'Buyer pays into escrow, seller ships goods, buyer confirms satisfaction, funds are released to seller. Simple and secure.' },
      { q: 'What happens if there is a dispute?', a: 'Our resolution team reviews evidence from both parties and makes a fair determination. Funds remain in escrow until resolved.' },
      { q: 'Are there any fees for escrow protection?', a: 'Escrow protection is included free for all transactions on TRADINGO. No additional fees.' },
    ],
    color: '#FBBF24',
    gradient: 'from-[#FBBF24] to-[#FCD34D]',
    href: '/tradhexa/tradzero',
  },
];
