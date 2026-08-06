import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import {
  INDUSTRIES,
  DOMAIN_POOL,
  SUB_VARIANTS,
  SPEC_POOLS,
  GENERIC_SPECS,
  SERVICE_TYPES,
  UNITS,
  GLOBAL_ATTRIBUTES,
  SYNONYM_PAIRS,
  BRAND_POOL,
  COMPANY_PREFIX,
  COMPANY_SUFFIX,
  TERRITORY_STATES,
} from '../seed-data/master-directory.data';

const prisma = new PrismaClient();
const SEED = 42;
const BATCH = 1000;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function pad(num: number, len: number): string {
  return String(num).padStart(len, '0');
}

function pick<T>(rand: () => number, arr: readonly T[], offset: number): T {
  return arr[(Math.floor(rand() * arr.length) + offset) % arr.length];
}

function shuffled<T>(rand: () => number, arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function gstin(rand: () => number, stateCode: string, pan: string): string {
  const digits = Math.floor(rand() * 10);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const cs = chars[Math.floor(rand() * chars.length)];
  return `${stateCode}${pan}${digits}${cs}${Math.floor(rand() * 10)}`;
}

function indianPan(rand: () => number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let pan = 'A';
  for (let i = 0; i < 3; i++) pan += chars[Math.floor(rand() * chars.length)];
  pan += 'P';
  for (let i = 0; i < 3; i++) pan += String(Math.floor(rand() * 10));
  pan += chars[Math.floor(rand() * chars.length)];
  return pan;
}

const STATE_CODES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37'];

const BUSINESS_TYPES = ['MANUFACTURER', 'EXPORTER', 'IMPORTER', 'DISTRIBUTOR', 'WHOLESALER', 'TRADER', 'SERVICE_PROVIDER', 'OEM', 'CONTRACT_MANUFACTURER'] as const;
const GEO_REACH = ['LOCAL', 'DISTRICT', 'STATE', 'PAN_INDIA', 'GLOBAL'] as const;
const PLANS = ['TRADE_START', 'TRADE_SMART', 'TRADE_PLUS', 'TRADE_PRO', 'TRADE_PREMIUM'] as const;
const VERIFY_LEVELS = ['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5'] as const;

const PRICE_BANDS: Record<string, [number, number]> = {
  'Raw Materials': [40, 8000],
  'Machinery & Equipment': [25000, 2500000],
  'Spare Parts & Accessories': [150, 15000],
  'Consumables & Supplies': [80, 6000],
  'Finished Goods': [250, 60000],
  'Chemicals & Additives': [300, 25000],
  'Packaging & Storage': [8, 900],
  'Tools & Hardware': [120, 9000],
  'Testing & Quality Control': [3500, 400000],
  'Safety & Protection': [90, 8000],
  'Pumps & Valves': [2200, 350000],
  'Motors & Drives': [3000, 600000],
  'Bearings & Transmission': [450, 85000],
  'Hydraulics & Pneumatics': [1500, 200000],
  'Electrical & Electronic Components': [15, 3500],
  'Cables, Wires & Connectors': [6, 900],
  'Sensors & Instrumentation': [900, 90000],
  'Control & Automation Systems': [8000, 1500000],
  'Pipes, Tubes & Fittings': [80, 12000],
  'Fasteners & Fixings': [2, 300],
  'Material Handling Equipment': [15000, 3000000],
  'Storage Racks & Shelving': [2500, 500000],
  'Lubricants & Industrial Oils': [180, 15000],
  'Filters & Filtration Systems': [250, 35000],
  'Heating, Ventilation & Cooling': [6000, 800000],
  'Compressed Air Systems': [12000, 900000],
  'Industrial Gases': [400, 12000],
  'Lighting & Electricals': [60, 4000],
  'Fire Fighting Equipment': [500, 40000],
  'Personal Protective Equipment': [40, 2500],
  'Uniforms & Workwear': [120, 2000],
  'Adhesives, Sealants & Tapes': [60, 3000],
  'Paints, Coatings & Finishes': [250, 12000],
  'Cleaning & Maintenance Products': [80, 4000],
  'Lab Equipment & Instruments': [2500, 350000],
  'Office Equipment & Supplies': [150, 6000],
  'IT Hardware & Networking': [2000, 250000],
  'Software & Digital Solutions': [10000, 2500000],
  'Logistics & Freight Services': [5000, 400000],
  'Warehousing & Distribution': [8000, 600000],
  'Installation & Commissioning': [10000, 800000],
  'Maintenance & Repair Services': [5000, 250000],
  'Training & Skill Development': [2000, 150000],
  'Consulting & Advisory': [10000, 900000],
  'Custom Fabrication Services': [15000, 1200000],
  'CNC Machining Services': [5000, 400000],
  'Tooling, Moulds & Dies': [15000, 900000],
  'Forgings & Castings': [8000, 300000],
  'Sheet Metal Work': [4000, 250000],
  'Welding & Fabrication': [5000, 350000],
  'Recycling & Waste Management': [6000, 500000],
  'Renewable Energy Systems': [15000, 1500000],
  'Biogas & Bioenergy': [20000, 2000000],
  'Green Building Materials': [2000, 120000],
  'Water Treatment Systems': [10000, 1200000],
  'Air Purification Systems': [4000, 300000],
  'Cold Storage & Refrigeration': [25000, 2500000],
  'Heat Treatment Services': [8000, 500000],
  'Surface Finishing Services': [3000, 120000],
  'Embroidery & Printing Services': [1500, 90000],
};

const MOQ_BY_DOMAIN: Record<string, number> = {
  'Fasteners & Fixings': 1000,
  'Cables, Wires & Connectors': 500,
  'Packaging & Storage': 1000,
  'Electrical & Electronic Components': 500,
  'Consumables & Supplies': 100,
  'Raw Materials': 100,
  'Paints, Coatings & Finishes': 10,
};

function priceBand(domain: string): [number, number] {
  return PRICE_BANDS[domain] || [500, 50000];
}

function gstRate(rand: () => number): number {
  const rates = [5, 12, 18, 28];
  return rates[Math.floor(rand() * rates.length)];
}

function timeHr(label: string): number {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${label}`;
  console.log(line);
  return Date.now();
}

async function countRows(model: string): Promise<number> {
  return (prisma as any)[model].count();
}

async function createManyBatched(model: string, rows: any[], skipDuplicates = false): Promise<void> {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await (prisma as any)[model].createMany({ data: chunk, skipDuplicates });
  }
}

async function buildChapterById(): Promise<Map<string, string>> {
  const industries = await prisma.industry.findMany({ select: { id: true, name: true } });
  const chapterByIndustryName = new Map(INDUSTRIES.map((i) => [i.name, i.hsnChapter]));
  const out = new Map<string, string>();
  for (const ind of industries) {
    out.set(ind.id, chapterByIndustryName.get(ind.name) || '84');
  }
  return out;
}

// -------------------- Phase 1: Industries (160) --------------------
async function phase1Industries(rand: () => number): Promise<number> {
  timeHr('PHASE 1 — Industries (target 160)');
  const existing = new Set((await prisma.industry.findMany({ select: { slug: true } })).map((i) => i.slug));
  const rows = INDUSTRIES.map((ind, i) => ({
    name: ind.name,
    slug: slugify(ind.name),
    description: ind.description,
    icon: pick(rand, ['factory', 'agriculture', 'cog', 'beaker', 'truck', 'boxes', 'lightbulb', 'cpu', 'car', 'shirt'], i),
  })).filter((r) => !existing.has(r.slug));
  await createManyBatched('industry', rows);
  console.log(`  industries inserted: ${rows.length} (skipped ${existing.size} existing)`);
  return rows.length;
}

// -------------------- Phase 2: Categories (1,600) --------------------
async function phase2Categories(rand: () => number): Promise<number> {
  timeHr('PHASE 2 — Catalog Categories (target 1,600)');
  const industries = await prisma.industry.findMany({ select: { id: true, name: true, slug: true } });
  const existing = new Set((await prisma.catalogCategory.findMany({ select: { slug: true } })).map((c) => c.slug));
  const rows: any[] = [];
  for (const ind of industries) {
    const domains = shuffled(rand, DOMAIN_POOL).slice(0, 10);
    domains.forEach((domain, i) => {
      const name = `${ind.name} ${domain}`;
      const slug = slugify(name);
      if (existing.has(slug)) return;
      rows.push({
        slug,
        name,
        description: `${domain} for the ${ind.name} industry — catalogue of verified B2B suppliers and products.`,
        sortOrder: i,
        isActive: true,
      });
    });
  }
  await createManyBatched('catalogCategory', rows);
  console.log(`  categories inserted: ${rows.length}`);
  return rows.length;
}

// -------------------- Phase 3: Subcategories (6,400) --------------------
async function phase3Subcategories(rand: () => number): Promise<number> {
  timeHr('PHASE 3 — Catalog Subcategories (target 6,400)');
  const categories = await prisma.catalogCategory.findMany({ select: { id: true, name: true, slug: true } });
  const existing = new Set((await prisma.catalogSubcategory.findMany({ select: { categoryId: true, slug: true } })).map((s) => `${s.categoryId}|${s.slug}`));
  const rows: any[] = [];
  for (const cat of categories) {
    const variants = shuffled(rand, SUB_VARIANTS).slice(0, 4);
    variants.forEach((variant) => {
      const name = `${cat.name} ${variant}`;
      const slug = slugify(name);
      if (existing.has(`${cat.id}|${slug}`)) return;
      rows.push({ categoryId: cat.id, slug, name });
    });
  }
  await createManyBatched('catalogSubcategory', rows);
  console.log(`  subcategories inserted: ${rows.length}`);
  return rows.length;
}

// -------------------- Phase 4: Products (33,600 CatalogItems + ProductMaster mirror) --------------------
async function phase4Products(rand: () => number, industryByCat: Map<string, string>, chapterByCat: Map<string, string>): Promise<number> {
  timeHr('PHASE 4 — Catalog Products (target 33,600)');
  const subcategories = await prisma.catalogSubcategory.findMany({ select: { id: true, name: true, categoryId: true } });
  const categories = await prisma.catalogCategory.findMany({ select: { id: true, name: true, slug: true } });
  const catById = new Map(categories.map((c) => [c.id, c]));
  const legacyCategories = await prisma.category.findMany({ select: { id: true, name: true } });

  const domainOf = (catName: string): string => {
    const words = catName.split(' ');
    let best = '';
    for (const d of DOMAIN_POOL) {
      if (catName.endsWith(d) && d.length > best.length) best = d;
    }
    return best;
  };

  const legacyMatch = (catName: string): string | null => {
    const lower = catName.toLowerCase();
    for (const lc of legacyCategories) {
      const l = lc.name.toLowerCase();
      const tokens = l.split(' ');
      if (tokens.some((t) => t.length > 3 && lower.includes(t))) return lc.id;
    }
    return null;
  };

  const items: any[] = [];
  const masters: any[] = [];
  const existingItems = new Set((await prisma.catalogItem.findMany({ select: { slug: true } })).map((i) => i.slug));
  const existingMasters = new Set((await prisma.productMaster.findMany({ select: { slug: true } })).map((i) => i.slug));

  let seq = 0;
  for (let si = 0; si < subcategories.length; si++) {
    const sub = subcategories[si];
    const cat = catById.get(sub.categoryId)!;
    const domain = domainOf(cat.name);
    const specs = SPEC_POOLS[domain] || GENERIC_SPECS;
    const band = priceBand(domain);
    const moqBase = MOQ_BY_DOMAIN[domain] || 1;
    const gst = gstRate(rand);
    const count = si % 4 === 0 ? 6 : 5;
    for (let p = 0; p < count; p++) {
      const spec = specs[(si * 5 + p) % specs.length];
      const name = `${sub.name} ${spec}`;
      const slug = slugify(name);
      if (existingItems.has(slug) || existingMasters.has('pm-' + slug)) {
        seq++;
        continue;
      }
      const hsCode = (chapterByCat.get(cat.id) || '84') + pad(Math.floor(rand() * 999999), 6);
      const priceMin = Number((band[0] * (1 + rand() * 0.8)).toFixed(2));
      const priceMax = Number((band[1] * (1 + rand() * 0.5)).toFixed(2));
      const unit = pick(rand, ['Piece', 'Set', 'Unit', 'Kg', 'Roll', 'Box', 'Pair', 'Dozen'], si + p);
      const moq = Math.max(1, Math.round(moqBase * (1 + rand() * 3)));
      const keywords = [cat.name, sub.name, name, domain].map(slugify).filter(Boolean);
      const synonyms = [sub.name, cat.name].map((n) => slugify(n)).filter(Boolean);
      const legacyId = legacyMatch(cat.name);
      items.push({
        subcategoryId: sub.id,
        type: 'Product',
        name,
        slug,
        unit,
        keywords,
        synonyms,
        seoTitle: `${name} — Suppliers & Manufacturers`,
        seoDescription: `Find verified suppliers of ${name}. Compare prices, MOQ and quality across trusted TRADINGO sellers.`,
        searchVector: name,
        aiSummary: `${name} in ${domain} for ${cat.name}.`,
        isActive: true,
        sourceData: {
          industryId: industryByCat.get(cat.id),
          categoryName: cat.name,
          domain,
          gstRate: gst,
          priceRangeMin: priceMin,
          priceRangeMax: priceMax,
          moq,
          documents: [
            { type: 'datasheet', name: `${slug}-datasheet` },
            { type: 'spec-sheet', name: `${slug}-specs` },
          ],
        },
        hsCode,
        sacCode: null,
      });
      masters.push({
        categoryId: legacyId,
        subcategoryId: sub.id,
        name,
        slug: 'pm-' + slug,
        shortDescription: `${name} — ${domain}.`,
        description: `${name} available from verified TRADINGO suppliers. Domain: ${domain}. HSN: ${hsCode}.`,
        unit,
        moq,
        priceRangeMin: priceMin,
        priceRangeMax: priceMax,
        currency: 'INR',
        hsCode,
        isActive: true,
        searchKeywords: keywords,
        synonyms,
        tags: [domain, cat.name],
        metaTitle: `${name} — Buy at Best Price`,
        metaDescription: `Buy ${name} at best price from verified suppliers. MOQ ${moq} ${unit}.`,
        sourceData: { gstRate: gst, domain, catalogItemSlug: slug },
      });
      seq++;
    }
  }
  console.log(`  product items generated: ${items.length}, mirrors: ${masters.length}`);
  await createManyBatched('catalogItem', items);
  await createManyBatched('productMaster', masters);
  console.log(`  inserted product CatalogItems + ProductMasters`);
  return items.length;
}

// -------------------- Phase 5: Services (12,800 CatalogItems + ServiceMaster mirror) --------------------
async function phase5Services(rand: () => number, industryByCat: Map<string, string>): Promise<number> {
  timeHr('PHASE 5 — Catalog Services (target 12,800)');
  const subcategories = await prisma.catalogSubcategory.findMany({ select: { id: true, name: true, categoryId: true } });
  const categories = await prisma.catalogCategory.findMany({ select: { id: true, name: true } });
  const catById = new Map(categories.map((c) => [c.id, c]));
  const legacyCategories = await prisma.category.findMany({ select: { id: true, name: true } });

  const domainOf = (catName: string): string => {
    let best = '';
    for (const d of DOMAIN_POOL) {
      if (catName.endsWith(d) && d.length > best.length) best = d;
    }
    return best;
  };
  const legacyMatch = (catName: string): string | null => {
    const lower = catName.toLowerCase();
    for (const lc of legacyCategories) {
      const tokens = lc.name.toLowerCase().split(' ');
      if (tokens.some((t) => t.length > 3 && lower.includes(t))) return lc.id;
    }
    return null;
  };

  const items: any[] = [];
  const masters: any[] = [];
  const existingItems = new Set((await prisma.catalogItem.findMany({ select: { slug: true } })).map((i) => i.slug));
  const existingMasters = new Set((await prisma.serviceMaster.findMany({ select: { slug: true } })).map((i) => i.slug));

  for (let si = 0; si < subcategories.length; si++) {
    const sub = subcategories[si];
    const cat = catById.get(sub.categoryId)!;
    const domain = domainOf(cat.name);
    const band = priceBand(domain);
    const gst = gstRate(rand);
    const svcTypes = shuffled(rand, SERVICE_TYPES).slice(0, 2);
    for (const svc of svcTypes) {
      const name = `${sub.name} ${svc}`;
      const slug = slugify(name);
      if (existingItems.has(slug) || existingMasters.has('sm-' + slug)) continue;
      const sacCode = '9983' + pad(Math.floor(rand() * 99), 2);
      const priceMin = Number((band[0] * 5).toFixed(2));
      const priceMax = Number((band[1] * 2.5).toFixed(2));
      items.push({
        subcategoryId: sub.id,
        type: 'Service',
        name,
        slug,
        unit: 'Service',
        keywords: [cat.name, sub.name, name, 'service'].map(slugify).filter(Boolean),
        synonyms: [sub.name, cat.name].map((n) => slugify(n)).filter(Boolean),
        seoTitle: `${name} — Service Providers`,
        seoDescription: `Find trusted providers of ${name} for ${cat.name}. Get quotes from verified TRADINGO professionals.`,
        searchVector: name,
        aiSummary: `${name} for ${cat.name} (${domain}).`,
        isActive: true,
        sourceData: {
          industryId: industryByCat.get(cat.id),
          categoryName: cat.name,
          domain,
          gstRate: gst,
          priceRangeMin: priceMin,
          priceRangeMax: priceMax,
          serviceType: svc,
          documents: [{ type: 'service-agreement', name: `${slug}-agreement` }],
        },
        hsCode: null,
        sacCode,
      });
      masters.push({
        categoryId: legacyMatch(cat.name),
        subcategoryId: sub.id,
        name,
        slug: 'sm-' + slug,
        description: `${name} for ${cat.name}.`,
        unit: 'Service',
        priceRangeMin: priceMin,
        priceRangeMax: priceMax,
        currency: 'INR',
        isActive: true,
        searchKeywords: [cat.name, sub.name, 'service'].map(slugify).filter(Boolean),
        synonyms: [cat.name].map((n) => slugify(n)).filter(Boolean),
        tags: [domain, 'Service'],
        metaTitle: `${name} — Hire Verified Providers`,
        metaDescription: `${name} at competitive rates from verified service providers.`,
        sourceData: { gstRate: gst, domain, serviceType: svc, catalogItemSlug: slug },
        sacCode,
      });
    }
  }
  console.log(`  service items generated: ${items.length}, mirrors: ${masters.length}`);
  await createManyBatched('catalogItem', items);
  await createManyBatched('serviceMaster', masters);
  return items.length;
}

// -------------------- Phase 6: Brands (GlobalBrand ~400) --------------------
async function phase6Brands(rand: () => number): Promise<number> {
  timeHr('PHASE 6 — Global Brands (target 400)');
  const existing = new Set((await prisma.globalBrand.findMany({ select: { slug: true } })).map((b) => b.slug));
  const rows: any[] = [];
  const seen = new Set<string>();
  const addBrand = (name: string, manufacturer: string | null, country: string, status: string) => {
    const slug = slugify(name);
    if (existing.has(slug) || seen.has(slug)) return;
    seen.add(slug);
    rows.push({
      name,
      slug,
      aliases: [name.replace(/\s+/g, '')],
      manufacturer,
      country,
      website: manufacturer ? `https://www.${slugify(manufacturer)}.com` : null,
      description: `${name} — registered brand in the TRADINGO Master Directory.`,
      verificationStatus: status,
      seoTitle: `${name} — Brand Directory`,
      seoDescription: `${name} brand profile with verified manufacturers and suppliers.`,
      isActive: true,
    });
  };
  for (const b of BRAND_POOL) {
    addBrand(b, `${b} Manufacturing Co.`, pick(rand, ['India', 'India', 'India', 'China', 'Germany', 'Japan', 'USA'], rows.length), pick(rand, ['VERIFIED', 'VERIFIED', 'VERIFIED', 'PENDING', 'UNVERIFIED'], rows.length));
  }
  let i = 0;
  while (rows.length < 400 && i < 2000) {
    const prefix = pick(rand, COMPANY_PREFIX, i);
    const suffix = pick(rand, ['Brands', 'Labs', 'Mills', 'Works', 'Line', 'Mark', 'Pro', 'Tech'], i);
    const domainWord = pick(rand, ['Steel', 'Polymer', 'Auto', 'Textile', 'Chem', 'Agro', 'Food', 'Solar', 'Pump', 'Metal'], i);
    addBrand(`${prefix} ${domainWord} ${suffix}`, `${prefix} Industries Ltd`, 'India', pick(rand, ['VERIFIED', 'VERIFIED', 'PENDING', 'UNVERIFIED'], i));
    i++;
  }
  await createManyBatched('globalBrand', rows);
  console.log(`  brands inserted: ${rows.length}`);
  return rows.length;
}

