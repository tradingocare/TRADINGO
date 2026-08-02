'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Award,
  Star,
  Download,
  FileText,
  PackageCheck,
  Truck,
  RotateCcw,
  Shield,
  MessageSquare,
  PhoneCall,
  Heart,
  Share2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
  Info,
  Layers,
  Cpu,
  Gauge,
  Sliders,
  Check,
  ChevronLeft,
  Eye,
  ShoppingCart,
  BadgePercent,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  FileSpreadsheet,
  FileArchive,
  Maximize2
} from 'lucide-react'

// Sample High-Res Images for Gallery
const GALLERY_IMAGES = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    alt: 'CNC Machine Main Front View',
    label: 'Front Overview'
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80',
    alt: 'Spindle & Tool Changer Close-up',
    label: 'Spindle & ATC'
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
    alt: 'Fanuc CNC Control Panel',
    label: 'Control Console'
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    alt: 'Precision Worktable & Axis Guides',
    label: 'Worktable'
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80',
    alt: 'Heavy Cast Iron Enclosure',
    label: 'Enclosure'
  }
]

// Demo Products List (matches wireframe: Demo 1 VMC-850, Demo 2 L-2000, Demo 3 VMC-1100)
const DEMO_PRODUCTS = [
  {
    id: 'vmc-850',
    title: 'CNC Milling Machine VMC-850',
    model: 'VMC-850-STD',
    hsn: '84571010',
    categoryShort: 'Industrial Machinery • CNC Machines',
    breadcrumbLabel: 'CNC Milling Machine VMC-850',
    seriesTag: 'High Precision Machining Series',
    price: 1850000,
    mrp: 2875000,
    discount: '-36% OFF',
    savings: '₹10,25,000',
    gocashRate: 0.10,
    weightTons: 5.2,
    moq: '1 Unit',
    delivery: '5 – 12 Business Days',
    aiScore: 4.7,
    aiLabel: 'Highly Recommended',
    aiInsight: 'Top 1% Precision Machine for Heavy Industrial Component Production in Western Region.',
    overviewTitle: 'Machine Engineering Highlights',
    overview: `The <strong>TRADINGO ${'VMC-850'}</strong> Vertical Machining Center is specifically engineered for high-rigidity heavy milling, high-speed drilling, and micro-precision tapping operations required in aerospace, automotive die-mold, and precision machinery manufacturing.`,
    highlights: [
      { title: 'High-Rigidity Casting Structure', desc: 'Meehanite cast iron structure normalized to eliminate internal stress.' },
      { title: 'Direct Drive BT-40 Spindle', desc: 'Delivers up to 8000 RPM continuous speed with zero-vibration bearing cooling.' },
      { title: '24-Tool Fast ATC Arm', desc: '1.8-second tool-to-tool change time for optimized cycle time reduction.' },
      { title: 'Automated Central Lubrication', desc: 'Programmable metering pumps ensure continuous oil film on all guideways.' }
    ],
    specs: [
      { label: 'Worktable Size', value: '1000 x 500 mm' },
      { label: 'X/Y/Z Axis Travel', value: '850 / 500 / 550 mm' },
      { label: 'Spindle Speed Range', value: '8000 RPM (Optional 10000/12000)' },
      { label: 'Control System', value: 'Fanuc 0i-MF / Siemens 828D' },
      { label: 'Spindle Taper', value: 'BT-40' },
      { label: 'Max Workpiece Weight', value: '500 kg' },
      { label: 'Tool Capacity (ATC)', value: '24 Tools Arm Type' },
      { label: 'Positioning Accuracy', value: '±0.005 mm' },
      { label: 'Repeatability Accuracy', value: '±0.003 mm' },
      { label: 'Rapid Traverse (X/Y/Z)', value: '36 / 36 / 24 m/min' },
      { label: 'Spindle Motor Power', value: '7.5 kW / 11 kW Peak' },
      { label: 'Machine Gross Weight', value: '5,200 kg' }
    ],
    seller: {
      name: 'Precision Machining Tools Ltd.',
      initials: 'PMT',
      location: 'Rajkot, Gujarat',
      distance: '296 km away',
      rating: 4.8,
      experience: '14+ Yrs in Business',
      onTime: '98.5%',
      onTimeDesc: 'Tested across 450+ dispatches',
      responseRate: '100%',
      responseDesc: 'Avg response time: < 15 mins',
      buyers: '2.9K+',
      buyersDesc: 'Active engineering clients'
    },
    downloads: [
      { id: 'brochure', name: `${'VMC-850'} Official Product Brochure`, meta: 'PDF Document • 4.2 MB • Updated July 2026', icon: FileText, iconBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
      { id: 'specs', name: 'Full Technical Specification & Layout Sheet', meta: 'PDF Document • 1.8 MB • Foundation & Power Specs', icon: FileSpreadsheet, iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
      { id: 'media', name: 'High-Resolution CAD Models & Component Photos', meta: 'ZIP Archive • 28.5 MB • STEP Files & 4K Images', icon: FileArchive, iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' }
    ]
  },
  {
    id: 'lathe-hd',
    title: 'Heavy Duty CNC Lathe Machine L-2000',
    model: 'L-2000-HD',
    hsn: '84581100',
    categoryShort: 'Industrial Machinery • CNC Lathes',
    breadcrumbLabel: 'Heavy Duty CNC Lathe L-2000',
    seriesTag: 'Heavy Turning Series',
    price: 1240000,
    mrp: 1900000,
    discount: '-34% OFF',
    savings: '₹6,60,000',
    gocashRate: 0.10,
    weightTons: 4.5,
    moq: '1 Unit',
    delivery: '6 – 14 Business Days',
    aiScore: 4.5,
    aiLabel: 'Highly Recommended',
    aiInsight: 'Preferred heavy-duty lathe for large-diameter shaft and flange turning in Western Region.',
    overviewTitle: 'Machine Engineering Highlights',
    overview: `The <strong>TRADINGO L-2000</strong> Heavy Duty CNC Lathe is built for large-diameter shaft turning, flange facing, and high-torque heavy machining in oil & gas, automotive, and general engineering workshops.`,
    highlights: [
      { title: 'High-Torque Spindle Headstock', desc: 'Gear-driven headstock delivers constant torque for heavy interrupted cuts.' },
      { title: 'Box-Way Hardened Guideways', desc: 'Hand-scraped box ways provide superior vibration damping and rigidity.' },
      { title: '16-Tool Turret Indexing', desc: 'Fast bidirectional turret with 0.4s index time for quick tool changes.' },
      { title: 'Full Enclosure Safety Guard', desc: 'Coolant-tight guarding with interlocked door for operator safety.' }
    ],
    specs: [
      { label: 'Worktable Size', value: '800 x 400 mm' },
      { label: 'X/Y/Z Axis Travel', value: '600 / 400 / 450 mm' },
      { label: 'Spindle Speed Range', value: '6000 RPM (Optional 8000)' },
      { label: 'Control System', value: 'Siemens 808D' },
      { label: 'Spindle Taper', value: 'BT-40' },
      { label: 'Max Workpiece Weight', value: '350 kg' },
      { label: 'Tool Capacity (ATC)', value: '16 Tools Turret' },
      { label: 'Positioning Accuracy', value: '±0.01 mm' },
      { label: 'Repeatability Accuracy', value: '±0.005 mm' },
      { label: 'Rapid Traverse (X/Y/Z)', value: '24 / 24 / 16 m/min' },
      { label: 'Spindle Motor Power', value: '9 kW / 12 kW Peak' },
      { label: 'Machine Gross Weight', value: '4,500 kg' }
    ],
    seller: {
      name: 'Rajkot CNC Solutions',
      initials: 'RCS',
      location: 'Rajkot, Gujarat',
      distance: '290 km away',
      rating: 4.6,
      experience: '10+ Yrs in Business',
      onTime: '96.8%',
      onTimeDesc: 'Tested across 320+ dispatches',
      responseRate: '98%',
      responseDesc: 'Avg response time: < 30 mins',
      buyers: '1.8K+',
      buyersDesc: 'Active industrial clients'
    },
    downloads: [
      { id: 'brochure', name: `${'L-2000'} Official Product Brochure`, meta: 'PDF Document • 3.8 MB • Updated June 2026', icon: FileText, iconBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
      { id: 'specs', name: 'Full Technical Specification & Layout Sheet', meta: 'PDF Document • 1.6 MB • Foundation & Power Specs', icon: FileSpreadsheet, iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
      { id: 'media', name: 'High-Resolution CAD Models & Component Photos', meta: 'ZIP Archive • 24.0 MB • STEP Files & 4K Images', icon: FileArchive, iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' }
    ]
  },
  {
    id: 'vmc-1100',
    title: 'Vertical Machining Center VMC-1100 Heavy Duty',
    model: 'VMC-1100-HD',
    hsn: '84571020',
    categoryShort: 'Industrial Machinery • Machining Centers',
    breadcrumbLabel: 'VMC-1100 High Precision',
    seriesTag: 'High Precision Heavy Machining Series',
    price: 2400000,
    mrp: 3500000,
    discount: '-31% OFF',
    savings: '₹11,00,000',
    gocashRate: 0.10,
    weightTons: 7.8,
    moq: '1 Unit',
    delivery: '7 – 15 Business Days',
    aiScore: 4.8,
    aiLabel: 'Highly Recommended',
    aiInsight: 'Large-format machining center with best-in-class rigidity for aerospace and die-mold production.',
    overviewTitle: 'Machine Engineering Highlights',
    overview: `The <strong>TRADINGO VMC-1100</strong> Heavy Duty Vertical Machining Center delivers large work envelope machining with high rigidity for aerospace structural parts, large die-mold cavities, and heavy fabrication components.`,
    highlights: [
      { title: 'Extra-Wide 1200 x 600 Table', desc: 'Handles large fixtures and heavy workpieces up to 800 kg.' },
      { title: '15 kW High-Torque Spindle', desc: '10000 RPM spindle with direct drive and thermal compensation.' },
      { title: '24-Tool Fast ATC Arm', desc: '1.6-second tool-to-tool change for reduced cycle time.' },
      { title: 'Box-Way Guideway System', desc: 'Heavy-duty box ways with automatic lubrication for long-term accuracy.' }
    ],
    specs: [
      { label: 'Worktable Size', value: '1200 x 600 mm' },
      { label: 'X/Y/Z Axis Travel', value: '1100 / 600 / 600 mm' },
      { label: 'Spindle Speed Range', value: '10000 RPM (Optional 12000)' },
      { label: 'Control System', value: 'Fanuc 0i-MF' },
      { label: 'Spindle Taper', value: 'BT-40' },
      { label: 'Max Workpiece Weight', value: '800 kg' },
      { label: 'Tool Capacity (ATC)', value: '24 Tools Arm Type' },
      { label: 'Positioning Accuracy', value: '±0.004 mm' },
      { label: 'Repeatability Accuracy', value: '±0.002 mm' },
      { label: 'Rapid Traverse (X/Y/Z)', value: '48 / 48 / 36 m/min' },
      { label: 'Spindle Motor Power', value: '15 kW / 18.5 kW Peak' },
      { label: 'Machine Gross Weight', value: '7,800 kg' }
    ],
    seller: {
      name: 'Gujarat Machine Works',
      initials: 'GMW',
      location: 'Vadodara, Gujarat',
      distance: '410 km away',
      rating: 4.9,
      experience: '18+ Yrs in Business',
      onTime: '99.1%',
      onTimeDesc: 'Tested across 680+ dispatches',
      responseRate: '100%',
      responseDesc: 'Avg response time: < 10 mins',
      buyers: '3.6K+',
      buyersDesc: 'Active aerospace & auto clients'
    },
    downloads: [
      { id: 'brochure', name: `${'VMC-1100'} Official Product Brochure`, meta: 'PDF Document • 5.1 MB • Updated July 2026', icon: FileText, iconBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
      { id: 'specs', name: 'Full Technical Specification & Layout Sheet', meta: 'PDF Document • 2.2 MB • Foundation & Power Specs', icon: FileSpreadsheet, iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
      { id: 'media', name: 'High-Resolution CAD Models & Component Photos', meta: 'ZIP Archive • 32.0 MB • STEP Files & 4K Images', icon: FileArchive, iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' }
    ]
  }
]

export default function ProductDetailPage() {
  const [selectedDemo, setSelectedDemo] = useState(0)
  const product = DEMO_PRODUCTS[selectedDemo]
  const router = useRouter()

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState<'specs' | 'overview' | 'downloads'>('specs')
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    setSelectedImage(0)
    setQuantity(1)
    setIsWishlisted(false)
    setActiveTab('specs')
    setCopiedLink(false)
  }, [selectedDemo])

  const unitPrice = product.price
  const mrpPrice = product.mrp
  const gocashEarnRate = product.gocashRate
  const totalAmount = unitPrice * quantity
  const totalSavings = (mrpPrice - unitPrice) * quantity
  const gocashReward = Math.round(totalAmount * gocashEarnRate)

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const handleSellerClick = () => {
    router.push(`/companies?company=${encodeURIComponent(product.seller.name)}`)
  }

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 pb-20">

      {/* Top Banner Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* DEMO SELECTOR BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl mb-6 gap-3">
          <div className="text-xs md:text-sm text-slate-400 font-medium">
            Select Product Demo:
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {DEMO_PRODUCTS.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setSelectedDemo(idx)}
                className={`px-3.5 py-2 text-xs rounded-lg font-semibold transition-all border ${
                  selectedDemo === idx
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Demo {idx + 1}
                <span className="ml-1.5 hidden lg:inline text-[10px] font-normal opacity-80">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 1. BREADCRUMB & TITLE HEADER */}
        <nav className="flex items-center space-x-2 text-xs sm:text-sm text-slate-400 mb-4 overflow-x-auto pb-1 scrollbar-none">
          <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          <Link href="/categories" className="hover:text-emerald-400 transition-colors">Machinery</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          <Link href="/categories" className="hover:text-emerald-400 transition-colors">CNC Machines</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          <span className="text-slate-200 font-medium truncate">{product.breadcrumbLabel}</span>
        </nav>

        {/* Title Header with Badges & Quick Controls */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 mb-8 backdrop-blur-md shadow-2xl shadow-slate-950/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                {/* Verified Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Seller
                </span>

                {/* Elite Supplier Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Elite Supplier
                </span>

                {/* TRADEXA Score Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  TRADEXA® Score {product.aiScore} <span className="text-slate-400 font-normal">(526 reviews)</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {product.title}
              </h1>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>Model: {product.model}</span>
                <span>•</span>
                <span>HSN Code: {product.hsn}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {product.seriesTag}
                </span>
              </p>
            </div>

            {/* Quick Share & Wishlist */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  isWishlisted
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-400 text-rose-400' : ''}`} />
                <span>{isWishlisted ? 'Wishlisted' : 'Save'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium transition-all"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. MAIN PRODUCT GRID (TWO COLUMNS ON DESKTOP) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-7 space-y-8">

            {/* Interactive Image Gallery */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group">

              {/* Discount Tag */}
              <div className="absolute top-8 left-8 z-10">
                <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/30 uppercase tracking-wider">
                  <BadgePercent className="w-4 h-4" />
                  {product.discount}
                </span>
              </div>

              {/* Photos Counter Badge */}
              <div className="absolute top-8 right-8 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-950/80 text-slate-300 border border-slate-700/80 backdrop-blur-sm">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  +8 High-Res Photos
                </span>
              </div>

              {/* Main Image View */}
              <div className="relative h-72 sm:h-96 lg:h-[420px] w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800/80">
                <img
                  src={GALLERY_IMAGES[selectedImage].url}
                  alt={GALLERY_IMAGES[selectedImage].alt}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                />

                {/* Visual Overlay Shading */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-300 bg-slate-900/80 px-3.5 py-2 rounded-lg backdrop-blur-md border border-slate-800">
                  <span className="font-semibold text-emerald-400">{GALLERY_IMAGES[selectedImage].label}</span>
                  <span className="text-slate-400">Click thumbnails to inspect machine components</span>
                </div>
              </div>

              {/* Thumbnail Carousel */}
              <div className="grid grid-cols-5 gap-3 mt-4">
                {GALLERY_IMAGES.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative rounded-lg overflow-hidden h-16 sm:h-20 border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 scale-95 opacity-100'
                        : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                    }`}
                  >
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* AI Trust & Recommendation Widget */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      TRADINGO AI Trust Insights
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        VERIFIED DATA
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Calculated from 1,200+ operational transactions and machine telemetry logs</p>
                  </div>
                </div>

                {/* AI Score Badge */}
                <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-medium">AI Match Score</div>
                    <div className="text-xs font-bold text-emerald-400">{product.aiLabel}</div>
                  </div>
                  <div className="text-2xl font-black text-white px-3 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/40 text-emerald-400">
                    {product.aiScore}<span className="text-xs text-emerald-500 font-normal">/5</span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>On-Time Delivery</span>
                  </div>
                  <div className="text-xl font-bold text-white">{product.seller.onTime}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{product.seller.onTimeDesc}</div>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>Response Rate</span>
                  </div>
                  <div className="text-xl font-bold text-white">{product.seller.responseRate}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{product.seller.responseDesc}</div>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <PackageCheck className="w-4 h-4 text-orange-400" />
                    <span>Total Buyers</span>
                  </div>
                  <div className="text-xl font-bold text-white">{product.seller.buyers}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{product.seller.buyersDesc}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span>AI Insight: {product.aiInsight}</span>
              </div>
            </div>

            {/* Tabbed Content Navigation */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`px-6 py-4 text-sm font-bold transition-colors flex items-center gap-2 flex-shrink-0 ${
                    activeTab === 'specs'
                      ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  Technical Specifications
                </button>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 text-sm font-bold transition-colors flex items-center gap-2 flex-shrink-0 ${
                    activeTab === 'overview'
                      ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  Product Overview
                </button>
                <button
                  onClick={() => setActiveTab('downloads')}
                  className={`px-6 py-4 text-sm font-bold transition-colors flex items-center gap-2 flex-shrink-0 ${
                    activeTab === 'downloads'
                      ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Brochures & Specs (3)
                </button>
              </div>

              <div className="p-6">

                {/* Tab 1: Technical Specs Grid */}
                {activeTab === 'specs' && (
                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-emerald-400" />
                      Complete Mechanical & Electrical Specifications
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {product.specs.map((spec, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm"
                        >
                          <span className="text-slate-400 font-medium">{spec.label}</span>
                          <span className="text-slate-100 font-bold text-right">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 2: Overview */}
                {activeTab === 'overview' && (
                  <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                    <h4 className="text-base font-bold text-white mb-2">{product.overviewTitle}</h4>
                    <p dangerouslySetInnerHTML={{ __html: product.overview }} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {product.highlights.map((highlight, index) => (
                        <div key={index} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-white text-xs sm:text-sm">{highlight.title}</div>
                            <div className="text-xs text-slate-400">{highlight.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: Downloads */}
                {activeTab === 'downloads' && (
                  <div className="space-y-3">
                    <h4 className="text-base font-bold text-white mb-2">Technical Documentation & Media Pack</h4>

                    {product.downloads.map((doc) => (
                      <a
                        key={doc.id}
                        href="#download"
                        onClick={(e) => { e.preventDefault(); alert(`Downloading ${doc.name}...`) }}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${doc.iconBg}`}>
                            <doc.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{doc.name}</div>
                            <div className="text-xs text-slate-400">{doc.meta}</div>
                          </div>
                        </div>
                        <Download className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>


          {/* ================= RIGHT COLUMN (STICKY SIDEBAR) ================= */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">

            {/* PRICING & ORDER BOX */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-slate-950/80 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />

              {/* Offer Price */}
              <div className="mb-4">
                <div className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-2 flex-wrap">
                  <span>Special Wholesale Offer Price</span>
                  <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold text-[10px]">SAVE {product.savings}</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">/ unit</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>M.R.P.: <span className="line-through text-slate-500">₹{(mrpPrice * quantity).toLocaleString('en-IN')}</span></span>
                  <span className="text-slate-500">•</span>
                  <span>GST Extra (18%)</span>
                </div>
              </div>

              {/* GOCASH Reward Card */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl p-3.5 mb-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/20">
                  GC
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    +₹{gocashReward.toLocaleString('en-IN')} GOCASH Reward
                  </div>
                  <div className="text-[11px] text-slate-400">Credited instantly upon order delivery confirmation</div>
                </div>
              </div>

              {/* Interactive Quantity Selector */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 mb-6">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-2.5 font-medium gap-2 flex-wrap">
                  <span>Select Order Quantity</span>
                  <span className="text-emerald-400 font-semibold">Min Order (MOQ): {product.moq}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-700 rounded-xl bg-slate-900">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3.5 py-2 text-slate-300 hover:text-white font-bold hover:bg-slate-800 rounded-l-xl text-base transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-white font-extrabold text-sm min-w-[40px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3.5 py-2 text-slate-300 hover:text-white font-bold hover:bg-slate-800 rounded-r-xl text-base transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-xs text-slate-400">
                    <div>Estimated Machine Weight: <span className="text-white font-medium">{(product.weightTons * quantity).toFixed(1)} Tons</span></div>
                    <div>Freight Quote: <span className="text-emerald-400 font-medium">Calculated at Checkout</span></div>
                  </div>
                </div>
              </div>

              {/* Stock & Shipping Information Summary */}
              <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="text-slate-400 mb-1 flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Availability
                  </div>
                  <div className="font-bold text-emerald-400">In Stock ( Ready to Dispatch )</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="text-slate-400 mb-1 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    Estimated Delivery
                  </div>
                  <div className="font-bold text-white">{product.delivery}</div>
                </div>
              </div>

              {/* Call to Action Buttons */}
              <div className="space-y-3">

                {/* Primary Buy Button */}
                <button
                  onClick={() => alert(`Redirecting to TradePay Checkout for ${quantity} unit(s) of ${product.model}...`)}
                  className="w-full py-4 px-6 rounded-xl font-extrabold text-base bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Buy / Place Order Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Direct Chat & Request RFQ */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => router.push(`/companies?company=${encodeURIComponent(product.seller.name)}`)}
                    className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Chat with Seller</span>
                  </button>

                  <button
                    onClick={() => alert(`RFQ Request sent to ${product.seller.name}`)}
                    className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4 text-orange-400" />
                    <span>Request Call / RFQ</span>
                  </button>
                </div>
              </div>

              {/* SELLER SUMMARY CARD (Interactive — click to open company profile) */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">
                  Verified Selling Enterprise
                </div>

                <button
                  type="button"
                  onClick={handleSellerClick}
                  className="w-full flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition-all group cursor-pointer text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-emerald-400 text-lg flex-shrink-0 group-hover:border-emerald-500/50 transition-colors">
                    {product.seller.initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors truncate">
                        {product.seller.name}
                      </span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{product.seller.location} • <strong className="text-slate-300 font-medium">{product.seller.distance}</strong></span>
                    </div>

                    <div className="flex items-center gap-3 text-xs mt-2">
                      <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {product.seller.rating}★
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300 font-medium">{product.seller.experience}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all self-center flex-shrink-0" />
                </button>
              </div>

              {/* TRUST BADGES FOOTER */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <RotateCcw className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>7 Days Easy Return</strong> (Industrial Machine Replacement Policy)</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span><strong>1 Year Comprehensive Warranty</strong> (Parts & Spindle Cover)</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <LockIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span><strong>TradePay Secured Escrow</strong> (Payment Released After Delivery Inspection)</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
