// ================================================================
// TRADINGO MASTER DATA — Single Source of Truth
// All pages, search, filters, sitemaps consume from here.
// ================================================================

// ─── CATEGORY DEFINITION ──────────────────────────────────────────
export interface MasterCategory {
  id: string
  slug: string
  name: string
  icon: string
  description: string
  subcategories: string[]
  type: 'product' | 'service' | 'both'
  seoKeywords: string[]
  featured: boolean
  popular: boolean
}

// ─── ALL CATEGORIES (Product + Service) ──────────────────────────
export const MASTER_CATEGORIES: MasterCategory[] = [
  {
    id: 'cat-industrial-machinery',    slug: 'industrial-machinery',
    name: 'Industrial Machinery',      icon: '\u2699\uFE0F',
    description: 'Heavy-duty machines, CNC equipment, presses, lathes, milling machines, and industrial automation systems for manufacturing.',
    subcategories: ['CNC Machines', 'Hydraulic Presses', 'Lathe Machines', 'Milling Machines', 'Industrial Robots', 'Packaging Machinery', 'Printing Machinery', 'Plastic Machinery', 'Woodworking Machinery', 'Food Processing Machinery'],
    type: 'product', seoKeywords: ['industrial machinery', 'CNC machines', 'hydraulic press', 'manufacturing equipment'],
    featured: true, popular: true,
  },
  {
    id: 'cat-electronics',             slug: 'electronics',
    name: 'Electronics & Electrical',  icon: '\u26A1',
    description: 'Electronic components, PCBs, semiconductors, consumer electronics, electrical panels, cables, and automation systems.',
    subcategories: ['Electronic Components', 'PCBs & Assemblies', 'Semiconductors', 'LEDs & Lighting', 'Cables & Wires', 'Switchgears', 'Transformers', 'Solar Products', 'Batteries', 'Home Appliances'],
    type: 'both', seoKeywords: ['electronics', 'electrical', 'components', 'PCB', 'semiconductor'],
    featured: true, popular: true,
  },
  {
    id: 'cat-chemicals',               slug: 'chemicals',
    name: 'Chemicals & Pharma',        icon: '\uD83D\uDD2C',
    description: 'Industrial chemicals, solvents, adhesives, pharmaceutical ingredients, laboratory reagents, and specialty chemical products.',
    subcategories: ['Industrial Chemicals', 'Pharmaceutical Intermediates', 'Laboratory Chemicals', 'Adhesives & Sealants', 'Paints & Coatings', 'Solvents', 'Fertilizers', 'Pesticides', 'Cleaning Agents', 'Water Treatment Chemicals'],
    type: 'both', seoKeywords: ['chemicals', 'pharma', 'industrial chemicals', 'solvents', 'adhesives'],
    featured: true, popular: true,
  },
  {
    id: 'cat-packaging',               slug: 'packaging',
    name: 'Packaging & Printing',      icon: '\uD83D\uDCE6',
    description: 'Packaging materials, corrugated boxes, flexible packaging, labels, printing services, and packaging machinery.',
    subcategories: ['Corrugated Boxes', 'Flexible Packaging', 'Rigid Packaging', 'Labels & Stickers', 'Bottles & Jars', 'Caps & Closures', 'Printing Services', 'Packaging Machinery', 'Shrink Wrap', 'Eco-Friendly Packaging'],
    type: 'both', seoKeywords: ['packaging', 'printing', 'boxes', 'labels', 'packaging machinery'],
    featured: true, popular: true,
  },
  {
    id: 'cat-construction',            slug: 'construction',
    name: 'Construction & Real Estate',icon: '\uD83C\uDFD7\uFE0F',
    description: 'Building materials, construction equipment, hardware, sanitaryware, tiles, real estate services, and interior solutions.',
    subcategories: ['Cement & Concrete', 'Steel & Metals', 'Tiles & Flooring', 'Sanitaryware', 'Paints & Coatings', 'Hardware Tools', 'Construction Equipment', 'Interior Materials', 'Roofing', 'Real Estate Services'],
    type: 'both', seoKeywords: ['construction', 'building materials', 'real estate', 'hardware', 'tiles'],
    featured: true, popular: true,
  },
  {
    id: 'cat-automotive',              slug: 'automotive',
    name: 'Automotive & Transport',    icon: '\uD83D\uDE97',
    description: 'Vehicle parts, auto components, lubricants, tires, batteries, service equipment, and transport services.',
    subcategories: ['Auto Parts', 'Tires & Tubes', 'Batteries', 'Lubricants & Oils', 'Vehicle Tools', 'Two-Wheeler Parts', 'Commercial Vehicles', 'EV Components', 'Auto Accessories', 'Transport Services'],
    type: 'both', seoKeywords: ['automotive', 'auto parts', 'vehicle', 'tires', 'lubricants'],
    featured: true, popular: true,
  },
  {
    id: 'cat-food-agro',               slug: 'food-agro',
    name: 'Food & Agriculture',        icon: '\uD83C\uDF31',
    description: 'Processed foods, beverages, agricultural produce, seeds, fertilizers, farm equipment, and food processing machinery.',
    subcategories: ['Grains & Pulses', 'Spices & Condiments', 'Beverages', 'Dairy Products', 'Processed Foods', 'Fresh Produce', 'Seeds & Planting', 'Fertilizers', 'Farm Machinery', 'Irrigation Systems'],
    type: 'product', seoKeywords: ['food', 'agriculture', 'agro', 'farm equipment', 'food processing'],
    featured: true, popular: true,
  },
  {
    id: 'cat-textiles',                slug: 'textiles',
    name: 'Textiles & Apparel',        icon: '\uD83E\uDDF5',
    description: 'Fabrics, yarns, garments, textile machinery, dyeing chemicals, and fashion accessories for the textile industry.',
    subcategories: ['Fabrics', 'Yarns', 'Garments', 'Home Textiles', 'Technical Textiles', 'Dyes & Chemicals', 'Textile Machinery', 'Fashion Accessories', 'Leather Products', 'Carpets & Rugs'],
    type: 'product', seoKeywords: ['textiles', 'apparel', 'fabrics', 'garments', 'yarn'],
    featured: true, popular: true,
  },
  {
    id: 'cat-healthcare',              slug: 'healthcare',
    name: 'Healthcare & Medical',      icon: '\uD83C\uDFE5',
    description: 'Medical equipment, pharmaceutical products, hospital supplies, diagnostic tools, healthcare services, and laboratory equipment.',
    subcategories: ['Medical Equipment', 'Pharmaceuticals', 'Hospital Supplies', 'Diagnostic Tools', 'Surgical Instruments', 'Dental Products', 'Lab Equipment', 'Healthcare Services', 'Wellness Products', 'Personal Care'],
    type: 'both', seoKeywords: ['healthcare', 'medical', 'pharma', 'hospital', 'diagnostic'],
    featured: true, popular: true,
  },
  {
    id: 'cat-it-software',             slug: 'it-software',
    name: 'IT & Software',             icon: '\uD83D\uDCBB',
    description: 'Software development, IT services, cloud solutions, cybersecurity, ERP systems, mobile apps, and digital transformation services.',
    subcategories: ['Software Development', 'Mobile Apps', 'Web Development', 'Cloud Solutions', 'Cybersecurity', 'ERP & CRM', 'AI & ML', 'Data Analytics', 'IT Consulting', 'Digital Marketing'],
    type: 'service', seoKeywords: ['IT', 'software', 'technology', 'digital', 'cybersecurity'],
    featured: true, popular: true,
  },
  {
    id: 'cat-logistics',               slug: 'logistics',
    name: 'Logistics & Supply Chain',  icon: '\uD83D\uDE9A',
    description: 'Transportation, warehousing, freight forwarding, 3PL, courier services, cold chain logistics, and supply chain consulting.',
    subcategories: ['Freight Forwarding', 'Warehousing', 'Last-Mile Delivery', 'Cold Chain', 'Courier Services', 'Container Transport', 'Customs Clearance', 'Supply Chain Consulting', 'Fleet Management', 'Cargo Insurance'],
    type: 'service', seoKeywords: ['logistics', 'supply chain', 'freight', 'warehousing', 'transport'],
    featured: true, popular: true,
  },
  {
    id: 'cat-manufacturing-services',   slug: 'manufacturing-services',
    name: 'Manufacturing Services',    icon: '\uD83D\uDD27',
    description: 'Contract manufacturing, CNC machining, fabrication, 3D printing, injection molding, casting, and assembly services.',
    subcategories: ['CNC Machining', 'Sheet Metal Fabrication', '3D Printing', 'Injection Molding', 'Die Casting', 'Forging', 'Assembly Services', 'Surface Finishing', 'Tool & Die Making', 'Electronics Manufacturing'],
    type: 'service', seoKeywords: ['manufacturing', 'CNC', 'fabrication', '3D printing', 'machining'],
    featured: true, popular: true,
  },
  {
    id: 'cat-industrial-supplies',     slug: 'industrial-supplies',
    name: 'Industrial Supplies',       icon: '\uD83D\uDD17',
    description: 'Safety equipment, MRO supplies, bearings, valves, pipes, fittings, tools, and industrial consumables.',
    subcategories: ['Safety Equipment', 'Bearings', 'Valves & Pipes', 'Hand Tools', 'Power Tools', 'Fasteners', 'Hydraulics', 'Pneumatics', 'Lubrication Systems', 'Industrial Consumables'],
    type: 'product', seoKeywords: ['industrial supplies', 'safety equipment', 'tools', 'bearings', 'valves'],
    featured: true, popular: true,
  },
  {
    id: 'cat-renewable-energy',        slug: 'renewable-energy',
    name: 'Renewable Energy',          icon: '\u2600\uFE0F',
    description: 'Solar panels, wind turbines, inverters, batteries, EV charging solutions, and renewable energy installation services.',
    subcategories: ['Solar Panels', 'Inverters', 'Batteries & Storage', 'Wind Energy', 'EV Chargers', 'Solar Structures', 'Energy Audits', 'Solar Installation', 'Biomass Energy', 'Energy Consulting'],
    type: 'both', seoKeywords: ['solar', 'renewable energy', 'solar panel', 'inverter', 'EV charging'],
    featured: true, popular: false,
  },
  {
    id: 'cat-education',               slug: 'education',
    name: 'Education & Training',      icon: '\uD83C\uDF93',
    description: 'Online courses, vocational training, corporate training, e-learning platforms, educational materials, and certification programs.',
    subcategories: ['Online Courses', 'Vocational Training', 'Corporate Training', 'E-Learning Platforms', 'Certification Programs', 'Educational Materials', 'Language Training', 'Skill Development', 'STEM Education', 'Executive Education'],
    type: 'service', seoKeywords: ['education', 'training', 'courses', 'e-learning', 'certification'],
    featured: false, popular: true,
  },
  {
    id: 'cat-hospitality',             slug: 'hospitality',
    name: 'Hospitality & Tourism',     icon: '\uD83C\uDFED',
    description: 'Hotel supplies, restaurant equipment, catering services, travel agencies, tour operators, and hospitality management.',
    subcategories: ['Hotel Supplies', 'Restaurant Equipment', 'Catering Services', 'Travel Agency', 'Tour Operators', 'Hospitality Consulting', 'Event Management', 'Resort Management', 'Food Service Equipment', 'Guest Amenities'],
    type: 'both', seoKeywords: ['hospitality', 'tourism', 'hotel', 'restaurant', 'travel'],
    featured: false, popular: false,
  },
  {
    id: 'cat-business-services',       slug: 'business-services',
    name: 'Business Services',         icon: '\uD83D\uDCCA',
    description: 'Legal services, accounting, consulting, marketing, HR, recruitment, and professional business support services.',
    subcategories: ['Legal Services', 'Accounting & Tax', 'Management Consulting', 'Digital Marketing', 'HR & Recruitment', 'Market Research', 'Business Registration', 'Patent & Trademark', 'Translation Services', 'Virtual Assistant'],
    type: 'service', seoKeywords: ['business services', 'consulting', 'legal', 'accounting', 'marketing'],
    featured: true, popular: true,
  },
  {
    id: 'cat-office-supplies',         slug: 'office-supplies',
    name: 'Office Supplies & Furniture',icon: '\uD83D\uDCDD',
    description: 'Office furniture, stationery, printer supplies, breakroom supplies, and workspace solutions.',
    subcategories: ['Office Furniture', 'Stationery', 'Printer Supplies', 'Breakroom Supplies', 'Filing Systems', 'Whiteboards', 'Office Electronics', 'Ergonomic Products', 'Cleaning Supplies', 'Pantry Supplies'],
    type: 'product', seoKeywords: ['office supplies', 'furniture', 'stationery', 'office furniture'],
    featured: false, popular: true,
  },
  {
    id: 'cat-consumer-goods',          slug: 'consumer-goods',
    name: 'Consumer Goods',            icon: '\uD83D\uDED2',
    description: 'FMCG products, household items, personal care, beauty products, baby care, and lifestyle goods.',
    subcategories: ['Personal Care', 'Beauty Products', 'Household Items', 'Baby Care', 'Pet Supplies', 'Sports Equipment', 'Toys & Games', 'Home Decor', 'Kitchenware', 'Fitness Equipment'],
    type: 'product', seoKeywords: ['consumer goods', 'FMCG', 'personal care', 'beauty', 'household'],
    featured: false, popular: true,
  },
  {
    id: 'cat-import-export',           slug: 'import-export',
    name: 'Import & Export',           icon: '\uD83D\uDEEB\uFE0F',
    description: 'International trade services, customs brokerage, trade finance, export documentation, and cross-border logistics.',
    subcategories: ['Export Services', 'Import Services', 'Customs Brokerage', 'Trade Finance', 'Export Documentation', 'International Shipping', 'Market Entry Services', 'Trade Compliance', 'Sourcing Services', 'Foreign Trade Consulting'],
    type: 'service', seoKeywords: ['import', 'export', 'international trade', 'customs', 'trade finance'],
    featured: false, popular: false,
  },
  {
    id: 'cat-govt-tenders',            slug: 'government-tenders',
    name: 'Government & Tenders',      icon: '\uD83C\uDFDB\uFE0F',
    description: 'Government tender notifications, bid management, GEM portal services, tender documentation, and public procurement consulting.',
    subcategories: ['Tender Notifications', 'Bid Management', 'GEM Portal', 'Tender Documentation', 'E-Procurement', 'Public Sector Supplies', 'Government Contracts', 'Tender Consulting', 'Bid Bond Services', 'Tender Alerts'],
    type: 'service', seoKeywords: ['government', 'tenders', 'GEM', 'bid', 'procurement'],
    featured: false, popular: false,
  },
]