// -------------------- Phase 7: Companies (~500) + mappings + ProductBrand --------------------
async function phase7Companies(rand: () => number, industryByCat: Map<string, string>): Promise<number> {
  timeHr('PHASE 7 — Companies (target 500)');
  const existingCompanies = await prisma.company.findMany({ select: { slug: true, vendorCode: true } });
  const existingSlugs = new Set(existingCompanies.map((c) => c.slug));
  const industries = await prisma.industry.findMany({ select: { id: true, name: true } });
  const legacyCategories = await prisma.category.findMany({ select: { id: true, name: true } });

  const rows: any[] = [];
  const seenSlugs = new Set<string>();
  let seq = 0;
  while (rows.length < 500 && seq < 5000) {
    const prefix = pick(rand, COMPANY_PREFIX, seq);
    const suffix = pick(rand, COMPANY_SUFFIX, seq);
    const ind = industries[seq % industries.length];
    const name = `${prefix} ${ind.name} ${suffix}`;
    const slug = slugify(name);
    if (existingSlugs.has(slug) || seenSlugs.has(slug)) {
      seq++;
      continue;
    }
    seenSlugs.add(slug);
    const businessType = pick(rand, BUSINESS_TYPES, seq);
    const vendorCode = `TD${pad(seq + 1, 6)}`;
    const pan = indianPan(rand);
    const domain = ind.name.split(' ')[0].toLowerCase();
    rows.push({
      name,
      slug,
      description: `${name} — ${businessType.toLowerCase()} operating in the ${ind.name} industry.`,
      businessType,
      establishedYear: 1980 + Math.floor(rand() * 40),
      employeeCount: 5 + Math.floor(rand() * 950),
      gstNumber: gstin(rand, STATE_CODES[seq % STATE_CODES.length], pan),
      panNumber: pan,
      website: `https://www.${slug}.com`,
      email: `info@${slug}.com`,
      mobile: `9${pad(100000000 + Math.floor(rand() * 899999999), 9)}`,
      trustScore: 40 + Math.floor(rand() * 60),
      verificationLevel: pick(rand, VERIFY_LEVELS, seq),
      geographicReach: pick(rand, GEO_REACH, seq),
      status: 'ACTIVE',
      totalProducts: 0,
      responseRate: Math.floor(rand() * 30) + 55,
      vendorCode,
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: pick(rand, PLANS, seq),
      subscriptionActivatedAt: new Date(Date.now() - Math.floor(rand() * 200) * 86400000),
      subscriptionExpiresAt: new Date(Date.now() + (30 + Math.floor(rand() * 330)) * 86400000),
      goCashBalance: Math.floor(rand() * 50000),
      certifications: [
        { type: 'ISO', status: 'APPROVED', name: 'ISO 9001:2015' },
        { type: pick(rand, ['MSME', 'IEC', 'FSSAI', 'BIS'], seq), status: 'APPROVED' },
      ],
      gallery: { logos: [], images: [] },
      profileCompletionPercentage: 55 + Math.floor(rand() * 45),
      onboardingStatus: 'PRODUCTS_ADDED',
      onboardingStartedAt: new Date(Date.now() - 300 * 86400000),
      onboardingCompletedAt: new Date(Date.now() - 200 * 86400000),
      maxSampleProducts: 5,
      createdBy: 'master-directory-seed',
    });
    seq++;
  }
  await createManyBatched('company', rows, true);
  console.log(`  companies inserted: ${rows.length}`);

  // CompanyIndustry mappings (2 per company)
  const companies = await prisma.company.findMany({ select: { id: true, slug: true } });
  const ciRows: any[] = [];
  const seenCI = new Set<string>();
  for (const co of companies) {
    for (let k = 0; k < 2; k++) {
      const ind = industries[(companies.indexOf(co) * 3 + k * 7) % industries.length];
      const key = `${co.id}|${ind.id}`;
      if (seenCI.has(key)) continue;
      seenCI.add(key);
      ciRows.push({ companyId: co.id, industryId: ind.id });
    }
  }
  await createManyBatched('companyIndustry', ciRows, true);
  console.log(`  company-industry mappings: ${ciRows.length}`);

  // CompanyCategory mappings (2 per company)
  const ccRows: any[] = [];
  const seenCC = new Set<string>();
  for (const co of companies) {
    for (let k = 0; k < 2; k++) {
      const lc = legacyCategories[(companies.indexOf(co) * 5 + k * 11) % legacyCategories.length];
      const key = `${co.id}|${lc.id}`;
      if (seenCC.has(key)) continue;
      seenCC.add(key);
      ccRows.push({ companyId: co.id, categoryId: lc.id });
    }
  }
  await createManyBatched('companyCategory', ccRows, true);
  console.log(`  company-category mappings: ${ccRows.length}`);

  // ProductBrand (1 per company)
  const pbRows: any[] = [];
  const existingPB = new Set((await prisma.productBrand.findMany({ select: { slug: true } })).map((b) => b.slug));
  for (const co of companies) {
    const name = `${co.slug.split('-').slice(0, 2).join(' ')} ${pick(rand, ['Brand', 'Line', 'Mark'], companies.indexOf(co))}`;
    const slug = slugify(name);
    if (existingPB.has(slug)) continue;
    pbRows.push({
      companyId: co.id,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      slug,
      description: `Official brand of ${co.slug}`,
      status: 'ACTIVE',
    });
  }
  await createManyBatched('productBrand', pbRows, true);
  console.log(`  product brands: ${pbRows.length}`);
  return rows.length;
}

