export interface TradeServCategory {
  slug: string;
  icon: string;
  title: string;
  shortDescription: string;
  description: string;
  detailedDescription: string;
  keywords: string[];
  benefits: string[];
  whoNeedsIt: string[];
}

export const TRADESERV_CATEGORIES: TradeServCategory[] = [
  {
    slug: 'chartered-accountant',
    icon: '\uD83D\uDCCA',
    title: 'Chartered Accountant',
    shortDescription: 'Audit, taxation, compliance, and financial advisory services for businesses of all sizes.',
    description: 'Connect with verified chartered accountants for audit, taxation, compliance, and financial advisory services.',
    detailedDescription: 'Chartered Accountants (CAs) are financial professionals qualified to handle a wide range of accounting, auditing, tax, and financial advisory services. On TradeServ, every CA is TRADTRUST-verified — their ICAI membership, qualifications, and experience are independently validated. Whether you need statutory audit, tax planning, GST compliance, or financial due diligence, you can find the right CA for your business size and industry.',
    keywords: ['chartered accountant', 'CA', 'audit services', 'tax consultant', 'financial advisory', 'GST filing', 'income tax', 'statutory audit', 'tax planning', 'India CA'],
    benefits: [
      'Statutory audit and tax audit compliance',
      'Income tax return filing and planning',
      'GST registration, return filing, and advisory',
      'Financial due diligence and business valuation',
      'Company incorporation and ROC compliance',
      'Internal audit and risk advisory',
    ],
    whoNeedsIt: ['Startups needing incorporation and initial compliance', 'SMEs requiring regular audit and tax filing', 'E-commerce businesses managing GST compliance', 'Companies planning fundraising or M&A', 'Businesses seeking tax optimization strategies'],
  },
  {
    slug: 'gst-consultant',
    icon: '\uD83D\uDCCB',
    title: 'GST Consultant',
    shortDescription: 'GST registration, return filing, input credit optimization, and compliance management.',
    description: 'Expert GST consultants for registration, return filing, input tax credit optimization, and compliance.',
    detailedDescription: 'Goods and Services Tax (GST) compliance is one of the most critical and complex aspects of running a business in India. TradeServ GST consultants are verified professionals who specialize in GST registration, monthly/quarterly return filing, input tax credit reconciliation, notice response, and compliance management. They stay updated with the latest GST council changes, ensuring your business remains compliant while optimizing tax outflows.',
    keywords: ['GST consultant', 'GST registration', 'GST return filing', 'input tax credit', 'GST compliance', 'GST notice', 'tax consultant', 'GST practitioner', 'India GST'],
    benefits: [
      'GST registration (new business, composition, casual taxable person)',
      'Monthly/quarterly GSTR-1, GSTR-3B filing',
      'Annual return GSTR-9 and GSTR-9C filing',
      'Input tax credit reconciliation and optimization',
      'GST notice response and litigation support',
      'E-way bill generation and compliance',
    ],
    whoNeedsIt: ['New businesses registering for GST', 'E-commerce operators and marketplace sellers', 'Manufacturers with complex supply chains', 'Businesses with inter-state operations', 'Companies facing GST notices or audits'],
  },
  {
    slug: 'company-secretary',
    icon: '\u2696\uFE0F',
    title: 'Company Secretary',
    shortDescription: 'Corporate governance, board compliance, ROC filings, and secretarial audit services.',
    description: 'Qualified company secretaries for corporate governance, board compliance, and regulatory filings.',
    detailedDescription: 'Company Secretaries (CS) are governance professionals responsible for ensuring statutory compliance, board management, and corporate governance. TradeServ CS professionals are verified members of ICSI with expertise in ROC filings, board meeting minutes, annual returns, secretarial audits, and FEMA compliance. They help businesses navigate the complex regulatory landscape while maintaining transparent corporate practices.',
    keywords: ['company secretary', 'CS', 'corporate governance', 'ROC filing', 'board compliance', 'secretarial audit', 'ICSI', 'annual return', 'FEMA compliance', 'India CS'],
    benefits: [
      'Board meeting management and minutes preparation',
      'Annual return (MCA Form MGT-7) filing',
      'Financial statement (MCA Form AOC-4) filing',
      'Secretarial audit and compliance certificate',
      'Director appointment, resignation, and KYC',
      'FEMA compliance and RBI filings',
    ],
    whoNeedsIt: ['Private limited companies needing ROC compliance', 'Public companies requiring board governance', 'Startups seeking compliant incorporation', 'Foreign companies operating in India', 'Businesses preparing for IPO or fundraising'],
  },
  {
    slug: 'trademark-consultant',
    icon: '\u00AE\uFE0F',
    title: 'Trademark Consultant',
    shortDescription: 'Trademark search, registration, opposition, renewal, and brand protection services.',
    description: 'IP professionals for trademark search, registration, opposition, renewal, and brand protection.',
    detailedDescription: 'Trademark consultants specialize in protecting your brand identity. From trademark search and availability analysis to registration, opposition, renewal, and enforcement, TradeServ trademark consultants handle the complete IP lifecycle. Every consultant is verified for their IP qualifications and track record. They help businesses secure their brand assets and prevent infringement through strategic trademark portfolio management.',
    keywords: ['trademark consultant', 'trademark registration', 'brand protection', 'IPR', 'trademark search', 'trademark opposition', 'trademark renewal', 'intellectual property', 'India trademark'],
    benefits: [
      'Trademark availability search and clearance opinion',
      'Trademark registration application (India and international)',
      'Trademark opposition and rectification',
      'Trademark renewal and portfolio management',
      'Copyright and design registration',
      'IP licensing and assignment agreements',
    ],
    whoNeedsIt: ['Brands launching new products or services', 'Startups protecting their brand identity', 'E-commerce sellers building brand equity', 'Franchisors managing brand consistency', 'Companies expanding to new markets'],
  },
  {
    slug: 'legal-advisor',
    icon: '\uD83D\uDEE1\uFE0F',
    title: 'Legal Advisor',
    shortDescription: 'Contract drafting, business litigation, IPR, employment law, and corporate legal counsel.',
    description: 'Experienced legal advisors for contract drafting, litigation, IPR, employment law, and corporate counsel.',
    detailedDescription: 'Legal advisors on TradeServ cover the full spectrum of business law — contract drafting and review, corporate litigation, IPR enforcement, employment law, regulatory compliance, and transactional advisory. All legal professionals undergo TRADTRUST verification including bar council enrollment validation. Whether you need a one-time contract review or ongoing legal counsel, TradeServ connects you with verified legal experts matched to your industry and requirements.',
    keywords: ['legal advisor', 'business lawyer', 'corporate lawyer', 'contract drafting', 'litigation', 'IPR lawyer', 'employment law', 'legal consultant', 'India business law'],
    benefits: [
      'Contract drafting, review, and negotiation',
      'Corporate litigation and dispute resolution',
      'Intellectual property enforcement and protection',
      'Employment and labor law compliance',
      'Regulatory compliance advisory',
      'M&A and transaction legal support',
    ],
    whoNeedsIt: ['Businesses needing contract templates and reviews', 'Companies facing legal disputes or notices', 'Employers needing employment agreement drafting', 'Startups seeking founder agreement and IP assignment', 'Businesses entering joint ventures or partnerships'],
  },
  {
    slug: 'business-consultant',
    icon: '\uD83D\uDCC8',
    title: 'Business Consultant',
    shortDescription: 'Strategy, operations, market entry, process optimization, and business transformation.',
    description: 'Strategic business consultants for growth planning, operations, market entry, and transformation.',
    detailedDescription: 'Business consultants help organizations improve performance through strategic analysis, operational excellence, and organizational change. TradeServ consultants have verified credentials and proven track records across industries including manufacturing, services, technology, and retail. They bring fresh perspectives and data-driven methodologies to solve complex business challenges — from market entry strategy to operational turnaround.',
    keywords: ['business consultant', 'management consultant', 'strategy consultant', 'business advisory', 'growth strategy', 'operations consultant', 'market entry', 'business transformation', 'India consulting'],
    benefits: [
      'Business strategy and growth planning',
      'Operations optimization and process improvement',
      'Market entry and expansion strategy',
      'Organizational design and change management',
      'Financial modeling and business planning',
      'Digital transformation advisory',
    ],
    whoNeedsIt: ['Businesses planning expansion into new markets', 'Companies undergoing organizational change', 'Startups seeking go-to-market strategy', 'SMEs needing operational efficiency improvement', 'Enterprises exploring digital transformation'],
  },
  {
    slug: 'brand-consultant',
    icon: '\uD83C\uDFA8',
    title: 'Brand Consultant',
    shortDescription: 'Brand strategy, identity design, positioning, messaging, and brand architecture.',
    description: 'Brand strategists and designers for brand identity, positioning, messaging, and architecture.',
    detailedDescription: 'Brand consultants help businesses define, build, and evolve their brand identity. From brand strategy and positioning to visual identity design and messaging frameworks, TradeServ brand consultants are verified professionals with portfolios demonstrating measurable brand impact. They work across B2B and B2C contexts, helping businesses create differentiated brand experiences that drive customer preference and business growth.',
    keywords: ['brand consultant', 'brand strategist', 'brand identity', 'brand positioning', 'brand architecture', 'brand messaging', 'brand design', 'rebranding', 'India branding'],
    benefits: [
      'Brand strategy development and positioning',
      'Visual identity design (logo, color, typography)',
      'Brand messaging and voice guidelines',
      'Brand architecture and portfolio strategy',
      'Rebranding and brand refresh',
      'Brand guidelines and playbook creation',
    ],
    whoNeedsIt: ['Startups building their first brand identity', 'Companies planning rebranding or brand refresh', 'Businesses expanding into new customer segments', 'M&A situations requiring brand integration', 'D2C brands needing differentiated positioning'],
  },
  {
    slug: 'export-consultant',
    icon: '\uD83C\uDF0D',
    title: 'Export Consultant',
    shortDescription: 'Export documentation, international market research, trade compliance, and logistics advisory.',
    description: 'Export consultants for international trade documentation, market research, and compliance.',
    detailedDescription: 'Export consultants guide businesses through the complexities of international trade — from documentation and compliance to market research and logistics optimization. TradeServ export consultants are verified professionals with hands-on experience in cross-border trade, including DGFT regulations, export incentives, foreign trade policy, and international payment mechanisms. They help Indian businesses tap into global markets confidently.',
    keywords: ['export consultant', 'export documentation', 'international trade', 'export compliance', 'DGFT', 'export incentives', 'market research', 'trade finance', 'India export'],
    benefits: [
      'Export documentation and letter of credit management',
      'DGFT registration and IEC code management',
      'Export incentive scheme advisory (MEIS, RoDTEP, etc.)',
      'International market research and buyer identification',
      'Trade compliance and customs documentation',
      'Cross-border logistics and freight optimization',
    ],
    whoNeedsIt: ['Manufacturers exploring export markets', 'SMEs starting international trade operations', 'E-commerce businesses selling internationally', 'Companies navigating export compliance', 'Businesses seeking export incentive benefits'],
  },
  {
    slug: 'product-photographer',
    icon: '\uD83D\uDCF8',
    title: 'Product Photographer',
    shortDescription: 'E-commerce product photography, 360-degree spins, lifestyle shoots, and catalog creation.',
    description: 'Professional product photographers for e-commerce, catalogs, 360-degree spins, and lifestyle shoots.',
    detailedDescription: 'High-quality product photography directly impacts conversion rates in e-commerce and catalog sales. TradeServ product photographers are verified professionals with specialized equipment, studio setups, and post-processing expertise. They deliver e-commerce-ready images, 360-degree product views, lifestyle photography, and catalog production. Each photographer\'s portfolio and client reviews are verified to ensure quality.',
    keywords: ['product photographer', 'e-commerce photography', 'product photography', 'catalog photography', '360 product view', 'lifestyle photography', 'commercial photographer', 'India product photography'],
    benefits: [
      'E-commerce product photography (white background)',
      '360-degree product spin photography',
      'Lifestyle and contextual product shoots',
      'Catalog and lookbook production',
      'Product video and stop-motion',
      'Post-processing and image optimization',
    ],
    whoNeedsIt: ['E-commerce sellers needing product listing images', 'Brands creating seasonal catalogs', 'Marketplace sellers optimizing product pages', 'Businesses launching new product lines', 'D2C brands needing consistent visual identity'],
  },
  {
    slug: 'packaging-designer',
    icon: '\uD83D\uDCE6',
    title: 'Packaging Designer',
    shortDescription: 'Packaging design, structural design, sustainable packaging, and print-ready artwork.',
    description: 'Creative packaging designers for structural design, branding, sustainable solutions, and print-ready art.',
    detailedDescription: 'Packaging is often the first physical interaction a customer has with your product. TradeServ packaging designers create packaging that protects, communicates, and sells. From structural design and material selection to graphic design and print-ready artwork, verified packaging professionals help businesses create packaging that stands out on shelves and in unboxing experiences. Sustainability expertise available for eco-friendly packaging solutions.',
    keywords: ['packaging designer', 'packaging design', 'structural packaging design', 'sustainable packaging', 'print-ready artwork', 'packaging graphics', 'product packaging', 'India packaging design'],
    benefits: [
      'Structural packaging design and prototyping',
      'Graphic design and print-ready artwork',
      'Sustainable and eco-friendly packaging solutions',
      'Packaging for e-commerce and retail',
      'Label and sleeve design',
      'Packaging specification and vendor coordination',
    ],
    whoNeedsIt: ['CPG brands launching new products', 'E-commerce businesses needing shipping packaging', 'Food and beverage brands requiring FSSAI-compliant packaging', 'Luxury brands needing premium packaging', 'Startups creating their first product packaging'],
  },
];

export const CATEGORY_SLUGS = TRADESERV_CATEGORIES.map((c) => c.slug);

export function getCategoryBySlug(slug: string): TradeServCategory | undefined {
  return TRADESERV_CATEGORIES.find((c) => c.slug === slug);
}