// ─── MASTER PRODUCTS ──────────────────────────────────────────────
export interface MasterProduct {
  id: string
  type: 'product'
  name: string
  slug: string
  description: string
  categoryId: string
  categoryName: string
  subCategory: string
  image: string
  minPrice: number
  maxPrice: number
  unit: string
  moq: number
  inStock: boolean
  location: string
  city: string
  state: string
  geoRing: number
  seller: { id: string; name: string; isVerified: boolean; trustScore: number; isTradgoElite: boolean }
}

export const MASTER_PRODUCTS: MasterProduct[] = [
  { id: 'prod-001', type: 'product', name: 'CNC Milling Machine VMC-850', slug: 'cnc-milling-machine-vmc-850', description: '3-axis vertical machining center with 800x500mm table, BT40 spindle, 12-tool ATC. Suitable for precision mold and die work.', categoryId: 'cat-industrial-machinery', categoryName: 'Industrial Machinery', subCategory: 'CNC Machines', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80', minPrice: 1850000, maxPrice: 2500000, unit: 'unit', moq: 1, inStock: true, location: 'Rajkot, Gujarat', city: 'Rajkot', state: 'Gujarat', geoRing: 4, seller: { id: 's-mach1', name: 'Precision Machining Tools Ltd.', isVerified: true, trustScore: 96, isTradgoElite: true } },
  { id: 'prod-002', type: 'product', name: 'Industrial Hydraulic Press 150-Ton', slug: 'industrial-hydraulic-press-150-ton', description: 'Heavy-duty hydraulic press for metal forming, forging, and stamping. PLC-controlled with safety interlocks.', categoryId: 'cat-industrial-machinery', categoryName: 'Industrial Machinery', subCategory: 'Hydraulic Presses', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80', minPrice: 950000, maxPrice: 1500000, unit: 'unit', moq: 1, inStock: true, location: 'Ahmedabad, Gujarat', city: 'Ahmedabad', state: 'Gujarat', geoRing: 4, seller: { id: 's-mach2', name: 'Apex Hydraulics Ltd.', isVerified: true, trustScore: 94, isTradgoElite: false } },
  { id: 'prod-003', type: 'product', name: 'Automated Bottle Filling Machine', slug: 'automated-bottle-filling-machine', description: 'Rotary servo-driven filling machine, 50-500ml range, 60 bottles/min. Suitable for beverages, pharma, and cosmetics.', categoryId: 'cat-industrial-machinery', categoryName: 'Industrial Machinery', subCategory: 'Packaging Machinery', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80', minPrice: 550000, maxPrice: 850000, unit: 'unit', moq: 1, inStock: true, location: 'Pune, Maharashtra', city: 'Pune', state: 'Maharashtra', geoRing: 3, seller: { id: 's-mach3', name: 'TechFill Systems Pvt. Ltd.', isVerified: true, trustScore: 98, isTradgoElite: true } },
  { id: 'prod-004', type: 'product', name: 'Solar PV Panel 550W Mono PERC', slug: 'solar-pv-panel-550w-mono-perc', description: 'Bifacial monocrystalline panel, 21.5% efficiency, 25-year linear warranty. Fire-rated and PID-resistant.', categoryId: 'cat-renewable-energy', categoryName: 'Renewable Energy', subCategory: 'Solar Panels', image: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=600&q=80', minPrice: 25000, maxPrice: 30000, unit: 'piece', moq: 50, inStock: true, location: 'Mumbai, Maharashtra', city: 'Mumbai', state: 'Maharashtra', geoRing: 3, seller: { id: 's-energy1', name: 'GreenVolt Energy Solutions', isVerified: true, trustScore: 93, isTradgoElite: false } },
  { id: 'prod-005', type: 'product', name: 'SS 316L Industrial Ball Valves 2"-12"', slug: 'ss-316l-industrial-ball-valves', description: 'Full-port stainless steel ball valves rated PN16/PN40. CE, API 6D certified. Ideal for chemical and oil industry.', categoryId: 'cat-industrial-supplies', categoryName: 'Industrial Supplies', subCategory: 'Valves & Pipes', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80', minPrice: 3500, maxPrice: 8500, unit: 'unit', moq: 10, inStock: true, location: 'Vadodara, Gujarat', city: 'Vadodara', state: 'Gujarat', geoRing: 4, seller: { id: 's-ind1', name: 'FlowControl Engineers', isVerified: true, trustScore: 94, isTradgoElite: false } },
  { id: 'prod-006', type: 'product', name: 'Industrial Gearbox Helical 20:1', slug: 'industrial-gearbox-helical-20-1', description: 'Helical gearbox with 20:1 ratio, 95% efficiency, suitable for conveyor systems and heavy machinery.', categoryId: 'cat-industrial-supplies', categoryName: 'Industrial Supplies', subCategory: 'Bearings', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80', minPrice: 85000, maxPrice: 120000, unit: 'unit', moq: 2, inStock: true, location: 'Ludhiana, Punjab', city: 'Ludhiana', state: 'Punjab', geoRing: 4, seller: { id: 's-ind2', name: 'Punjab Gear Works', isVerified: true, trustScore: 91, isTradgoElite: false } },
  { id: 'prod-007', type: 'product', name: 'PVC Cable 4 sqmm 90m Roll', slug: 'pvc-cable-4-sqmm-90m', description: 'ISI-marked copper PVC insulated cable, 4 sqmm, 1100V grade. Suitable for industrial electrical wiring.', categoryId: 'cat-electronics', categoryName: 'Electronics & Electrical', subCategory: 'Cables & Wires', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80', minPrice: 4500, maxPrice: 32000, unit: 'roll', moq: 10, inStock: true, location: 'Delhi, India', city: 'Delhi', state: 'Delhi', geoRing: 5, seller: { id: 's-elec1', name: 'Delhi Cable Corporation', isVerified: true, trustScore: 92, isTradgoElite: false } },
  { id: 'prod-008', type: 'product', name: 'API 5L Grade B Seamless Pipe 6"', slug: 'api-5l-grade-b-seamless-pipe', description: 'Seamless carbon steel pipe, API 5L Grade B, 6" NB, Sch 40, 6m length. Used in oil & gas and structural applications.', categoryId: 'cat-construction', categoryName: 'Construction & Real Estate', subCategory: 'Steel & Metals', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80', minPrice: 8500, maxPrice: 12000, unit: 'piece', moq: 50, inStock: true, location: 'Mumbai, Maharashtra', city: 'Mumbai', state: 'Maharashtra', geoRing: 3, seller: { id: 's-const1', name: 'Mumbai Steel Traders', isVerified: true, trustScore: 95, isTradgoElite: true } },
  { id: 'prod-009', type: 'product', name: 'LED Street Light 100W IP65', slug: 'led-street-light-100w-ip65', description: 'Die-cast aluminum LED street light, 100W, 15000 lumens, IP65 waterproof, 5000K. 3-year warranty.', categoryId: 'cat-electronics', categoryName: 'Electronics & Electrical', subCategory: 'LEDs & Lighting', image: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=600&q=80', minPrice: 1800, maxPrice: 2500, unit: 'piece', moq: 100, inStock: true, location: 'Chennai, Tamil Nadu', city: 'Chennai', state: 'Tamil Nadu', geoRing: 4, seller: { id: 's-elec2', name: 'Tamil Nadu Lighting Solutions', isVerified: true, trustScore: 90, isTradgoElite: false } },
  { id: 'prod-010', type: 'product', name: 'Ceramic Wall Tiles 60x60cm', slug: 'ceramic-wall-tiles-60x60cm', description: 'Glazed vitrified tiles, 60x60cm, 8mm thick, multiple designs. Suitable for walls and flooring.', categoryId: 'cat-construction', categoryName: 'Construction & Real Estate', subCategory: 'Tiles & Flooring', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80', minPrice: 38, maxPrice: 75, unit: 'sqft', moq: 500, inStock: true, location: 'Morbi, Gujarat', city: 'Morbi', state: 'Gujarat', geoRing: 4, seller: { id: 's-const2', name: 'Morbi Ceramics Pvt. Ltd.', isVerified: true, trustScore: 97, isTradgoElite: true } },
  { id: 'prod-011', type: 'product', name: 'Tractor 50 HP 4WD', slug: 'tractor-50-hp-4wd', description: '50 HP 4WD tractor with power steering, live PTO, multipurpose for farming and haulage.', categoryId: 'cat-food-agro', categoryName: 'Food & Agriculture', subCategory: 'Farm Machinery', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80', minPrice: 750000, maxPrice: 950000, unit: 'unit', moq: 1, inStock: true, location: 'Ludhiana, Punjab', city: 'Ludhiana', state: 'Punjab', geoRing: 4, seller: { id: 's-agro1', name: 'Punjab Tractors & Equipments', isVerified: true, trustScore: 96, isTradgoElite: true } },
  { id: 'prod-012', type: 'product', name: 'Basmati Rice 1121 Steam 25kg', slug: 'basmati-rice-1121-steam-25kg', description: 'Premium Indian 1121 basmati rice, steam parboiled, extra-long grain, 25kg non-woven bag.', categoryId: 'cat-food-agro', categoryName: 'Food & Agriculture', subCategory: 'Grains & Pulses', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80', minPrice: 2200, maxPrice: 2800, unit: 'bag', moq: 100, inStock: true, location: 'Karnal, Haryana', city: 'Karnal', state: 'Haryana', geoRing: 4, seller: { id: 's-agro2', name: 'Haryana Rice Mills', isVerified: true, trustScore: 92, isTradgoElite: false } },
  { id: 'prod-013', type: 'product', name: 'Cotton Fabric 40s Combed 100%', slug: 'cotton-fabric-40s-combed', description: '100% combed cotton fabric, 40s count, 60x60 thread count, 250gsm. Ideal for T-shirts and apparel.', categoryId: 'cat-textiles', categoryName: 'Textiles & Apparel', subCategory: 'Fabrics', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80', minPrice: 180, maxPrice: 250, unit: 'meter', moq: 500, inStock: true, location: 'Tirupur, Tamil Nadu', city: 'Tirupur', state: 'Tamil Nadu', geoRing: 4, seller: { id: 's-text1', name: 'Tirupur Textile Mills', isVerified: true, trustScore: 95, isTradgoElite: true } },
  { id: 'prod-014', type: 'product', name: 'Paracetamol IP 500mg Tablets', slug: 'paracetamol-ip-500mg-tablets', description: 'IP-grade paracetamol tablets, 500mg, strip of 10. GMP-certified manufacturing. Bulk supply available.', categoryId: 'cat-healthcare', categoryName: 'Healthcare & Medical', subCategory: 'Pharmaceuticals', image: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=600&q=80', minPrice: 12, maxPrice: 18, unit: 'strip', moq: 10000, inStock: true, location: 'Hyderabad, Telangana', city: 'Hyderabad', state: 'Telangana', geoRing: 4, seller: { id: 's-health1', name: 'Hyderabad Pharma Distributors', isVerified: true, trustScore: 98, isTradgoElite: true } },
  { id: 'prod-015', type: 'product', name: 'Sulphuric Acid 98% Industrial Grade', slug: 'sulphuric-acid-98-industrial-grade', description: 'Concentrated sulphuric acid 98%, industrial grade, 50kg carboys. Used in chemical manufacturing and water treatment.', categoryId: 'cat-chemicals', categoryName: 'Chemicals & Pharma', subCategory: 'Industrial Chemicals', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80', minPrice: 28, maxPrice: 45, unit: 'kg', moq: 1000, inStock: true, location: 'Ankleshwar, Gujarat', city: 'Ankleshwar', state: 'Gujarat', geoRing: 4, seller: { id: 's-chem1', name: 'Gujarat Chemical Industries', isVerified: true, trustScore: 93, isTradgoElite: false } },
  { id: 'prod-016', type: 'product', name: 'Corrugated Box 3-ply 12x10x8"', slug: 'corrugated-box-3-ply', description: '3-ply corrugated shipping box, 12x10x8 inches, brown kraft, 200gsm. Suitable for e-commerce and industrial packaging.', categoryId: 'cat-packaging', categoryName: 'Packaging & Printing', subCategory: 'Corrugated Boxes', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80', minPrice: 18, maxPrice: 35, unit: 'piece', moq: 500, inStock: true, location: 'Silvassa, Dadra & Nagar Haveli', city: 'Silvassa', state: 'Dadra & Nagar Haveli', geoRing: 5, seller: { id: 's-pack1', name: 'West India Packaging', isVerified: true, trustScore: 94, isTradgoElite: false } },
  { id: 'prod-017', type: 'product', name: 'Auto Brake Pad Set Ceramic', slug: 'auto-brake-pad-set-ceramic', description: 'Ceramic brake pad set for passenger cars, low dust, noise-free, OEM specification. Fits Maruti, Hyundai, Tata.', categoryId: 'cat-automotive', categoryName: 'Automotive & Transport', subCategory: 'Auto Parts', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80', minPrice: 850, maxPrice: 1200, unit: 'set', moq: 50, inStock: true, location: 'Chennai, Tamil Nadu', city: 'Chennai', state: 'Tamil Nadu', geoRing: 4, seller: { id: 's-auto1', name: 'Chennai Auto Components', isVerified: true, trustScore: 91, isTradgoElite: false } },
  { id: 'prod-018', type: 'product', name: 'Office Workstation Desk 6-Seater', slug: 'office-workstation-desk-6-seater', description: 'Modular office workstation, 6-seater with partitions, cable management, and laminate finish. 2400x1200mm.', categoryId: 'cat-office-supplies', categoryName: 'Office Supplies & Furniture', subCategory: 'Office Furniture', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80', minPrice: 45000, maxPrice: 65000, unit: 'unit', moq: 5, inStock: true, location: 'Bengaluru, Karnataka', city: 'Bengaluru', state: 'Karnataka', geoRing: 3, seller: { id: 's-off1', name: 'Karnataka Office Solutions', isVerified: true, trustScore: 89, isTradgoElite: false } },
  { id: 'prod-019', type: 'product', name: 'Personal Care Gift Hamper', slug: 'personal-care-gift-hamper', description: 'Premium gift hamper with body wash, shampoo, lotion, and deodorant. Luxury packaging, corporate gifting.', categoryId: 'cat-consumer-goods', categoryName: 'Consumer Goods', subCategory: 'Personal Care', image: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=600&q=80', minPrice: 450, maxPrice: 1200, unit: 'set', moq: 100, inStock: true, location: 'Delhi, India', city: 'Delhi', state: 'Delhi', geoRing: 5, seller: { id: 's-cons1', name: 'Delhi Consumer Goods Co.', isVerified: false, trustScore: 85, isTradgoElite: false } },
  { id: 'prod-020', type: 'product', name: 'HVAC Air Handling Unit 10 TR', slug: 'hvac-air-handling-unit-10-tr', description: 'Modular air handling unit, 10 TR capacity, double-skin, with cooling coil and bag filter. For commercial HVAC.', categoryId: 'cat-industrial-supplies', categoryName: 'Industrial Supplies', subCategory: 'Hydraulics', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80', minPrice: 280000, maxPrice: 400000, unit: 'unit', moq: 1, inStock: true, location: 'Pune, Maharashtra', city: 'Pune', state: 'Maharashtra', geoRing: 3, seller: { id: 's-ind3', name: 'Pune HVAC Systems', isVerified: true, trustScore: 96, isTradgoElite: true } },
]

// ─── MASTER SERVICES ──────────────────────────────────────────────
export interface MasterService {
  id: string
  type: 'service'
  name: string
  slug: string
  description: string
  categoryId: string
  categoryName: string
  subCategory: string
  image: string
  pricingModel: 'fixed' | 'hourly' | 'project' | 'monthly'
  price: number
  unit: string
  coverageArea: string
  city: string
  state: string
  geoRing: number
  seller: { id: string; name: string; isVerified: boolean; trustScore: number; isTradgoElite: boolean }
}

export const MASTER_SERVICES: MasterService[] = [
  { id: 'svc-001', type: 'service', name: 'ISO 9001:2025 Certification Consultancy', slug: 'iso-9001-2025-certification', description: 'End-to-end ISO certification with documentation, internal audit & lead auditor support. 100% success rate.', categoryId: 'cat-business-services', categoryName: 'Business Services', subCategory: 'Legal Services', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80', pricingModel: 'project', price: 85000, unit: 'project', coverageArea: 'Pan India', city: 'New Delhi', state: 'Delhi', geoRing: 5, seller: { id: 's-svc1', name: 'Qualitas Certifications', isVerified: true, trustScore: 99, isTradgoElite: true } },
  { id: 'svc-002', type: 'service', name: 'Custom CNC Machining Service', slug: 'custom-cnc-machining-service', description: 'Precision CNC turning, milling & EDM for aerospace, automotive & medical components. Prototype to production runs.', categoryId: 'cat-manufacturing-services', categoryName: 'Manufacturing Services', subCategory: 'CNC Machining', image: 'https://images.unsplash.com/photo-1561581745-47e2b0a8b3d5?w=600&q=80', pricingModel: 'fixed', price: 500, unit: 'piece', coverageArea: 'All India', city: 'Bengaluru', state: 'Karnataka', geoRing: 3, seller: { id: 's-svc2', name: 'PrecisionTech India', isVerified: true, trustScore: 95, isTradgoElite: true } },
  { id: 'svc-003', type: 'service', name: 'ERP Implementation & Customization', slug: 'erp-implementation-service', description: 'Full-cycle Odoo/SAP/Odoo ERP implementation, module customization, data migration, and staff training.', categoryId: 'cat-it-software', categoryName: 'IT & Software', subCategory: 'ERP & CRM', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80', pricingModel: 'project', price: 450000, unit: 'project', coverageArea: 'Global', city: 'Hyderabad', state: 'Telangana', geoRing: 5, seller: { id: 's-svc3', name: 'TechVista Solutions', isVerified: true, trustScore: 97, isTradgoElite: true } },
  { id: 'svc-004', type: 'service', name: 'Warehousing & 3PL Services', slug: 'warehousing-3pl-services', description: '50,000 sqft warehousing with WMS, pick-pack-ship, inventory management, and pan-India distribution network.', categoryId: 'cat-logistics', categoryName: 'Logistics & Supply Chain', subCategory: 'Warehousing', image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80', pricingModel: 'monthly', price: 150000, unit: 'month', coverageArea: 'Western India', city: 'Mumbai', state: 'Maharashtra', geoRing: 3, seller: { id: 's-svc4', name: 'Mumbai Logistics Hub', isVerified: true, trustScore: 94, isTradgoElite: false } },
  { id: 'svc-005', type: 'service', name: 'Digital Marketing Agency — SEO & PPC', slug: 'digital-marketing-seo-ppc', description: 'Complete digital marketing solutions: SEO, Google Ads, social media marketing, content writing, and performance analytics.', categoryId: 'cat-business-services', categoryName: 'Business Services', subCategory: 'Digital Marketing', image: 'https://images.unsplash.com/photo-1432889821006-3149403f4409?w=600&q=80', pricingModel: 'monthly', price: 35000, unit: 'month', coverageArea: 'Pan India', city: 'Gurugram', state: 'Haryana', geoRing: 4, seller: { id: 's-svc5', name: 'GrowthX Digital', isVerified: true, trustScore: 88, isTradgoElite: false } },
  { id: 'svc-006', type: 'service', name: 'Medical Transcription Service', slug: 'medical-transcription-service', description: 'HIPAA-compliant medical transcription from audio to text. 99% accuracy, 24hr TAT. Serving US and UK hospitals.', categoryId: 'cat-healthcare', categoryName: 'Healthcare & Medical', subCategory: 'Healthcare Services', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80', pricingModel: 'fixed', price: 8, unit: 'line', coverageArea: 'Global', city: 'Kochi', state: 'Kerala', geoRing: 5, seller: { id: 's-svc6', name: 'Kerala Transcriptions', isVerified: true, trustScore: 96, isTradgoElite: true } },
  { id: 'svc-007', type: 'service', name: 'Custom Software Development', slug: 'custom-software-development', description: 'Full-stack web and mobile app development, MVP to enterprise-grade. React, Node.js, Python, Flutter, AWS.', categoryId: 'cat-it-software', categoryName: 'IT & Software', subCategory: 'Software Development', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80', pricingModel: 'hourly', price: 25, unit: 'hour', coverageArea: 'Global', city: 'Bengaluru', state: 'Karnataka', geoRing: 5, seller: { id: 's-svc7', name: 'CodeCraft India', isVerified: true, trustScore: 90, isTradgoElite: false } },
  { id: 'svc-008', type: 'service', name: 'Freight Forwarding — Sea & Air', slug: 'freight-forwarding-sea-air', description: 'International freight forwarding, FCL/LCL, air cargo, customs clearance, and door-to-door delivery across 50+ countries.', categoryId: 'cat-logistics', categoryName: 'Logistics & Supply Chain', subCategory: 'Freight Forwarding', image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=600&q=80', pricingModel: 'project', price: 50000, unit: 'container', coverageArea: 'Global', city: 'Mundra', state: 'Gujarat', geoRing: 6, seller: { id: 's-svc8', name: 'Global Freight Solutions', isVerified: true, trustScore: 98, isTradgoElite: true } },
  { id: 'svc-009', type: 'service', name: '3D Printing & Rapid Prototyping', slug: '3d-printing-rapid-prototyping', description: 'SLA, SLS, FDM 3D printing services. Rapid prototyping, jigs & fixtures, end-use parts. Lead time 24-72 hours.', categoryId: 'cat-manufacturing-services', categoryName: 'Manufacturing Services', subCategory: '3D Printing', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80', pricingModel: 'fixed', price: 1500, unit: 'piece', coverageArea: 'All India', city: 'Pune', state: 'Maharashtra', geoRing: 3, seller: { id: 's-svc9', name: 'AddiFab Technologies', isVerified: true, trustScore: 93, isTradgoElite: false } },
  { id: 'svc-010', type: 'service', name: 'Solar Installation & EPC Services', slug: 'solar-installation-epc', description: 'End-to-end solar EPC for residential, commercial, and industrial. Design, procurement, installation, commissioning.', categoryId: 'cat-renewable-energy', categoryName: 'Renewable Energy', subCategory: 'Solar Installation', image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80', pricingModel: 'project', price: 350000, unit: 'project', coverageArea: 'Pan India', city: 'Jaipur', state: 'Rajasthan', geoRing: 4, seller: { id: 's-svc10', name: 'Rajasthan Solar Solutions', isVerified: true, trustScore: 92, isTradgoElite: false } },
  { id: 'svc-011', type: 'service', name: 'GST & Income Tax Filing Service', slug: 'gst-income-tax-filing', description: 'GST registration, monthly returns, income tax filing, TDS compliance. CA-certified. 5+ years of experience.', categoryId: 'cat-business-services', categoryName: 'Business Services', subCategory: 'Accounting & Tax', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80', pricingModel: 'monthly', price: 1500, unit: 'month', coverageArea: 'Pan India', city: 'Ahmedabad', state: 'Gujarat', geoRing: 5, seller: { id: 's-svc11', name: 'Gujarat Tax Advisors', isVerified: true, trustScore: 97, isTradgoElite: true } },
  { id: 'svc-012', type: 'service', name: 'Industrial Training & Skill Development', slug: 'industrial-training-skill-development', description: 'NSDC-affiliated vocational training in welding, electrical, plumbing, CNC, and automotive skills. Placement assistance.', categoryId: 'cat-education', categoryName: 'Education & Training', subCategory: 'Vocational Training', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b1a4e2b2?w=600&q=80', pricingModel: 'fixed', price: 25000, unit: 'course', coverageArea: 'Pan India', city: 'Indore', state: 'Madhya Pradesh', geoRing: 4, seller: { id: 's-svc12', name: 'SkillUp India', isVerified: true, trustScore: 95, isTradgoElite: false } },
]

// ─── MASTER INDUSTRIES ────────────────────────────────────────────
export interface MasterIndustry {
  id: string
  name: string
  icon: string
  description: string
  slug: string
  supplierCount: number
  productCount: number
}

export const MASTER_INDUSTRIES: MasterIndustry[] = [
  { id: 'ind-auto', name: 'Automotive & Auto Components', icon: '\uD83D\uDE97', description: 'Vehicle parts, assembly, EV components, and auto service providers.', slug: 'automotive', supplierCount: 2400, productCount: 18500 },
  { id: 'ind-pharma', name: 'Pharmaceuticals & Healthcare', icon: '\uD83D\uDC8A', description: 'Drug manufacturing, medical devices, hospital supplies, and clinical services.', slug: 'pharma-healthcare', supplierCount: 3200, productCount: 28000 },
  { id: 'ind-textile', name: 'Textiles & Garments', icon: '\uD83E\uDDF5', description: 'Fabric mills, garment manufacturers, dyeing units, and fashion houses.', slug: 'textiles-garments', supplierCount: 4500, productCount: 35000 },
  { id: 'ind-electronics', name: 'Electronics & Semiconductor', icon: '\u26A1', description: 'PCB assembly, semiconductor, consumer electronics, and industrial automation.', slug: 'electronics-semiconductor', supplierCount: 2800, productCount: 22000 },
  { id: 'ind-chem', name: 'Chemicals & Petrochemicals', icon: '\uD83D\uDD2C', description: 'Industrial chemicals, specialty chemicals, fertilizers, and petrochemical products.', slug: 'chemicals-petro', supplierCount: 1800, productCount: 12000 },
  { id: 'ind-food', name: 'Food Processing & Agriculture', icon: '\uD83C\uDF31', description: 'Food processors, cold storage, farm equipment, and agro-commodities.', slug: 'food-agriculture', supplierCount: 3600, productCount: 15000 },
  { id: 'ind-const', name: 'Construction & Infrastructure', icon: '\uD83C\uDFD7\uFE0F', description: 'Building materials, contractors, real estate developers, and infrastructure firms.', slug: 'construction-infra', supplierCount: 5200, productCount: 18000 },
  { id: 'ind-mach', name: 'Machinery & Industrial Equipment', icon: '\u2699\uFE0F', description: 'Machine tools, heavy equipment, automation, and industrial spare parts.', slug: 'machinery-equipment', supplierCount: 1900, productCount: 25000 },
  { id: 'ind-pack', name: 'Packaging & Printing', icon: '\uD83D\uDCE6', description: 'Packaging material manufacturers, printers, labeling, and packaging design services.', slug: 'packaging-printing', supplierCount: 1500, productCount: 8000 },
  { id: 'ind-logistics', name: 'Logistics & Supply Chain', icon: '\uD83D\uDE9A', description: 'Freight forwarding, warehousing, 3PL providers, and courier services.', slug: 'logistics-supply-chain', supplierCount: 2100, productCount: 500 },
  { id: 'ind-it', name: 'IT & Software Services', icon: '\uD83D\uDCBB', description: 'Software development, IT consulting, cloud services, and digital transformation.', slug: 'it-software', supplierCount: 4800, productCount: 300 },
  { id: 'ind-renewable', name: 'Renewable Energy & Green Tech', icon: '\u2600\uFE0F', description: 'Solar, wind, biomass, energy storage, and EV infrastructure companies.', slug: 'renewable-energy', supplierCount: 800, productCount: 3500 },
]

// ─── SEARCH SUGGESTIONS ──────────────────────────────────────────
export interface SearchSuggestion {
  text: string
  type: 'product' | 'service' | 'category' | 'industry' | 'location' | 'trending'
  url: string
}

export const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  // Trending
  { text: 'Solar Panel 550W', type: 'trending', url: '/products?q=solar+panel' },
  { text: 'CNC Machine VMC', type: 'trending', url: '/products?q=cnc+machine' },
  { text: 'Hydraulic Press', type: 'trending', url: '/products?q=hydraulic+press' },
  { text: 'LED Street Light', type: 'trending', url: '/products?q=led+street+light' },
  { text: 'Basmati Rice 1121', type: 'trending', url: '/products?q=basmati+rice' },
  // Categories
  { text: 'Industrial Machinery', type: 'category', url: '/products?category=industrial-machinery' },
  { text: 'Electronics & Electrical', type: 'category', url: '/products?category=electronics' },
  { text: 'Chemicals & Pharma', type: 'category', url: '/products?category=chemicals' },
  { text: 'Packaging & Printing', type: 'category', url: '/products?category=packaging' },
  { text: 'Construction Materials', type: 'category', url: '/products?category=construction' },
  { text: 'Automotive Parts', type: 'category', url: '/products?category=automotive' },
  { text: 'Food & Agriculture', type: 'category', url: '/products?category=food-agro' },
  { text: 'Textiles & Apparel', type: 'category', url: '/products?category=textiles' },
  { text: 'Healthcare & Medical', type: 'category', url: '/products?category=healthcare' },
  { text: 'Renewable Energy', type: 'category', url: '/products?category=renewable-energy' },
  { text: 'IT & Software', type: 'category', url: '/products?category=it-software' },
  { text: 'Industrial Supplies', type: 'category', url: '/products?category=industrial-supplies' },
  { text: 'Business Services', type: 'category', url: '/products?category=business-services' },
  { text: 'Office Supplies', type: 'category', url: '/products?category=office-supplies' },
  { text: 'Consumer Goods', type: 'category', url: '/products?category=consumer-goods' },
  { text: 'Logistics & Transport', type: 'category', url: '/products?category=logistics' },
  { text: 'Manufacturing Services', type: 'category', url: '/products?category=manufacturing-services' },
  // Products
  { text: 'CNC Milling Machine VMC-850', type: 'product', url: '/products/cnc-milling-machine-vmc-850' },
  { text: 'Hydraulic Press 150-Ton', type: 'product', url: '/products/industrial-hydraulic-press-150-ton' },
  { text: 'Automated Bottle Filling Machine', type: 'product', url: '/products/automated-bottle-filling-machine' },
  { text: 'SS 316L Ball Valves', type: 'product', url: '/products/ss-316l-industrial-ball-valves' },
  { text: 'Industrial Gearbox Helical', type: 'product', url: '/products/industrial-gearbox-helical-20-1' },
  { text: 'PVC Cable 4 sqmm', type: 'product', url: '/products/pvc-cable-4-sqmm-90m' },
  { text: 'API 5L Seamless Pipe', type: 'product', url: '/products/api-5l-grade-b-seamless-pipe' },
  { text: 'Ceramic Wall Tiles 60x60', type: 'product', url: '/products/ceramic-wall-tiles-60x60cm' },
  { text: 'Tractor 50 HP', type: 'product', url: '/products/tractor-50-hp-4wd' },
  { text: 'Cotton Fabric 40s', type: 'product', url: '/products/cotton-fabric-40s-combed' },
  { text: 'Paracetamol 500mg', type: 'product', url: '/products/paracetamol-ip-500mg-tablets' },
  { text: 'Corrugated Box 3-ply', type: 'product', url: '/products/corrugated-box-3-ply' },
  { text: 'Auto Brake Pad Set', type: 'product', url: '/products/auto-brake-pad-set-ceramic' },
  { text: 'Office Workstation 6-Seater', type: 'product', url: '/products/office-workstation-desk-6-seater' },
  { text: 'HVAC Air Handling Unit', type: 'product', url: '/products/hvac-air-handling-unit-10-tr' },
  // Services
  { text: 'ISO 9001 Certification', type: 'service', url: '/services/iso-9001-2025-certification' },
  { text: 'CNC Machining Service', type: 'service', url: '/services/custom-cnc-machining-service' },
  { text: 'ERP Implementation', type: 'service', url: '/services/erp-implementation-service' },
  { text: 'Warehousing & 3PL', type: 'service', url: '/services/warehousing-3pl-services' },
  { text: 'Digital Marketing SEO', type: 'service', url: '/services/digital-marketing-seo-ppc' },
  { text: 'Software Development', type: 'service', url: '/services/custom-software-development' },
  { text: 'Freight Forwarding', type: 'service', url: '/services/freight-forwarding-sea-air' },
  { text: '3D Printing Service', type: 'service', url: '/services/3d-printing-rapid-prototyping' },
  { text: 'Solar EPC Installation', type: 'service', url: '/services/solar-installation-epc' },
  { text: 'GST Filing Service', type: 'service', url: '/services/gst-income-tax-filing' },
  // Locations
  { text: 'Mumbai Suppliers', type: 'location', url: '/city/mumbai' },
  { text: 'Delhi Suppliers', type: 'location', url: '/city/delhi' },
  { text: 'Bengaluru Suppliers', type: 'location', url: '/city/bengaluru' },
  { text: 'Ahmedabad Suppliers', type: 'location', url: '/city/ahmedabad' },
  { text: 'Chennai Suppliers', type: 'location', url: '/city/chennai' },
  { text: 'Pune Suppliers', type: 'location', url: '/city/pune' },
  { text: 'Hyderabad Suppliers', type: 'location', url: '/city/hyderabad' },
  { text: 'Jaipur Suppliers', type: 'location', url: '/city/jaipur' },
]

// ─── SITEMAP DATA ────────────────────────────────────────────────
export const SITEMAP_CATEGORIES = MASTER_CATEGORIES.map(c => c.slug)
export const SITEMAP_CITIES = ['mumbai', 'delhi', 'bengaluru', 'ahmedabad', 'chennai', 'kolkata', 'pune', 'hyderabad', 'jaipur', 'lucknow', 'surat', 'indore', 'kochi', 'coimbatore', 'vadodara', 'nagpur', 'visakhapatnam', 'bhopal', 'patna', 'chandigarh']

// ─── CITIES DATA ──────────────────────────────────────────────────
export interface MasterCity {
  id: string; name: string; state: string; image: string
  sellers: number; products: number; services: number; buyers: number
  industry: string; growth: string; slug: string
}
export const MASTER_CITIES: MasterCity[] = [
  { id: 'delhi', name: 'Delhi', state: 'Delhi NCR', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&h=400&fit=crop', sellers: 45600, products: 234000, services: 52300, buyers: 18900, industry: 'Electronics & IT', growth: '+24.3%', slug: 'delhi' },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600&h=400&fit=crop', sellers: 72300, products: 456000, services: 89000, buyers: 31200, industry: 'Auto & Pharma', growth: '+31.2%', slug: 'mumbai' },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', image: 'https://images.unsplash.com/photo-1593246049224-5cde8f0ce6b8?w=600&h=400&fit=crop', sellers: 23400, products: 345000, services: 45600, buyers: 14500, industry: 'Chemicals & Textiles', growth: '+27.6%', slug: 'ahmedabad' },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', image: 'https://images.unsplash.com/photo-1590079651737-0cb37cafea43?w=600&h=400&fit=crop', sellers: 34500, products: 189000, services: 41200, buyers: 14500, industry: 'Textiles & Steel', growth: '+18.9%', slug: 'kolkata' },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', image: 'https://images.unsplash.com/photo-1563191794-b0e1e2e56e2c?w=600&h=400&fit=crop', sellers: 58900, products: 389000, services: 67800, buyers: 25600, industry: 'Auto & Electronics', growth: '+28.9%', slug: 'chennai' },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', image: 'https://images.unsplash.com/photo-1596178060671-7a80dc8051f2?w=600&h=400&fit=crop', sellers: 45600, products: 298000, services: 72300, buyers: 19800, industry: 'IT & Electronics', growth: '+31.2%', slug: 'bengaluru' },
  { id: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&h=400&fit=crop', sellers: 15600, products: 89000, services: 19800, buyers: 7800, industry: 'Textiles & MSME', growth: '+22.1%', slug: 'kanpur' },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&h=400&fit=crop', sellers: 31200, products: 178000, services: 38900, buyers: 12300, industry: 'Pharma & IT', growth: '+26.8%', slug: 'hyderabad' },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600&h=400&fit=crop', sellers: 28900, products: 156000, services: 34500, buyers: 11200, industry: 'Auto & Engineering', growth: '+29.4%', slug: 'pune' },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&h=400&fit=crop', sellers: 10200, products: 134000, services: 23400, buyers: 6700, industry: 'Textiles & Handicrafts', growth: '+19.5%', slug: 'jaipur' },
  { id: 'surat', name: 'Surat', state: 'Gujarat', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop', sellers: 18900, products: 234000, services: 31200, buyers: 8900, industry: 'Diamond & Textiles', growth: '+25.3%', slug: 'surat' },
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&h=400&fit=crop', sellers: 8900, products: 56700, services: 14500, buyers: 5600, industry: 'Food Processing & MSME', growth: '+21.7%', slug: 'lucknow' },
  { id: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', image: 'https://images.unsplash.com/photo-1589792923960-d25c1fd732a5?w=600&h=400&fit=crop', sellers: 12300, products: 89000, services: 16700, buyers: 6700, industry: 'Engineering & Textiles', growth: '+23.8%', slug: 'coimbatore' },
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', image: 'https://images.unsplash.com/photo-1609151712771-9a66b6e0203d?w=600&h=400&fit=crop', sellers: 7800, products: 56700, services: 12300, buyers: 4500, industry: 'Food Processing & Auto', growth: '+20.4%', slug: 'indore' },
  { id: 'noida', name: 'Noida', state: 'Uttar Pradesh', image: 'https://images.unsplash.com/photo-1624969862644-791f3dc98927?w=600&h=400&fit=crop', sellers: 11200, products: 89000, services: 19800, buyers: 6700, industry: 'IT & Electronics', growth: '+27.2%', slug: 'noida' },
]

// ─── COUNTRIES DATA ───────────────────────────────────────────────
export const MASTER_COUNTRIES = [
  { code: 'IN', name: 'India', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'BD', name: 'Bangladesh', flag: '\uD83C\uDDE7\uD83C\uDDE9' },
  { code: 'LK', name: 'Sri Lanka', flag: '\uD83C\uDDF1\uD83C\uDDF0' },
  { code: 'NP', name: 'Nepal', flag: '\uD83C\uDDF3\uD83C\uDDF5' },
  { code: 'BT', name: 'Bhutan', flag: '\uD83C\uDDE7\uD83C\uDDF9' },
  { code: 'AF', name: 'Afghanistan', flag: '\uD83C\uDDE6\uD83C\uDDEB' },
  { code: 'ID', name: 'Indonesia', flag: '\uD83C\uDDEE\uD83C\uDDE9' },
  { code: 'MY', name: 'Malaysia', flag: '\uD83C\uDDF2\uD83C\uDDFE' },
  { code: 'SG', name: 'Singapore', flag: '\uD83C\uDDF8\uD83C\uDDEC' },
  { code: 'JP', name: 'Japan', flag: '\uD83C\uDDEF\uD83C\uDDF5' },
  { code: 'CN', name: 'China', flag: '\uD83C\uDDE8\uD83C\uDDF3' },
  { code: 'RU', name: 'Russia', flag: '\uD83C\uDDF7\uD83C\uDDFA' },
  { code: 'AE', name: 'UAE', flag: '\uD83C\uDDE6\uD83C\uDDEA' },
  { code: 'US', name: 'United States', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
  { code: 'GB', name: 'United Kingdom', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  { code: 'DE', name: 'Germany', flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  { code: 'AU', name: 'Australia', flag: '\uD83C\uDDE6\uD83C\uDDFA' },
  { code: 'CA', name: 'Canada', flag: '\uD83C\uDDE8\uD83C\uDDE6' },
  { code: 'SA', name: 'Saudi Arabia', flag: '\uD83C\uDDF8\uD83C\uDDE6' },
  { code: 'KR', name: 'South Korea', flag: '\uD83C\uDDF0\uD83C\uDDF7' },
]

// ─── FOOTER LINKS ────────────────────────────────────────────────
export const FOOTER_MARKETPLACE_LINKS = [
  { label: 'eMarketplace', href: '/trading' },
  { label: 'Browse Products', href: '/products' },
  { label: 'Categories', href: '/categories' },
  { label: 'RFQ Marketplace', href: '/rfq' },
]
export const FOOTER_COMPANY_LINKS = [
  { label: 'About TRADINGO', href: '/about-tradingo' },
  { label: 'Why TRADINGO', href: '/why-tradingo' },
  { label: 'For Sellers', href: '/for-sellers' },
  { label: 'For Buyers', href: '/for-buyers' },
  { label: 'Seller Plans', href: '/seller-plans' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
]
export const FOOTER_SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://facebook.com/tradingo' },
  { label: 'X', href: 'https://x.com/tradingo' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/tradingo' },
  { label: 'YouTube', href: 'https://youtube.com/@tradingo' },
]
export const FOOTER_SELLER_LINKS = [
  { label: 'Start Selling', href: '/register' },
  { label: 'Seller Dashboard', href: '/seller/dashboard' },
  { label: 'Seller Plans', href: '/seller-plans' },
  { label: 'Seller Resources', href: '/for-sellers' },
]
export const FOOTER_BUYER_LINKS = [
  { label: 'Browse Products', href: '/products' },
  { label: 'Post RFQ', href: '/rfq' },
  { label: 'Buyer Dashboard', href: '/buyer/dashboard' },
  { label: 'Buyer Resources', href: '/for-buyers' },
]

// ─── PLATFORM STATS ──────────────────────────────────────────────
export const MASTER_PLATFORM_STATS = {
  liveStats: [
    { value: '12,847', label: 'Products Listed', change: '+12%', positive: true },
    { value: '8,432', label: 'Active Traders', change: '+8%', positive: true },
    { value: '\u20B92.4Cr', label: 'Trading Volume (24h)', change: '+15%', positive: true },
    { value: '156', label: 'Live RFQs', change: '+23%', positive: true },
  ],
  indiaStats: [
    { icon: 'Globe', label: 'States & UTs', display: '36', color: '#D4AF37' },
    { icon: 'Building2', label: 'Cities Covered', display: '2.9K+', color: '#60A5FA' },
    { icon: 'Store', label: 'Sellers', display: '1.8L+', color: '#F472B6' },
    { icon: 'Package', label: 'Products', display: '1.0Cr+', color: '#A78BFA' },
    { icon: 'Wrench', label: 'Services', display: '38.2L+', color: '#FBBF24' },
    { icon: 'Users', label: 'Buyers', display: '5.2L+', color: '#34D399' },
    { icon: 'DollarSign', label: 'Trade Volume', display: '\u20B92840Cr+', color: '#34D399' },
    { icon: 'Shield', label: 'Verified', display: '98.5K+', color: '#60A5FA' },
  ],
  indiaPills: [
    '36 States & UTs', 'Manufacturing Clusters', 'Product Ecosystems',
    'Verified Businesses', 'Live RFQ Intelligence', 'Export Opportunities',
  ],
}

// ─── TRADHEXA ENGINES ────────────────────────────────────────────
export interface MasterEngine {
  id: string; name: string; tagline: string; description: string;
  subtitle?: string; color: string; href?: string
}
export const MASTER_ENGINES: MasterEngine[] = [
  { id: 'TRADFIND', name: 'TRADFIND', tagline: 'Smart Discovery', subtitle: 'Smart Discovery', description: 'AI-powered search across 33,600+ products and services. Hindi, English, Hinglish supported.', color: '#3D8BFF', href: '/tradhexa/tradfind' },
  { id: 'TRADMATCH', name: 'TRADMATCH', tagline: 'AI Matchmaking', subtitle: 'AI Matchmaking', description: 'Your RFQ is auto-routed to the top 20 verified vendors using scoring: category, location, trust, response rate.', color: '#9B5DE5', href: '/tradhexa/tradmatch' },
  { id: 'TRADRFQ', name: 'TRADRFQ', tagline: 'RFQ & Negotiation', subtitle: 'RFQ & Negotiation', description: 'Post bulk requirements, receive multi-vendor quotes, compare, negotiate, and convert to order.', color: '#F15BB5', href: '/tradhexa/tradrfq' },
  { id: 'TRADCONNECT', name: 'TRADCONNECT', tagline: 'Secure Chat', subtitle: 'Secure Chat', description: 'WhatsApp-style B2B chat. Phone numbers are never shared. Direct connect between buyers and sellers.', color: '#2DE0E0', href: '/tradhexa/tradconnect' },
  { id: 'TRADTRUST', name: 'TRADTRUST', tagline: 'Verification', subtitle: 'Verification', description: '5-layer KYC: PAN, GST, Aadhaar, Business Registration, Bank. Trust score shown on every seller.', color: '#F2C94C', href: '/tradhexa/tradtrust' },
  { id: 'TRADZERO', name: 'TRADZERO', tagline: 'Zero-Risk Payments', subtitle: 'Zero-Risk Payments', description: 'Escrow holds your payment. Released to seller only after you confirm delivery. Dispute resolution included.', color: '#FF7A3D', href: '/tradhexa/tradzero' },
  { id: 'TRADBUY', name: 'TRADBUY', tagline: 'Instant Purchase', description: 'Buy products instantly at listed prices with secure payment processing and automated order matching.', color: '#3B82F6', href: '/tradbuy' },
  { id: 'TRADGO', name: 'TRADGO', tagline: 'Gamified Trading', description: 'Participate in trading races, earn badges, climb leaderboards, and unlock exclusive seller perks.', color: '#F43F5E', href: '/tradgo' },
  { id: 'GOCASH', name: 'GOCASH', tagline: 'Rewards Engine', description: 'Earn GOCASH rewards on every successful trade and redeem them for platform benefits and discounts.', color: '#F59E0B', href: '/gocash' },
]

// ─── SEARCH CONFIG ───────────────────────────────────────────────
export const SEARCH_PLACEHOLDERS = [
  'Search products, services, companies or ask AI...',
  '"CNC machine suppliers in Pune"',
  '"GST consultant near me"',
  '"LED bulb manufacturer in Delhi"',
  '"Best packaging companies for food business"',
  '"Verified steel supplier under Rs 50,000 MOQ"',
]
export const SEARCH_MODES = [
  { key: 'all' as const, label: 'All' },
  { key: 'products' as const, label: 'Products' },
  { key: 'services' as const, label: 'Services' },
  { key: 'companies' as const, label: 'Tradors' },
]

// ─── GEO / NEAR-TO-FAR ──────────────────────────────────────────
export const GEO_RINGS = [
  { ring: 1, scope: 'near_me',    label: 'My Area',     color: '#FF4D00', description: 'Within 5 km' },
  { ring: 2, scope: 'city',       label: 'My City',     color: '#FF7A3D', description: 'Within city limits' },
  { ring: 3, scope: 'district',   label: 'My District', color: '#F2C94C', description: 'Same district' },
  { ring: 4, scope: 'state',      label: 'My State',    color: '#2DE0E0', description: 'Same state' },
  { ring: 5, scope: 'pan_india',  label: 'Pan India',  color: '#3D8BFF', description: 'All India' },
  { ring: 6, scope: 'global',     label: 'Global',      color: '#9B5DE5', description: 'Worldwide' },
]

// ─── HERO VENDOR SLIDES ───────────────────────────────────────────
export interface HeroVendorSlide {
  id: number
  vendorName: string
  tagline: string
  category: string
  banner: string
  logo?: string
  badge: 'ELITE' | 'PREMIUM' | 'VERIFIED' | 'ENTERPRISE'
  stats: { label: string; value: string }[]
  offer?: string
  cta: string
  ctaHref: string
  accentColor: string
}
export const HERO_VENDOR_SLIDES: HeroVendorSlide[] = [
  { id: 1, vendorName: 'Anand Steels & Metals', tagline: 'Premium Steel & Metal Products Since 1998', category: 'Industrial Machinery', banner: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&q=80', logo: undefined, badge: 'ELITE', stats: [{ label: 'Revenue', value: '₹45Cr+' }, { label: 'Orders', value: '12.5K+' }, { label: 'Happy Clients', value: '2,800+' }], offer: 'Free delivery on orders above ₹1L', cta: 'View Products', ctaHref: '/products', accentColor: '#FF4D00' },
  { id: 2, vendorName: 'Green Earth Pharma', tagline: 'Trusted Pharmaceutical Manufacturer', category: 'Pharmaceuticals', banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80', logo: undefined, badge: 'ELITE', stats: [{ label: 'Revenue', value: '₹120Cr+' }, { label: 'Orders', value: '45K+' }, { label: 'Happy Clients', value: '5,200+' }], offer: 'Bulk order discount up to 15%', cta: 'Explore Range', ctaHref: '/products', accentColor: '#10B981' },
  { id: 3, vendorName: 'TexFab India', tagline: 'India\'s Leading Textile Exporter', category: 'Textiles & Apparel', banner: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80', logo: undefined, badge: 'ELITE', stats: [{ label: 'Revenue', value: '₹280Cr+' }, { label: 'Orders', value: '89K+' }, { label: 'Happy Clients', value: '12,000+' }], offer: 'Sample free on first order', cta: 'Shop Now', ctaHref: '/products', accentColor: '#8B5CF6' },
  { id: 4, vendorName: 'Precision Auto Parts', tagline: 'OEM & Aftermarket Auto Components', category: 'Automotive', banner: 'https://images.unsplash.com/photo-1563903530908-af12d1551ac4?w=1200&q=80', logo: undefined, badge: 'ELITE', stats: [{ label: 'Revenue', value: '₹520Cr+' }, { label: 'Orders', value: '2.5L+' }, { label: 'Happy Clients', value: '18,000+' }], offer: 'Bulk pricing available', cta: 'View Catalog', ctaHref: '/products', accentColor: '#3D8BFF' },
  { id: 5, vendorName: 'VoltTech Solar Solutions', tagline: 'Powering India\'s Solar Future', category: 'Renewable Energy', banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80', logo: undefined, badge: 'VERIFIED', stats: [{ label: 'Revenue', value: '₹85Cr+' }, { label: 'Orders', value: '18K+' }, { label: 'Happy Clients', value: '3,400+' }], offer: 'Free site survey', cta: 'Get Quote', ctaHref: '/products', accentColor: '#F59E0B' },
]

// ─── SELLER BENEFITS ──────────────────────────────────────────────
export interface BenefitCard {
  icon: string; title: string; description: string
}
export const HOMEPAGE_SELLER_BENEFITS: BenefitCard[] = [
  { icon: 'Globe', title: 'Pan-India Reach', description: 'Showcase your products to millions of buyers across India and emerging international markets.' },
  { icon: 'Shield', title: 'Verified Trust', description: 'Build credibility with TRADTRUST 5-layer verification and display your trust score.' },
  { icon: 'Zap', title: 'Smart Matchmaking', description: 'TRADMATCH AI routes the right RFQs to you based on category, location, and trust score.' },
  { icon: 'BarChart3', title: 'Real-Time Analytics', description: 'Track impressions, inquiries, and conversions with powerful seller dashboard analytics.' },
  { icon: 'Award', title: 'TRADGO Gamification', description: 'Participate in trading races, earn GOCASH rewards, and unlock Elite Seller status.' },
  { icon: 'Wallet', title: 'Secure Payments', description: 'Get paid on time with TRADZERO escrow protection and instant settlement options.' },
]

// ─── BUYER BENEFITS ───────────────────────────────────────────────
export const HOMEPAGE_BUYER_BENEFITS: BenefitCard[] = [
  { icon: 'Search', title: 'Smart Discovery', description: 'TRADFIND AI searches across 33K+ products and services in Hindi, English, and Hinglish.' },
  { icon: 'FileText', title: 'Smart RFQ', description: 'Post bulk requirements once and receive competitive quotes from top verified vendors automatically.' },
  { icon: 'Shield', title: 'Trust & Safety', description: 'Every seller is verified. View trust scores, ratings, and real reviews before connecting.' },
  { icon: 'MessageSquare', title: 'TRADCONNECT Chat', description: 'Chat securely with sellers. Phone numbers are never shared. Full communication history.' },
  { icon: 'ShoppingCart', title: 'TRADBUY Instant', description: 'Buy products instantly at listed prices with secure payment processing and fast delivery.' },
  { icon: 'Gift', title: 'GOCASH Rewards', description: 'Earn GOCASH rewards on every purchase and redeem them for discounts on future orders.' },
]

// ─── SUCCESS STORIES ─────────────────────────────────────────────
export interface SuccessStory {
  name: string; company: string; role: string; image: string
  quote: string; metric: string; metricLabel: string
  author: string; rating: number
}
export const HOMEPAGE_SUCCESS_STORIES: SuccessStory[] = [
  { name: 'Rajesh Mehta', company: 'Mehta Engineering Works', role: 'Owner', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80', quote: 'TRADINGO helped us expand from local to pan-India. Our sales have grown 3x since joining the platform.', metric: '3x', metricLabel: 'Revenue Growth', author: 'Rajesh Mehta', rating: 5 },
  { name: 'Priya Sharma', company: 'Sharma Pharmaceuticals', role: 'Director', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80', quote: 'The TRADMATCH system brings us qualified buyers. We save 20+ hours per week on lead qualification.', metric: '20+ hrs', metricLabel: 'Weekly Saved', author: 'Priya Sharma', rating: 5 },
  { name: 'Amit Verma', company: 'Verma Packaging Solutions', role: 'CEO', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80', quote: 'GOCASH rewards and TRADGO races make trading fun. We earned \u20B91.2L in GOCASH last quarter.', metric: '\u20B91.2L', metricLabel: 'GOCASH Earned', author: 'Amit Verma', rating: 5 },
  { name: 'Sunita Patel', company: 'Patel Agro Products', role: 'Founder', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80', quote: 'From farmer to exporter \u2014 TRADINGO connected us with international buyers. Now we export to 6 countries.', metric: '6', metricLabel: 'Export Countries', author: 'Sunita Patel', rating: 5 },
]

// ─── PLATFORM FEATURES ────────────────────────────────────────────
export interface FeatureCard {
  icon: string; title: string; description: string; color?: string
}
export const FEATURES_SELLER: FeatureCard[] = [
  { icon: 'Store', title: 'Seller Dashboard', description: 'Manage products, track orders, view analytics, and respond to RFQs from one unified dashboard.' },
  { icon: 'Globe', title: 'Multi-City Presence', description: 'List in 15+ Indian cities and reach buyers across states with location-based discovery.' },
  { icon: 'TrendingUp', title: 'Growth Analytics', description: 'AI-powered insights on pricing trends, demand patterns, and competitor analysis.' },
  { icon: 'Shield', title: 'TRADTRUST Badge', description: 'Stand out with verified trust score, Elite Seller badge, and TRADGO Champion status.' },
  { icon: 'Wallet', title: 'GOCASH Earnings', description: 'Earn rewards on every completed transaction and boost your earnings with TRADGO races.' },
  { icon: 'Headphones', title: 'Dedicated Support', description: 'Priority support with dedicated account manager for Elite Sellers and TRADGO Champions.' },
]
export const FEATURES_BUYER: FeatureCard[] = [
  { icon: 'Search', title: 'AI-Powered Search', description: 'Find exactly what you need with natural language search in Hindi, English, and Hinglish.' },
  { icon: 'FileText', title: 'Smart RFQ Engine', description: 'Post requirements once, receive quotes from top verified vendors within 24 hours.' },
  { icon: 'MessageSquare', title: 'Secure Communication', description: 'Chat directly with sellers via TRADCONNECT with full privacy and history.' },
  { icon: 'Scale', title: 'Compare Products', description: 'Side-by-side comparison of products, prices, seller trust scores, and delivery timelines.' },
  { icon: 'Shield', title: 'Buyer Protection', description: 'TRADZERO escrow holds payments until you confirm delivery. Full dispute resolution included.' },
  { icon: 'Gift', title: 'GOCASH Rewards', description: 'Earn GOCASH on every purchase and redeem for discounts on future transactions.' },
]
export const FEATURES_PLATFORM: FeatureCard[] = [
  { icon: 'Cpu', title: 'TRADHEXA Engine', description: '6 integrated engines powering discovery, matchmaking, RFQ, chat, trust, and payments.' },
  { icon: 'Shield', title: '5-Layer Verification', description: 'PAN, GST, Aadhaar, Business Registration, and Bank Account verification for all sellers.' },
  { icon: 'BarChart3', title: 'Live Intelligence', description: 'Real-time market intelligence with pricing trends, demand heatmaps, and industry insights.' },
  { icon: 'Smartphone', title: 'Mobile First', description: 'Fully responsive platform optimized for mobile, tablet, and desktop with PWA support.' },
  { icon: 'Globe', title: 'Multi-Lingual', description: 'Platform available in Hindi, English, Gujarati, Tamil, Telugu, Bengali, and Marathi.' },
  { icon: 'Zap', title: '99.9% Uptime', description: 'Enterprise-grade infrastructure with AWS, CloudFront CDN, and 99.9% SLA guarantee.' },
]
export const FEATURES_TRUST: FeatureCard[] = [
  { icon: 'Shield', title: 'TRADTRUST Verification', description: 'Every seller undergoes 5-layer KYC verification. Trust scores are publicly displayed.' },
  { icon: 'Search', title: 'Transparent Ratings', description: 'Real buyer reviews and ratings. No fake reviews \u2014 verified purchase only.' },
  { icon: 'FileCheck', title: 'Dispute Resolution', description: 'Dedicated dispute resolution team with 48-hour first response SLA.' },
  { icon: 'Lock', title: 'Data Privacy', description: 'Your data is encrypted in transit and at rest. Phone numbers are never shared publicly.' },
  { icon: 'Scale', title: 'Fair Trading Policy', description: 'Strict anti-spam, anti-fraud policies with automated monitoring and human review.' },
  { icon: 'Award', title: 'Quality Guarantee', description: 'TRADBUY orders come with quality guarantee. Return or replacement within 7 days.' },
]

// ─── TRADING PAGE DATA ────────────────────────────────────────────
export const TRADING_FEATURES: FeatureCard[] = [
  { icon: 'Rocket', title: 'Smart Trading', description: 'AI-powered discovery and matchmaking for intelligent B2B trading across 33K+ products.' },
  { icon: 'Search', title: 'Multi-Engine Search', description: 'Search across TRADFIND, TRADRFQ, and TRADBUY engines for comprehensive results.' },
  { icon: 'Globe', title: 'Pan-India Network', description: 'Connect with verified sellers and buyers across 15+ cities and 36 states & UTs.' },
  { icon: 'Shield', title: 'Zero-Risk Trading', description: 'TRADZERO escrow protects both parties. Payment released only after delivery confirmation.' },
  { icon: 'BarChart3', title: 'Market Intelligence', description: 'Real-time pricing trends, demand analysis, and industry insights for informed decisions.' },
  { icon: 'Award', title: 'Rewards & Gamification', description: 'Earn GOCASH rewards and compete in TRADGO races for exclusive benefits and recognition.' },
]
export const TRADING_RFQ_STEPS = [
  { step: 1, title: 'Post Requirements', description: 'Describe what you need \u2014 product specs, quantity, budget, and delivery location.' },
  { step: 2, title: 'AI Matchmaking', description: 'TRADMATCH routes your RFQ to the top 20 verified vendors based on relevance and trust.' },
  { step: 3, title: 'Compare Quotes', description: 'Receive multi-vendor quotes, compare prices, trust scores, and delivery timelines.' },
  { step: 4, title: 'Trade with Confidence', description: 'Negotiate, finalize, and pay via TRADZERO escrow. GOCASH rewards credited on completion.' },
]
export const TRADING_STATS = [
  { icon: 'Package', value: '33,600+', label: 'Products & Services' },
  { icon: 'Store', value: '1.8L+', label: 'Verified Sellers' },
  { icon: 'Users', value: '5.2L+', label: 'Active Buyers' },
  { icon: 'DollarSign', value: '\u20B92840Cr+', label: 'Trade Volume' },
]

// ─── WHY TRADINGO ─────────────────────────────────────────────────
export interface Differentiator {
  title: string; tagline: string; icon: string; color: string
  details: string[]
}
export const WHY_DIFFERENTIATORS: Differentiator[] = [
  { title: 'TRADHEXA Engine', tagline: '6-Power Engine Under One Roof', icon: 'Cpu', color: '#3D8BFF', details: ['TRADFIND + TRADMATCH + TRADRFQ + TRADCONNECT + TRADTRUST + TRADZERO', 'Integrated search, matchmaking, RFQ, chat, verification, and payments', 'No need for multiple platforms \u2014 everything in one ecosystem'] },
  { title: 'AI-First Architecture', tagline: 'Intelligent Trading, Not Just Listing', icon: 'Brain', color: '#9B5DE5', details: ['Natural language search in Hindi, English, and Hinglish', 'AI-powered RFQ-to-seller matchmaking with 95% relevance', 'Smart pricing insights and demand forecasting'] },
  { title: 'Hyperlocal + Global', tagline: 'Near-to-Far\u2122 Discovery', icon: 'MapPin', color: '#F15BB5', details: ['Discover sellers near you first, then expand to district, state, nation, and global', '6 geo rings for precision sourcing', 'Optimized logistics with local-first matching'] },
  { title: 'Zero-Risk Transactions', tagline: 'Trade Without Worry', icon: 'Shield', color: '#2DE0E0', details: ['TRADZERO escrow protects every payment', 'Payment released only after delivery confirmation', 'Dedicated dispute resolution team'] },
  { title: 'Gamified Trading', tagline: 'Trade, Compete, Earn', icon: 'Award', color: '#F2C94C', details: ['TRADGO trading races with monthly leaderboards', 'Earn GOCASH rewards on every transaction', 'Unlock Elite Seller status and exclusive perks'] },
  { title: 'Trust-First Ecosystem', tagline: 'Verified Every Step', icon: 'Shield', color: '#FF7A3D', details: ['5-layer seller KYC verification (PAN, GST, Aadhaar, Business, Bank)', 'Public trust scores and verified purchase reviews', 'Strict anti-fraud policies with AI monitoring'] },
]
export const WHY_COMPARISON = [
  { feature: 'AI Search', tradindo: '\u2705 Natural Language AI', others: '\u274C Keyword-based' },
  { feature: 'Seller Verification', tradindo: '\u2705 5-layer KYC + Trust Score', others: '\u274C Basic email/phone' },
  { feature: 'Escrow Payments', tradindo: '\u2705 TRADZERO Zero-Risk', others: '\u274C No protection' },
  { feature: 'Geo Discovery', tradindo: '\u2705 Near-to-Far\u2122 6 Rings', others: '\u274C City/country only' },
  { feature: 'Gamification', tradindo: '\u2705 TRADGO + GOCASH Rewards', others: '\u274C None' },
  { feature: 'Multi-Lingual', tradindo: '\u2705 Hindi, English + 5 Regional', others: '\u274C English only' },
  { feature: 'Chat Privacy', tradindo: '\u2705 Number never shared', others: '\u274C Direct contact exposure' },
  { feature: 'Analytics', tradindo: '\u2705 AI-powered insights', others: '\u274C Basic counters' },
  { feature: 'Mobile Experience', tradindo: '\u2705 PWA + Responsive', others: '\u274C Desktop-only' },
]

// ─── ABOUT TRADINGO ──────────────────────────────────────────────
export const ABOUT_MILESTONES = [
  { year: '2023', title: 'Platform Founded', description: 'TRADINGO was conceptualized and built on the TRADHEXA engine architecture.' },
  { year: '2024 Q1', title: 'Beta Launch', description: 'Launched beta with 500+ sellers and 5,000+ products across 10 categories.' },
  { year: '2024 Q3', title: 'TRADHEXA Launch', description: 'Full TRADHEXA 6-engine platform launched. Crossed 10,000 registered sellers.' },
  { year: '2025 Q1', title: 'Pan-India Expansion', description: 'Expanded to 36 states & UTs. Crossed 50,000 products and 1.8L sellers.' },
  { year: '2025 Q3', title: 'TRADGO & GOCASH', description: 'Launched gamification and rewards engine. Monthly trading volume crossed \u20B9200Cr.' },
  { year: '2026', title: 'Global Expansion', description: 'Expanding to South Asia, SE Asia, and Middle East. Targeting \u20B91000Cr trade volume.' },
]
export const ABOUT_VALUES = [
  { icon: 'Shield', title: 'Trust First', description: 'Every decision we make prioritizes trust. Our 5-layer verification sets the industry standard.' },
  { icon: 'Lightbulb', title: 'Innovation', description: 'We continuously innovate with AI, gamification, and hyperlocal technology to transform B2B trade.' },
  { icon: 'Users', title: 'Community', description: 'We build an ecosystem where buyers, sellers, and service providers grow together.' },
  { icon: 'Globe', title: 'Global Mindset', description: 'Born in India, built for the world. We empower Indian businesses to trade globally.' },
  { icon: 'BarChart3', title: 'Transparency', description: 'Open trust scores, transparent pricing, and clear policies. No hidden fees or surprises.' },
  { icon: 'Heart', title: 'Empathy', description: 'We understand the challenges of small businesses and design solutions that truly help.' },
]
export const ABOUT_TEAM = [
  { name: 'Aryan Khanna', role: 'Founder & CEO', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', bio: 'Visionary entrepreneur with 15+ years in B2B tech and supply chain innovation.' },
  { name: 'Neha Gupta', role: 'CTO', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', bio: 'AI and platform architecture expert. Previously led engineering at major e-commerce platforms.' },
  { name: 'Vikram Singh', role: 'COO', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', bio: 'Operations and supply chain veteran with deep experience in Indian manufacturing ecosystems.' },
  { name: 'Ananya Reddy', role: 'CPO', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', bio: 'Product leader specializing in B2B marketplace experiences, gamification, and user trust systems.' },
]
export const ABOUT_TESTIMONIALS = HOMEPAGE_SUCCESS_STORIES

// ─── PRICING PLANS ────────────────────────────────────────────────
export interface PricingPlan {
  name: string; price: string; period: string; description: string; popular: boolean
  features: string[]; cta: string; color: string; href: string
}
export const SELLER_PRICING_PLANS: PricingPlan[] = [
  { name: 'Starter', price: '\u20B90', period: 'forever', description: 'Perfect for new sellers exploring the platform.', popular: false, features: ['List up to 50 products', 'Basic seller dashboard', 'Standard search visibility', 'Email support', 'Community access'], cta: 'Get Started Free', color: '#6B7280', href: '/register' },
  { name: 'Professional', price: '\u20B92,999', period: '/month', description: 'For serious sellers ready to grow their business.', popular: true, features: ['Unlimited product listings', 'Advanced analytics dashboard', 'Priority search ranking', 'TRADMATCH priority routing', 'TRADGO race participation', 'GOCASH rewards (2% per sale)', 'Chat & email support', 'Dedicated account manager'], cta: 'Start 14-Day Free Trial', color: '#3D8BFF', href: '/register?plan=professional' },
  { name: 'Enterprise', price: '\u20B914,999', period: '/month', description: 'For large enterprises and wholesale distributors.', popular: false, features: ['Everything in Professional', 'Elite Seller badge', 'API integration', 'Multi-user access (up to 10)', 'Custom catalog management', 'Bulk product upload via CSV/API', 'TRADZERO priority settlement', '24/7 phone & email support', 'Dedicated success manager', 'Custom integrations'], cta: 'Contact Sales', color: '#9B5DE5', href: '/contact?inquiry=enterprise' },
]
export const LAUNCH_PRICING_PLANS: PricingPlan[] = [
  { name: 'Early Bird', price: '\u20B9999', period: '/month', description: 'Special launch pricing for early adopters. Limited seats.', popular: false, features: ['List up to 100 products', 'Seller dashboard', 'TRADFIND visibility', 'Email support', 'GOCASH rewards (1% per sale)'], cta: 'Claim Early Bird', color: '#F59E0B', href: '/register?plan=early-bird' },
  { name: 'Growth', price: '\u20B91,999', period: '/month', description: 'For growing businesses scaling their online presence.', popular: true, features: ['Unlimited product listings', 'Advanced analytics', 'Priority search ranking', 'TRADMATCH routing', 'TRADGO participation', 'GOCASH rewards (3% per sale)', 'Chat & email support'], cta: 'Start Free Trial', color: '#3D8BFF', href: '/register?plan=growth' },
  { name: 'Ultimate', price: '\u20B99,999', period: '/month', description: 'The complete package for market leaders and distributors.', popular: false, features: ['Everything in Growth', 'Elite Seller badge', 'API access', 'Multi-user (up to 5)', 'Bulk upload', 'Priority support', 'Dedicated manager', 'Custom onboarding'], cta: 'Go Ultimate', color: '#9B5DE5', href: '/register?plan=ultimate' },
]

// ─── SELLER PLANS FAQ ─────────────────────────────────────────────
export interface FAQItem {
  question: string; answer: string
}
export const SELLER_PLANS_FAQ: FAQItem[] = [
  { question: 'Can I switch plans anytime?', answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
  { question: 'Is there a long-term contract?', answer: 'No. All plans are month-to-month. You can cancel anytime with no penalties.' },
  { question: 'What payment methods are accepted?', answer: 'We accept all major credit cards, debit cards, UPI, net banking, and GOCASH balance.' },
  { question: 'Are there any hidden fees?', answer: 'None. The price shown is the price you pay. No listing fees, no commission on sales, no hidden charges.' },
]

// ─── TRADGO DATA ──────────────────────────────────────────────────
export interface TradgoBadge {
  name: string; icon: string; description: string; color: string; requirement: string
}
export const TRADGO_BADGES: TradgoBadge[] = [
  { name: 'Rising Star', icon: 'Star', description: 'Awarded to new sellers with 10+ successful trades in first 30 days.', color: '#FBBF24', requirement: '10 trades in 30 days' },
  { name: 'Elite Seller', icon: 'Crown', description: 'Top 5% sellers by trade volume, rating, and response time. Exclusive perks.', color: '#D4AF37', requirement: 'Top 5% by volume' },
  { name: 'TRADGO Champion', icon: 'Trophy', description: 'Monthly race winner with highest trade volume and fastest response time.', color: '#F43F5E', requirement: 'Monthly race winner' },
  { name: 'Trust Guardian', icon: 'Shield', description: 'Perfect 5.0 rating with 100+ reviews and zero disputes.', color: '#3D8BFF', requirement: '100+ reviews, 5.0 rating' },
  { name: 'Export Hero', icon: 'Globe', description: 'Sellers who successfully export to 5+ countries through TRADINGO.', color: '#2DE0E0', requirement: 'Export to 5+ countries' },
  { name: 'GOCASH Millionaire', icon: 'Zap', description: 'Earn \u20B910L+ in total GOCASH rewards through trades and races.', color: '#F59E0B', requirement: '\u20B910L+ GOCASH earned' },
]
export const TRADGO_PRIZES = [
  { rank: 1, title: 'Gold', prize: '\u20B950,000 GOCASH', badge: 'TRADGO Champion', color: '#D4AF37', description: 'Plus featured seller badge for 30 days, priority TRADMATCH routing, and dedicated account manager.' },
  { rank: 2, title: 'Silver', prize: '\u20B925,000 GOCASH', badge: 'Elite Seller Boost', color: '#9CA3AF', description: 'Plus boosted search ranking for 30 days and priority support.' },
  { rank: 3, title: 'Bronze', prize: '\u20B910,000 GOCASH', badge: 'Rising Star', color: '#CD7F32', description: 'Plus featured in "Top Rated" section for 15 days.' },
]
export const TRADGO_RACE_FEATURES: FeatureCard[] = [
  { icon: 'Zap', title: 'Monthly Races', description: 'Compete every month. Top sellers win GOCASH prizes, badges, and platform visibility boosts.' },
  { icon: 'BarChart3', title: 'Live Leaderboard', description: 'Track your rank in real-time. See competitor performance and your progress towards the next tier.' },
  { icon: 'Gift', title: 'Exclusive Rewards', description: 'Race winners get GOCASH bonuses, Elite Seller badges, priority TRADMATCH routing, and more.' },
]

// ─── GOCASH DATA ──────────────────────────────────────────────────
export const GOCASH_EARN_FEATURES: FeatureCard[] = [
  { icon: 'ShoppingCart', title: 'Earn on Every Trade', description: 'Earn GOCASH on every successful purchase or sale. Rates vary by plan and transaction volume.' },
  { icon: 'Award', title: 'TRADGO Bonuses', description: 'Win GOCASH prizes in monthly TRADGO races. Top 3 sellers win big every month.' },
  { icon: 'Users', title: 'Referral Rewards', description: 'Refer other businesses to TRADINGO and earn 5% of their GOCASH earnings for the first 6 months.' },
]
export const GOCASH_REDEMPTIONS = [
  { icon: 'ArrowDownUp', title: 'Discount on Purchases', description: 'Redeem GOCASH for instant discounts on your purchases. 100 GOCASH = \u20B9100 off.', color: '#FBBF24' },
  { icon: 'TrendingUp', title: 'Boost Your Listings', description: 'Spend GOCASH to boost your product listings in search results for 7 days.', color: '#3D8BFF' },
  { icon: 'Zap', title: 'Priority TRADMATCH', description: 'Redeem GOCASH for priority TRADMATCH routing. Your RFQs reach top sellers first.', color: '#9B5DE5' },
  { icon: 'Shield', title: 'Reduced Commission', description: 'Elite Sellers can redeem GOCASH to reduce platform commission on high-value transactions.', color: '#F43F5E' },
]
export const GOCASH_TIERS = [
  { tier: 'Bronze', range: '0 \u2013 5,000 GOCASH', color: '#CD7F32', bg: 'rgba(205,127,50,0.1)', border: 'rgba(205,127,50,0.3)', min: 0, earnRate: '1%', popular: false, features: ['Basic rewards rate (1%)', 'Standard support', 'Community access'], perks: ['Basic rewards rate (1%)', 'Standard support', 'Community access'] },
  { tier: 'Silver', range: '5,001 \u2013 20,000 GOCASH', color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)', min: 5001, earnRate: '2%', popular: false, features: ['Increased rewards rate (2%)', 'Priority email support', 'Monthly TRADGO access', 'Featured in searches'], perks: ['Increased rewards rate (2%)', 'Priority email support', 'Monthly TRADGO access', 'Featured in searches'] },
  { tier: 'Gold', range: '20,001 \u2013 50,000 GOCASH', color: '#D4AF37', bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.3)', min: 20001, earnRate: '3%', popular: true, features: ['Premium rewards rate (3%)', 'Priority chat & email support', 'Elite Seller badge', 'Dedicated account manager', 'API access'], perks: ['Premium rewards rate (3%)', 'Priority chat & email support', 'Elite Seller badge', 'Dedicated account manager', 'API access'] },
  { tier: 'Platinum', range: '50,001+ GOCASH', color: '#9B5DE5', bg: 'rgba(155,93,229,0.1)', border: 'rgba(155,93,229,0.3)', min: 50001, earnRate: '5%', popular: false, features: ['Max rewards rate (5%)', '24/7 priority support', 'All Gold perks', 'Custom integrations', 'Beta feature access', 'Invite-only events'], perks: ['Max rewards rate (5%)', '24/7 priority support', 'All Gold perks', 'Custom integrations', 'Beta feature access', 'Invite-only events'] },
]
export const GOCASH_EARNING_RATES = [
  { action: 'Product Sale (Professional Plan)', type: 'Sale', rate: '2%', cap: '\u20B950,000/month', minGocash: 0 },
  { action: 'Product Sale (Enterprise Plan)', type: 'Sale', rate: '3%', cap: '\u20B92,00,000/month', minGocash: 0 },
  { action: 'TRADGO Race Winner (Gold)', type: 'Race', rate: 'N/A', cap: '\u20B950,000 one-time', minGocash: 0 },
  { action: 'Referral Bonus', type: 'Referral', rate: '5% of referral earnings', cap: '6 months per referrral', minGocash: 0 },
  { action: 'Bulk Purchase Discount', type: 'Discount', rate: 'Extra 1%', cap: 'On orders above \u20B95L', minGocash: 0 },
]

// ─── LAUNCH PAGE DATA ─────────────────────────────────────────────
export const LAUNCH_FEATURES: FeatureCard[] = [
  { icon: 'Rocket', title: 'Early Adopter Benefits', description: 'Get exclusive pricing, priority support, and early access to new features as a launch partner.' },
  { icon: 'Shield', title: 'Zero Commission Launch', description: 'No commission on sales for the first 3 months. Keep 100% of your revenue.' },
  { icon: 'Award', title: 'Founder Badge', description: 'Permanent "Founder Member" badge on your profile. Recognition as a platform pioneer.' },
  { icon: 'BarChart3', title: 'Premium Analytics', description: 'Free access to premium analytics dashboard for 6 months. Worth \u20B918,000.' },
  { icon: 'Globe', title: 'Marketing Boost', description: 'Featured placement in launch campaigns. Social media spotlight and newsletter inclusion.' },
  { icon: 'Users', title: 'Community Access', description: 'Exclusive WhatsApp community of launch members. Direct access to founding team.' },
]
export const LAUNCH_TESTIMONIALS: SuccessStory[] = [
  { name: 'Ravi Agarwal', author: 'Ravi Agarwal', company: 'Agarwal Industries', role: 'CEO', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80', quote: 'Being a launch partner has been incredible. The zero-commission period helped us save \u20B92.5L.', metric: '\u20B92.5L', metricLabel: 'Saved', rating: 5 },
  { name: 'Kavita Joshi', author: 'Kavita Joshi', company: 'Joshi Exports', role: 'Director', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80', quote: 'The Founder Badge gives us instant credibility. Buyers trust us more because we were here from day one.', metric: '40%', metricLabel: 'Higher Trust Score', rating: 5 },
  { name: 'Deepak Shah', author: 'Deepak Shah', company: 'Shah Packaging', role: 'Owner', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80', quote: 'Premium analytics helped us identify the right pricing. Our conversion rate improved by 60%.', metric: '60%', metricLabel: 'Conversion Improvement', rating: 5 },
  { name: 'Meera Nair', author: 'Meera Nair', company: 'Nair Food Products', role: 'Founder', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80', quote: 'The launch community is amazing. Direct access to the team means our feedback shapes the platform.', metric: '25+', metricLabel: 'Features Influenced', rating: 5 },
]
export const LAUNCH_STATS = [
  { value: 500, suffix: '+', label: 'Launch Partners' },
  { value: 45, prefix: '\u20B9', suffix: 'Cr+', label: 'Launch Phase Trade Volume' },
  { value: 50000, suffix: '+', label: 'Products Listed' },
  { value: 98.5, suffix: '%', label: 'Seller Satisfaction' },
]

// ─── CONTACT DATA ─────────────────────────────────────────────────
export const CONTACT_METHODS = [
  { label: 'Email', icon: 'Mail', title: 'Email Us', description: 'Our team typically responds within 24 hours.', action: 'hello@tradingo.in', href: 'mailto:hello@tradingo.in', value: 'hello@tradingo.in', subtitle: 'Email' },
  { label: 'Phone', icon: 'Phone', title: 'Call Us', description: 'Monday to Saturday, 10 AM to 7 PM IST.', action: '+91 9999 0000 00', href: 'tel:+919999000000', value: '+91 9999 0000 00', subtitle: 'Phone' },
  { label: 'Visit', icon: 'MapPin', title: 'Visit Us', description: 'Come say hello at our headquarters.', action: 'Indore, Madhya Pradesh, India', href: 'https://maps.google.com/?q=Indore', value: 'Indore, Madhya Pradesh, India', subtitle: 'Office' },
]
export const BUSINESS_HOURS = [
  { day: 'Weekdays', hours: '9:00 AM – 8:00 PM IST', label: 'Monday – Friday', value: '9:00 AM – 8:00 PM IST', time: '9:00 AM – 8:00 PM IST', dayLabel: 'Monday – Friday' },
  { day: 'Saturday', hours: '10:00 AM – 6:00 PM IST', label: 'Saturday', value: '10:00 AM – 6:00 PM IST', time: '10:00 AM – 6:00 PM IST', dayLabel: 'Saturday' },
  { day: 'Sunday', hours: 'Closed', label: 'Sunday', value: 'Closed', time: 'Closed', dayLabel: 'Sunday' },
]

// ─── PRESS KIT DATA ──────────────────────────────────────────────
export const PRESS_KIT_FACTS = [
  { label: 'Founded', value: '2023' },
  { label: 'Headquarters', value: 'Indore, Madhya Pradesh, India' },
  { label: 'Platform', value: 'TRADHEXA B2B Marketplace' },
  { label: 'Sellers', value: '1.8L+' },
  { label: 'Buyers', value: '5.2L+' },
  { label: 'Products', value: '33,600+' },
  { label: 'Trade Volume', value: '\u20B92840Cr+' },
  { label: 'Coverage', value: '36 States & UTs, 15+ Cities' },
]
export const PRESS_BRAND_ASSETS = [
  { name: 'TRADINGO Logo (PNG)', type: 'PNG', size: '500KB', url: '/brand/logo.png', description: 'Primary TRADINGO logo on transparent background', variant: 'Primary' },
  { name: 'TRADINGO Logo (SVG)', type: 'SVG', size: '45KB', url: '/brand/logo.svg', description: 'Vector TRADINGO logo for web and print', variant: 'Primary' },
  { name: 'TRADINGO Icon (PNG)', type: 'PNG', size: '120KB', url: '/brand/icon.png', description: 'TRADINGO favicon and app icon', variant: 'Icon' },
  { name: 'TRADHEXA Logo (PNG)', type: 'PNG', size: '350KB', url: '/brand/tradhexa-logo.png', description: 'TRADHEXA engine architecture logo', variant: 'Secondary' },
  { name: 'Brand Guidelines (PDF)', type: 'PDF', size: '2.4MB', url: '/brand/guidelines.pdf', description: 'Complete brand usage and style guide', variant: 'Document' },
  { name: 'Color Palette', type: 'PDF', size: '180KB', url: '/brand/palette.pdf', description: 'Official TRADINGO color palette and hex codes', variant: 'Document' },
]
export const PRESS_SCREENSHOTS = [
  { name: 'Homepage', title: 'Homepage', url: '/screenshots/home.jpg', description: 'TRADINGO homepage with hero section' },
  { name: 'Product Discovery', title: 'Product Discovery', url: '/screenshots/discovery.jpg', description: 'AI-powered search and filter interface' },
  { name: 'Seller Dashboard', title: 'Seller Dashboard', url: '/screenshots/dashboard.jpg', description: 'Seller analytics and management dashboard' },
  { name: 'TRADGO Races', title: 'TRADGO Races', url: '/screenshots/tradgo.jpg', description: 'Gamified trading race leaderboard' },
  { name: 'Mobile View', title: 'Mobile View', url: '/screenshots/mobile.jpg', description: 'Responsive mobile interface' },
  { name: 'TRADHEXA Engines', title: 'TRADHEXA Engines', url: '/screenshots/engines.jpg', description: '6-engine architecture overview' },
]
export const PRESS_LEADERSHIP = [
  { name: 'Aryan Khanna', role: 'Founder & CEO', image: '/team/aryan-khanna.jpg', bio: 'Visionary entrepreneur with 15+ years in B2B tech and supply chain innovation.' },
  { name: 'Neha Gupta', role: 'Chief Technology Officer', image: '/team/neha-gupta.jpg', bio: 'AI and platform architecture expert. Previously led engineering at major e-commerce platforms.' },
  { name: 'Vikram Singh', role: 'Chief Operating Officer', image: '/team/vikram-singh.jpg', bio: 'Operations and supply chain veteran with deep experience in Indian manufacturing ecosystems.' },
  { name: 'Ananya Reddy', role: 'Chief Product Officer', image: '/team/ananya-reddy.jpg', bio: 'Product leader specializing in B2B marketplace experiences, gamification, and user trust systems.' },
  { name: 'Rahul Verma', role: 'VP of Engineering', image: '/team/rahul-verma.jpg', bio: 'Engineering leader with expertise in scalable platform architecture and distributed systems.' },
  { name: 'Sneha Patel', role: 'VP of Marketing', image: '/team/sneha-patel.jpg', bio: 'Marketing strategist driving B2B brand growth and community building across India.' },
]
export const PRESS_MENTIONS = [
  'YourStory', 'Economic Times', 'Business Standard', 'Inc42',
  'Entrepreneur India', 'The Hindu Business Line', 'Financial Express', 'Outlook Business',
]

// ─── DASHBOARD NAVIGATION ─────────────────────────────────────────
export interface NavItem {
  label: string; href: string; icon: string; badge?: string
}
export const DASHBOARD_SELLER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/seller/dashboard', icon: 'LayoutDashboard' },
  { label: 'Inbox', href: '/seller/inbox', icon: 'MessageSquare' },
  { label: 'Products', href: '/seller/products', icon: 'Package' },
  { label: 'Orders', href: '/seller/order', icon: 'ShoppingCart' },
  { label: 'Shipments', href: '/seller/shipment', icon: 'Truck' },
  { label: 'Deliveries', href: '/seller/delivery', icon: 'PackageCheck' },
  { label: 'RFQs Received', href: '/seller/rfq', icon: 'FileText' },
  { label: 'Quotes', href: '/seller/quote', icon: 'DollarSign' },
  { label: 'Negotiations', href: '/seller/negotiation', icon: 'Handshake' },
  { label: 'Purchase Orders', href: '/seller/po', icon: 'FileCheck' },
  { label: 'Analytics', href: '/seller/analytics', icon: 'BarChart3' },
  { label: 'TRADGO', href: '/seller/tradgo', icon: 'Trophy' },
  { label: 'GOCASH', href: '/seller/gocash', icon: 'Wallet' },
  { label: 'Reviews', href: '/seller/reviews', icon: 'Star' },
  { label: 'Support', href: '/seller/support', icon: 'Headphones', badge: 'New' },
  { label: 'Settings', href: '/seller/settings', icon: 'Settings' },
]
export const DASHBOARD_BUYER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/buyer/dashboard', icon: 'LayoutDashboard' },
  { label: 'Inbox', href: '/buyer/inbox', icon: 'MessageSquare' },
  { label: 'My RFQs', href: '/buyer/rfq', icon: 'FileText' },
  { label: 'Quotes', href: '/buyer/quote', icon: 'DollarSign' },
  { label: 'Negotiations', href: '/buyer/negotiation', icon: 'Handshake' },
  { label: 'Purchase Orders', href: '/buyer/po', icon: 'FileCheck' },
  { label: 'Saved Products', href: '/buyer/saved-products', icon: 'Heart' },
  { label: 'Requirements', href: '/buyer/requirements', icon: 'ClipboardList' },
  { label: 'Orders', href: '/buyer/order', icon: 'ShoppingCart' },
  { label: 'Shipments', href: '/buyer/shipment', icon: 'Truck' },
  { label: 'Deliveries', href: '/buyer/delivery', icon: 'PackageCheck' },
  { label: 'Suppliers', href: '/buyer/suppliers', icon: 'Store' },
  { label: 'Notifications', href: '/buyer/notifications', icon: 'Bell' },
  { label: 'Downloads', href: '/buyer/downloads', icon: 'Download' },
  { label: 'Analytics', href: '/buyer/analytics', icon: 'BarChart3' },
  { label: 'Compare', href: '/compare', icon: 'Scale' },
  { label: 'GOCASH', href: '/buyer/gocash', icon: 'Wallet' },
  { label: 'Support', href: '/buyer/support', icon: 'Headphones' },
  { label: 'Settings', href: '/buyer/settings', icon: 'Settings' },
]
export const DASHBOARD_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'Communication', href: '/admin/communication', icon: 'MessageSquare' },
  { label: 'Users', href: '/admin/users', icon: 'Users' },
  { label: 'Products', href: '/admin/products', icon: 'Package' },
  { label: 'Categories', href: '/admin/categories', icon: 'Grid3X3' },
  { label: 'RFQs', href: '/admin/rfq', icon: 'FileText' },
  { label: 'Quotes', href: '/admin/quote', icon: 'DollarSign' },
  { label: 'Negotiations', href: '/admin/negotiation', icon: 'Handshake' },
  { label: 'Purchase Orders', href: '/admin/po', icon: 'FileCheck' },
  { label: 'Orders', href: '/admin/order', icon: 'ShoppingCart' },
  { label: 'Shipments', href: '/admin/shipment', icon: 'Truck' },
  { label: 'Deliveries', href: '/admin/delivery', icon: 'PackageCheck' },
  { label: 'Verification', href: '/admin/verification', icon: 'Shield', badge: '234' },
  { label: 'Fraud Dashboard', href: '/admin/fraud-dashboard', icon: 'AlertTriangle', badge: '12' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: 'ScrollText' },
  { label: 'System Health', href: '/admin/system-health', icon: 'Activity' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'BarChart3' },
  { label: 'Beta Features', href: '/admin/beta', icon: 'Flask' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
]

// ─── PRODUCT ONBOARDING DATA ──────────────────────────────────────
export const INDIAN_LANGUAGES = [
  { locale: 'hi', name: 'Hindi', native: '\u0939\u093F\u0928\u094D\u0926\u0940' },
  { locale: 'en', name: 'English', native: 'English' },
  { locale: 'gu', name: 'Gujarati', native: '\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0' },
  { locale: 'ta', name: 'Tamil', native: '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD' },
  { locale: 'te', name: 'Telugu', native: '\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41' },
  { locale: 'bn', name: 'Bengali', native: '\u09AC\u09BE\u0982\u09B2\u09BE' },
  { locale: 'mr', name: 'Marathi', native: '\u092E\u0930\u093E\u0920\u0940' },
  { locale: 'pa', name: 'Punjabi', native: '\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40' },
  { locale: 'kn', name: 'Kannada', native: '\u0C95\u0CA8\u0CCD\u0CA8\u0CA1' },
  { locale: 'ml', name: 'Malayalam', native: '\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02' },
  { locale: 'or', name: 'Odia', native: '\u0B13\u0B21\u0B3C\u0B3F\u0B06' },
]
export const CERTIFICATION_TYPES = [
  { value: 'iso_9001', label: 'ISO 9001:2025', description: 'Quality Management System' },
  { value: 'iso_14001', label: 'ISO 14001', description: 'Environmental Management' },
  { value: 'iso_45001', label: 'ISO 45001', description: 'Occupational Health & Safety' },
  { value: 'gmp', label: 'GMP', description: 'Good Manufacturing Practices' },
  { value: 'fssai', label: 'FSSAI', description: 'Food Safety & Standards' },
  { value: 'ce', label: 'CE Marking', description: 'European Conformity' },
  { value: 'isi', label: 'ISI Mark', description: 'Indian Standards Institute' },
]
export const VARIANT_TYPE_OPTIONS = [
  { value: 'size', label: 'Size' },
  { value: 'color', label: 'Color' },
  { value: 'weight', label: 'Weight' },
  { value: 'material', label: 'Material' },
  { value: 'grade', label: 'Grade' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'custom', label: 'Custom' },
]

// ─── PRODUCT BADGES (used in badges-bar) ──────────────────────────
export const PRODUCT_BADGES = [
  { key: 'goCashEligible', label: 'GOCASH Eligible', icon: 'Wallet', variant: 'default' as const },
  { key: 'tradgoEligible', label: 'TRADGO Shipping', icon: 'Truck', variant: 'success' as const },
  { key: 'escrowEligible', label: 'Escrow Protection', icon: 'ShieldCheck', variant: 'warning' as const },
  { key: 'isSampleOrder', label: 'Sample Order', icon: 'PackageSearch', variant: 'secondary' as const },
  { key: 'exportSupported', label: 'Export Supported', icon: 'Globe', variant: 'secondary' as const },
  { key: 'nearMe', label: 'Near Me → Far', icon: 'MapPin', variant: 'secondary' as const },
]

// ─── SORT & FILTER OPTIONS ────────────────────────────────────────
export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'distance', label: 'Nearest First' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
]
export const RADIUS_OPTIONS = [
  { value: 'LOCAL', label: '5 km', description: 'Local area coverage within 5 km radius' },
  { value: 'CITY', label: '10 km', description: 'City-wide coverage within 10 km radius' },
  { value: 'REGIONAL', label: '25 km', description: 'Regional coverage within 25 km radius' },
  { value: 'STATE', label: '50 km', description: 'State-wide coverage within 50 km radius' },
  { value: 'NATIONAL', label: '100 km', description: 'National coverage within 100 km radius' },
]

// ─── SELLER TYPES ─────────────────────────────────────────────────
export const SELLER_TYPES = [
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'service_provider', label: 'Service Provider' },
]

// ─── SELLER DASHBOARD QUICK ACTIONS ───────────────────────────────
export const SELLER_QUICK_ACTIONS = [
  { label: 'Add Product', href: '/seller/products/new', icon: 'PlusCircle', color: '#3D8BFF' },
  { label: 'View RFQs', href: '/seller/rfqs', icon: 'FileText', color: '#F59E0B' },
  { label: 'Analytics', href: '/seller/analytics', icon: 'BarChart3', color: '#9B5DE5' },
  { label: 'TRADGO Race', href: '/seller/tradgo', icon: 'Trophy', color: '#F43F5E' },
]
export const BUYER_QUICK_ACTIONS = [
  { label: 'Create RFQ', href: '/rfq', icon: 'FileText', color: '#3D8BFF' },
  { label: 'Browse Products', href: '/products', icon: 'Search', color: '#FF4D00' },
  { label: 'Saved Products', href: '/buyer/saved-products', icon: 'Heart', color: '#F43F5E' },
  { label: 'Compare Quotes', href: '/buyer/compare-quotes', icon: 'GitCompare', color: '#9B5DE5' },
]
export const ADMIN_QUICK_LINKS = [
  { label: 'User Management', href: '/admin/users', icon: 'Users', count: '1.8L+' },
  { label: 'Verification Queue', href: '/admin/verification', icon: 'Shield', count: '234' },
  { label: 'Fraud Alerts', href: '/admin/fraud-dashboard', icon: 'AlertTriangle', count: '12' },
  { label: 'System Health', href: '/admin/system-health', icon: 'Activity', count: '98.5%' },
]

// ─── COMPARE ROWS ─────────────────────────────────────────────────
export const COMPARE_ROWS = [
  { field: 'Price', type: 'price' as const },
  { field: 'Seller', type: 'text' as const },
  { field: 'Trust Score', type: 'number' as const },
  { field: 'Rating', type: 'number' as const },
  { field: 'Reviews', type: 'number' as const },
  { field: 'Location', type: 'text' as const },
  { field: 'Geo Ring', type: 'text' as const },
  { field: 'Delivery ETA', type: 'text' as const },
  { field: 'MOQ', type: 'text' as const },
  { field: 'Payment Terms', type: 'text' as const },
  { field: 'GOCASH Earn', type: 'text' as const },
  { field: 'Verified', type: 'boolean' as const },
  { field: 'TRADGO Elite', type: 'boolean' as const },
  { field: 'Response Time', type: 'text' as const },
]

// ─── ONBOARDING STEPS ─────────────────────────────────────────────
export const SELLER_ONBOARDING_STEPS = [
  { step: 1, title: 'Create Account', description: 'Sign up with your business email and complete basic profile information.' },
  { step: 2, title: 'Verify Your Business', description: 'Submit PAN, GST, Aadhaar, and business registration for TRADTRUST verification.' },
  { step: 3, title: 'List Your Products', description: 'Add your products with descriptions, images, and pricing. Bulk upload supported.' },
  { step: 4, title: 'Start Trading', description: 'Your profile goes live. Start receiving RFQs, connect with buyers, and grow your business.' },
]
export const BUYER_ONBOARDING_STEPS = [
  { step: 1, title: 'Create Account', description: 'Sign up with your business email and set your preferences.' },
  { step: 2, title: 'Explore Products', description: 'Browse 33K+ products and services using AI-powered search.' },
  { step: 3, title: 'Post RFQ', description: 'Tell us what you need. Get matched with top verified vendors automatically.' },
  { step: 4, title: 'Trade with Confidence', description: 'Compare quotes, chat with sellers, and complete transactions securely.' },
]

// ─── MEGA MENU DATA ───────────────────────────────────────────────
export const MEGA_MENU_TRADING_COLUMNS = [
  { title: 'Discover', items: [{ label: 'All Products', href: '/products' }, { label: 'Categories', href: '/categories' }, { label: 'Services', href: '/services' }, { label: 'Industries', href: '/industries' }] },
  { title: 'Trade', items: [{ label: 'RFQ Marketplace', href: '/rfq' }, { label: 'TRADBUY Instant', href: '/tradbuy' }, { label: 'Compare Products', href: '/compare' }, { label: 'Near Me', href: '/near-me' }] },
  { title: 'Tools', items: [{ label: 'Seller Dashboard', href: '/seller/dashboard' }, { label: 'Buyer Dashboard', href: '/buyer/dashboard' }, { label: 'Analytics', href: '/seller/analytics' }, { label: 'Saved Products', href: '/buyer/saved-products' }] },
]
export const MEGA_MENU_FEATURES_COLUMNS = [
  { title: 'TRADHEXA', items: [{ label: 'TRADFIND', href: '/tradhexa/tradfind' }, { label: 'TRADMATCH', href: '/tradhexa/tradmatch' }, { label: 'TRADRFQ', href: '/tradhexa/tradrfq' }, { label: 'TRADCONNECT', href: '/tradhexa/tradconnect' }, { label: 'TRADTRUST', href: '/tradhexa/tradtrust' }, { label: 'TRADZERO', href: '/tradhexa/tradzero' }] },
  { title: 'Rewards', items: [{ label: 'TRADGO Races', href: '/tradgo' }, { label: 'GOCASH Rewards', href: '/gocash' }, { label: 'Leaderboard', href: '/tradgo#leaderboard' }, { label: 'Badges', href: '/tradgo#badges' }] },
  { title: 'Plans', items: [{ label: 'Seller Plans', href: '/seller-plans' }, { label: 'Launch Pricing', href: '/launch' }, { label: 'Enterprise', href: '/enterprise' }, { label: 'Compare Plans', href: '/seller-plans#compare' }] },
]
export const MEGA_MENU_COMPANY_COLUMNS = [
  { title: 'Company', items: [{ label: 'About Us', href: '/about-tradingo' }, { label: 'Why TRADINGO', href: '/why-tradingo' }, { label: 'Features', href: '/features' }, { label: 'Press Kit', href: '/press-kit' }] },
  { title: 'Resources', items: [{ label: 'For Sellers', href: '/for-sellers' }, { label: 'For Buyers', href: '/for-buyers' }, { label: 'Contact Us', href: '/contact' }, { label: 'Support', href: '/seller/support' }] },
  { title: 'Legal', items: [{ label: 'Terms of Service', href: '/terms' }, { label: 'Privacy Policy', href: '/privacy' }, { label: 'Refund Policy', href: '/refund' }, { label: 'Sitemap', href: '/sitemap' }] },
]

// ─── INLINE SORT OPTIONS (used across search pages) ───────────────
export const PROXIMITY_SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest First' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'reviews', label: 'Most Reviewed' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
]

// ─── STATIC ROUTES FOR SITEMAP ────────────────────────────────────
export const SITEMAP_STATIC_ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'daily' as const },
  { path: '/products', priority: 0.9, changefreq: 'daily' as const },
  { path: '/categories', priority: 0.8, changefreq: 'weekly' as const },
  { path: '/trading', priority: 0.8, changefreq: 'weekly' as const },
  { path: '/about-tradingo', priority: 0.6, changefreq: 'monthly' as const },
  { path: '/contact', priority: 0.5, changefreq: 'monthly' as const },
  { path: '/for-sellers', priority: 0.7, changefreq: 'weekly' as const },
  { path: '/for-buyers', priority: 0.7, changefreq: 'weekly' as const },
  { path: '/why-tradingo', priority: 0.7, changefreq: 'monthly' as const },
  { path: '/features', priority: 0.6, changefreq: 'monthly' as const },
  { path: '/tradgo', priority: 0.6, changefreq: 'weekly' as const },
  { path: '/gocash', priority: 0.6, changefreq: 'weekly' as const },
  { path: '/tradbuy', priority: 0.6, changefreq: 'weekly' as const },
  { path: '/tradhexa', priority: 0.7, changefreq: 'weekly' as const },
  { path: '/launch', priority: 0.5, changefreq: 'monthly' as const },
  { path: '/press-kit', priority: 0.4, changefreq: 'monthly' as const },
  { path: '/privacy', priority: 0.4, changefreq: 'yearly' as const },
  { path: '/terms', priority: 0.4, changefreq: 'yearly' as const },
  { path: '/companies', priority: 0.7, changefreq: 'daily' as const },
  { path: '/seller-plans', priority: 0.6, changefreq: 'weekly' as const },
  { path: '/browse', priority: 0.7, changefreq: 'daily' as const },
  { path: '/search', priority: 0.8, changefreq: 'daily' as const },
  { path: '/rfq', priority: 0.7, changefreq: 'weekly' as const },
  { path: '/status', priority: 0.3, changefreq: 'hourly' as const },
]