// -------------------- Phase 8: Locations (Territory) --------------------
async function phase8Locations(): Promise<number> {
  timeHr('PHASE 8 — Locations (Territory: states/districts/cities/industrial areas)');
  const existing = new Map<string, string>();
  for (const t of await prisma.territory.findMany({ select: { id: true, type: true, name: true, parentId: true } })) {
    existing.set(`${t.type}|${t.name}|${t.parentId || ''}`, t.id);
  }
  const rows: any[] = [];
  const stateIds: Record<string, string> = {};
  let count = 0;

  for (const state of TERRITORY_STATES) {
    const skey = `STATE|${state.name}|`;
    let stateId = existing.get(skey) || '';
    if (!stateId) {
      const row = {
        name: state.name,
        type: 'STATE',
        coverage: 'STATE' as const,
        isActive: true,
        metadata: { kind: state.type, name: state.name },
      };
      rows.push(row);
      count++;
    }
    // parent link resolved after insert — we insert states first then children with stateId
    stateIds[state.name] = stateId;
  }

  await createManyBatched('territory', rows);
  // fetch state ids
  for (const s of await prisma.territory.findMany({ where: { type: 'STATE' }, select: { id: true, name: true } })) {
    stateIds[s.name] = s.id;
  }
  rows.length = 0;

  for (const state of TERRITORY_STATES) {
    const parentId = stateIds[state.name];
    if (!parentId) continue;
    for (const d of state.districts) {
      const key = `DISTRICT|${d}|${parentId}`;
      if (!existing.has(key)) {
        rows.push({ name: d, type: 'DISTRICT', parentId, coverage: 'DISTRICT', isActive: true, metadata: { state: state.name } });
        count++;
      }
    }
    for (const c of state.cities) {
      const key = `CITY|${c}|${parentId}`;
      if (!existing.has(key)) {
        rows.push({ name: c, type: 'CITY', parentId, coverage: 'LOCAL', isActive: true, metadata: { state: state.name } });
        count++;
      }
    }
    for (const ia of state.industrialAreas) {
      const key = `INDUSTRIAL_AREA|${ia}|${parentId}`;
      if (!existing.has(key)) {
        rows.push({ name: ia, type: 'INDUSTRIAL_AREA', parentId, coverage: 'LOCAL', isActive: true, metadata: { state: state.name } });
        count++;
      }
    }
  }
  await createManyBatched('territory', rows);
  console.log(`  locations inserted: ${count}`);
  return count;
}

// -------------------- Phase 9: Units, Attributes, Synonyms, Aliases --------------------
async function phase9Extras(rand: () => number): Promise<number> {
  timeHr('PHASE 9 — Units / Attributes / Synonyms / Aliases');

  // Units
  const unitRows = UNITS.map((u) => ({ name: u.name, symbol: u.symbol, category: u.category }));
  const existingUnits = new Set((await prisma.catalogUnit.findMany({ select: { name: true } })).map((u) => u.name));
  await createManyBatched('catalogUnit', unitRows.filter((u) => !existingUnits.has(u.name)));
  console.log(`  units: ${unitRows.length}`);

  // GlobalAttributes
  const attrRows = GLOBAL_ATTRIBUTES.map((a) => ({
    name: a.name,
    slug: slugify(a.name),
    label: a.label,
      type: a.type as any,
    unit: a.unit,
    options: a.options,
    isActive: true,
  }));
  const existingAttrs = new Set((await prisma.globalAttribute.findMany({ select: { slug: true } })).map((a) => a.slug));
  await createManyBatched('globalAttribute', attrRows.filter((a) => !existingAttrs.has(a.slug)), true);
  console.log(`  global attributes: ${attrRows.length}`);

  // Synonyms
  const synMap = new Map<string, string[]>();
  for (const [a, b] of SYNONYM_PAIRS) {
    if (!synMap.has(a)) synMap.set(a, []);
    synMap.get(a)!.push(b);
  }
  const synRows = [...synMap.entries()].map(([term, synonyms]) => ({ term, synonyms, locale: 'en', isActive: true }));
  const existingSyns = new Set((await prisma.catalogSynonym.findMany({ select: { term: true } })).map((s) => s.term));
  await createManyBatched('catalogSynonym', synRows.filter((s) => !existingSyns.has(s.term)));
  console.log(`  synonyms: ${synRows.length}`);

  // CatalogAliases for product items (1 per item, spec-swapped)
  const items = await prisma.catalogItem.findMany({
    where: { type: 'Product' },
    select: { id: true, name: true, keywords: true },
  });
  const aliasRows: any[] = [];
  const existingAlias = new Set<string>();
  const SWAP: Record<string, string> = {
    standard: 'regular',
    premium: 'deluxe',
    'heavy duty': 'heavy',
    economy: 'budget',
    industrial: 'industry-grade',
    'export grade': 'export',
    compact: 'space-saving',
    'high capacity': 'high-output',
    automated: 'automatic',
    'eco-friendly': 'green',
  };
  for (const item of items) {
    const lower = item.name.toLowerCase();
    let swapped = lower;
    for (const [k, v] of Object.entries(SWAP)) {
      if (lower.includes(k)) {
        swapped = lower.replace(k, v);
        break;
      }
    }
    if (swapped === lower) {
      // fallback: append synonym from keyword list
      const kw = item.keywords.find((k) => k.length > 6);
      if (!kw) continue;
      swapped = `${item.name} ${kw}`;
    }
    const key = `${item.id}|${slugify(swapped)}`;
    if (existingAlias.has(key)) continue;
    existingAlias.add(key);
    aliasRows.push({ catalogItemId: item.id, alias: swapped, locale: 'en', isActive: true });
  }
  await createManyBatched('catalogAlias', aliasRows, true);
  console.log(`  aliases: ${aliasRows.length}`);

  // CatalogAttributes (3 per product item)
  const attrDefs = GLOBAL_ATTRIBUTES.slice(0, 12);
  const itemAttrRows: any[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const picks = shuffled(rand, attrDefs).slice(0, 3);
    for (const def of picks) {
      const value = pick(rand, def.options, i);
      itemAttrRows.push({
        catalogItemId: item.id,
        key: slugify(def.name),
        label: def.label,
        value,
        unit: def.unit || null,
        sortOrder: 0,
        isActive: true,
      });
    }
  }
  await createManyBatched('catalogAttribute', itemAttrRows, true);
  console.log(`  catalog attributes: ${itemAttrRows.length}`);
  return itemAttrRows.length;
}

// -------------------- Mappings: CatalogIndustryMapping + IndustryCategoryMapping --------------------
async function phaseMappings(): Promise<void> {
  timeHr('MAPPINGS — CatalogIndustryMapping + IndustryCategoryMapping');
  const industries = await prisma.industry.findMany({ select: { id: true, name: true } });
  const categories = await prisma.catalogCategory.findMany({ select: { id: true, name: true, slug: true } });
  const existingMappings = await prisma.catalogIndustryMapping.findMany({ select: { industryId: true, catalogCategoryId: true } });
  const seen = new Set(existingMappings.map((m) => `${m.industryId}|${m.catalogCategoryId}`));

  const rows: any[] = [];
  for (const cat of categories) {
    const ind = industries.find((i) => cat.name.startsWith(i.name))!;
    if (!ind) continue;
    const key = `${ind.id}|${cat.id}`;
    if (seen.has(key)) continue;
    rows.push({ industryId: ind.id, catalogCategoryId: cat.id, relevanceScore: 1.0, isPrimary: true });
  }
  await createManyBatched('catalogIndustryMapping', rows, true);
  console.log(`  catalog-industry mappings: ${rows.length}`);

  // Legacy IndustryCategoryMapping (12 existing industries x matched legacy categories)
  const legacyCategories = await prisma.category.findMany({ select: { id: true, name: true } });
  const existingICM = await prisma.industryCategoryMapping.findMany({ select: { industryId: true, categoryId: true } });
  const seenICM = new Set(existingICM.map((m) => `${m.industryId}|${m.categoryId}`));
  const icmRows: any[] = [];
  for (const ind of industries) {
    let matched = 0;
    for (const lc of legacyCategories) {
      const lowerInd = ind.name.toLowerCase();
      const lowerCat = lc.name.toLowerCase();
      const tokens = lowerCat.split(' ');
      const hit = tokens.some((t) => t.length > 3 && (lowerInd.includes(t) || lowerCat.includes(lowerInd.split(' ')[0])));
      if (hit) {
        const key = `${ind.id}|${lc.id}`;
        if (!seenICM.has(key)) {
          icmRows.push({ industryId: ind.id, categoryId: lc.id, isActive: true });
          matched++;
        }
      }
    }
    if (matched === 0) {
      const fallback = legacyCategories.find((c) => c.name === 'Machinery & Equipment') || legacyCategories[0];
      const key = `${ind.id}|${fallback.id}`;
      if (!seenICM.has(key)) icmRows.push({ industryId: ind.id, categoryId: fallback.id, isActive: true });
    }
  }
  await createManyBatched('industryCategoryMapping', icmRows, true);
  console.log(`  legacy industry-category mappings: ${icmRows.length}`);
}

// -------------------- Verification & Report --------------------
async function verify(phase: string, model: string, expected: number): Promise<number> {
  const count = await countRows(model);
  const pct = Math.min(100, Math.round((count / expected) * 100));
  console.log(`  VERIFY ${phase}: ${model} = ${count} / ${expected} (${pct}%)`);
  return count;
}

async function writeAuditReport(): Promise<void> {
  const results: Record<string, number> = {};
  results['Industry'] = await countRows('industry');
  results['CatalogCategory'] = await countRows('catalogCategory');
  results['CatalogSubcategory'] = await countRows('catalogSubcategory');
  results['CatalogItem'] = await countRows('catalogItem');
  results['CatalogItem.Product'] = await prisma.catalogItem.count({ where: { type: 'Product' } });
  results['CatalogItem.Service'] = await prisma.catalogItem.count({ where: { type: 'Service' } });
  results['ProductMaster'] = await countRows('productMaster');
  results['ServiceMaster'] = await countRows('serviceMaster');
  results['GlobalBrand'] = await countRows('globalBrand');
  results['Company'] = await countRows('company');
  results['CompanyIndustry'] = await countRows('companyIndustry');
  results['CompanyCategory'] = await countRows('companyCategory');
  results['ProductBrand'] = await countRows('productBrand');
  results['Territory'] = await countRows('territory');
  results['CatalogUnit'] = await countRows('catalogUnit');
  results['GlobalAttribute'] = await countRows('globalAttribute');
  results['CatalogSynonym'] = await countRows('catalogSynonym');
  results['CatalogAlias'] = await countRows('catalogAlias');
  results['CatalogAttribute'] = await countRows('catalogAttribute');
  results['CatalogIndustryMapping'] = await countRows('catalogIndustryMapping');
  results['IndustryCategoryMapping'] = await countRows('industryCategoryMapping');

  const lines: string[] = [
    '# Master Business Directory — Phase Audit Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Entity | Count | Target | % |',
    '| --- | --- | --- | --- |',
  ];
  const targets: Record<string, number> = {
    Industry: 160,
    CatalogCategory: 1600,
    CatalogSubcategory: 6400,
    CatalogItem: 46400,
    'CatalogItem.Product': 33600,
    'CatalogItem.Service': 12800,
    ProductMaster: 33600,
    ServiceMaster: 12800,
    GlobalBrand: 400,
    Company: 500,
    CompanyIndustry: 1000,
    CompanyCategory: 1000,
    ProductBrand: 500,
    Territory: 2800,
    CatalogUnit: 61,
    GlobalAttribute: 20,
    CatalogSynonym: 240,
    CatalogAlias: 33600,
    CatalogAttribute: 100800,
    CatalogIndustryMapping: 1600,
    IndustryCategoryMapping: 120,
  };
  for (const [k, v] of Object.entries(results)) {
    const target = targets[k] || v;
    const pct = Math.min(100, Math.round((v / target) * 100));
    lines.push(`| ${k} | ${v} | ${target} | ${pct}% |`);
  }
  lines.push('', '## Verdict', '');
  const overall = Math.round(
    (Object.entries(results).reduce((acc, [k, v]) => acc + Math.min(1, v / (targets[k] || v)), 0) / Object.keys(results).length) * 100,
  );
  lines.push(`Overall master directory fill rate: **${overall}%**`, '');
  lines.push(overall >= 95 ? '**STATUS: COMPLETE — Master Business Directory ≥95% populated**' : `**STATUS: ${overall < 95 ? 'IN PROGRESS' : 'COMPLETE'}**`, '');

  const outDir = path.join(process.cwd(), 'docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'MASTER-DIRECTORY-AUDIT.md');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log(`  audit report written to ${outPath}`);
}

async function main(): Promise<void> {
  const rand = mulberry32(SEED);
  const start = Date.now();
  const phases = (process.env.PHASES || '1,2,3,M,4,5,6,7,8,9').split(',').map((s) => s.trim().toUpperCase());

  const industryByCat = new Map<string, string>();
  const chapterByCat = new Map<string, string>();
  const runPhase = async (p: string) => {
    switch (p) {
      case '1':
        await phase1Industries(rand);
        break;
      case '2':
        await phase2Categories(rand);
        break;
      case '3':
        await phase3Subcategories(rand);
        break;
      case '4': {
        const categories = await prisma.catalogCategory.findMany({ select: { id: true } });
        const industryMap = await prisma.catalogIndustryMapping.findMany({ select: { catalogCategoryId: true, industryId: true } });
        const subcats = await prisma.catalogSubcategory.findMany({ select: { id: true, categoryId: true } });
        const catById = new Map(categories.map((c) => [c.id, c]));
        const chapterById = await buildChapterById();
        for (const sub of subcats) {
          const cat = catById.get(sub.categoryId);
          if (!cat) continue;
          const m = industryMap.find((x) => x.catalogCategoryId === cat.id);
          if (m) {
            industryByCat.set(cat.id, m.industryId);
            chapterByCat.set(cat.id, chapterById.get(m.industryId) || '84');
          }
        }
        await phase4Products(rand, industryByCat, chapterByCat);
        break;
      }
      case '5': {
        if (industryByCat.size === 0) {
          const categories = await prisma.catalogCategory.findMany({ select: { id: true } });
          const industryMap = await prisma.catalogIndustryMapping.findMany({ select: { catalogCategoryId: true, industryId: true } });
          const catById = new Map(categories.map((c) => [c.id, c]));
          const subcats = await prisma.catalogSubcategory.findMany({ select: { id: true, categoryId: true } });
          const chapterById = await buildChapterById();
          for (const sub of subcats) {
            const cat = catById.get(sub.categoryId);
            if (!cat) continue;
            const m = industryMap.find((x) => x.catalogCategoryId === cat.id);
            if (m) {
              industryByCat.set(cat.id, m.industryId);
              chapterByCat.set(cat.id, chapterById.get(m.industryId) || '84');
            }
          }
        }
        await phase5Services(rand, industryByCat);
        break;
      }
      case '6':
        await phase6Brands(rand);
        break;
      case '7':
        await phase7Companies(rand, industryByCat);
        break;
      case '8':
        await phase8Locations();
        break;
      case '9':
        await phase9Extras(rand);
        break;
      case 'M':
        await phaseMappings();
        break;
      default:
        console.log(`Unknown phase ${p}`);
    }
  };

  for (const p of phases) {
    const t0 = Date.now();
    await runPhase(p);
    console.log(`  elapsed: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }

  await writeAuditReport();
  await prisma.$disconnect();
  console.log(`\nDONE in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
