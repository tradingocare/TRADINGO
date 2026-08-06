import {
  PrismaClient,
  Role,
  ProductStatus,
  StockStatus,
  CompanyStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BUYER_EMAIL = process.env.E2E_BUYER_EMAIL || 'e2e-buyer@tradingo.com';
const BUYER_PASSWORD = process.env.E2E_BUYER_PASSWORD || 'TestBuyer@123';
const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL || 'e2e-seller@tradingo.com';
const SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD || 'TestSeller@123';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tradingo.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'TestAdmin@123';

async function upsertUser(email: string, password: string, name: string, role: Role, panNumber?: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, isActive: true, emailVerifiedAt: new Date(), passwordHash, panNumber },
    create: {
      email,
      passwordHash,
      name,
      role,
      isActive: true,
      emailVerifiedAt: new Date(),
      panNumber,
    },
  });
}

async function upsertCompany(name: string, slug: string, ownerId: string) {
  const company = await prisma.company.upsert({
    where: { slug },
    update: { name, status: CompanyStatus.ACTIVE },
    create: {
      name,
      slug,
      status: CompanyStatus.ACTIVE,
      businessType: 'MANUFACTURER',
      gstNumber: '27AABCE1234E1Z5',
      panNumber: 'AABCE1234E',
      trustScore: 87,
      verificationLevel: 'LEVEL_2',
      totalProducts: 11,
      createdBy: ownerId,
    },
  });

  const owner = await prisma.companyOwner.findFirst({ where: { companyId: company.id } });
  if (!owner) {
    await prisma.companyOwner.create({ data: { companyId: company.id, userId: ownerId, isPrimary: true } });
  }
  return company;
}

async function upsertCategory(name: string, slug: string) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, isActive: true },
    create: { name, slug, isActive: true },
  });
}

async function upsertCatalog() {
  const pcbc = await prisma.catalogCategory.upsert({
    where: { slug: 'pcb-components' },
    update: { name: 'PCB Components', isActive: true },
    create: { slug: 'pcb-components', name: 'PCB Components', seoTitle: 'PCB Components', seoDescription: 'PCB Components on TRADINGO', isActive: true },
  });
  const pcbSub = await prisma.catalogSubcategory.upsert({
    where: { categoryId_slug: { categoryId: pcbc.id, slug: 'pcb-boards' } },
    update: { name: 'PCB Boards' },
    create: { categoryId: pcbc.id, slug: 'pcb-boards', name: 'PCB Boards' },
  });
  await prisma.catalogItem.upsert({
    where: { slug: 'industrial-pcb-board-4-layer' },
    update: { subcategoryId: pcbSub.id, name: 'Industrial PCB Board 4-Layer', unit: 'piece', isActive: true },
    create: {
      subcategoryId: pcbSub.id,
      type: 'Product',
      name: 'Industrial PCB Board 4-Layer',
      slug: 'industrial-pcb-board-4-layer',
      unit: 'piece',
      keywords: ['pcb', 'printed circuit board', '4-layer'],
      synonyms: ['pcb board', 'printed circuit board'],
      seoTitle: 'Industrial PCB Board 4-Layer',
      seoDescription: 'Industrial PCB Board 4-Layer on TRADINGO',
      isActive: true,
    },
  });

  const orgc = await prisma.catalogCategory.upsert({
    where: { slug: 'organic-chemicals' },
    update: { name: 'Organic Chemicals', isActive: true },
    create: { slug: 'organic-chemicals', name: 'Organic Chemicals', seoTitle: 'Organic Chemicals', seoDescription: 'Organic Chemicals on TRADINGO', isActive: true },
  });
  const chemSub = await prisma.catalogSubcategory.upsert({
    where: { categoryId_slug: { categoryId: orgc.id, slug: 'industrial-solvents' } },
    update: { name: 'Industrial Solvents' },
    create: { categoryId: orgc.id, slug: 'industrial-solvents', name: 'Industrial Solvents' },
  });
  await prisma.catalogItem.upsert({
    where: { slug: 'industrial-grade-solvent-99-9' },
    update: { subcategoryId: chemSub.id, name: 'Industrial Grade Solvent 99.9%', unit: 'litre', isActive: true },
    create: {
      subcategoryId: chemSub.id,
      type: 'Product',
      name: 'Industrial Grade Solvent 99.9%',
      slug: 'industrial-grade-solvent-99-9',
      unit: 'litre',
      keywords: ['solvent', 'chemical', 'industrial'],
      synonyms: ['chemical solvent'],
      seoTitle: 'Industrial Grade Solvent 99.9%',
      seoDescription: 'Industrial Grade Solvent 99.9% on TRADINGO',
      isActive: true,
    },
  });
}

async function upsertProduct(opts: {
  companyId: string;
  categoryId: string;
  catalogItemId: string;
  name: string;
  slug: string;
  moq: number;
  unit: string;
  specifications: { key: string; value: string }[];
  slabs: { minQty: number; maxQty: number | null; price: number }[];
}) {
  const existing = await prisma.product.findUnique({ where: { slug: opts.slug } });
  if (existing) {
    return existing;
  }

  const product = await prisma.product.create({
    data: {
      companyId: opts.companyId,
      categoryId: opts.categoryId,
      catalogItemId: opts.catalogItemId,
      name: opts.name,
      slug: opts.slug,
      shortDescription: `${opts.name} — listed on TRADINGO`,
      description: `${opts.name} — quality B2B supply through TRADINGO marketplace.`,
      productType: 'PHYSICAL',
      status: ProductStatus.ACTIVE,
      moq: opts.moq,
      unit: opts.unit,
      monthlyOrders: 790,
      viewCount: 12000,
      savedCount: 340,
      gstInvoiceAvailable: true,
      trustScoreSnapshot: 87,
      countryOfOrigin: 'India',
      returnPolicy: '7-day return',
      createdBy: opts.companyId,
    },
  });

  await prisma.productSpecification.createMany({
    data: opts.specifications.map((s, i) => ({ productId: product.id, key: s.key, label: s.key, value: s.value, sortOrder: i })),
  });

  await prisma.productPriceSlab.createMany({
    data: opts.slabs.map((s) => ({ productId: product.id, ...s, currency: 'INR' })),
  });

  await prisma.productMedia.create({
    data: { productId: product.id, type: 'IMAGE', url: `https://example.com/${opts.slug}.jpg`, title: opts.name, isPrimary: true, sortOrder: 0 },
  });

  await prisma.productInventory.create({
    data: { productId: product.id, availableQuantity: 5000, reservedQuantity: 0, minimumThreshold: 100, stockStatus: StockStatus.IN_STOCK },
  });

  return product;
}

async function main() {
  console.log('Starting E2E seed...');

  const buyer = await upsertUser(BUYER_EMAIL, BUYER_PASSWORD, 'E2E Buyer', Role.VIEWER);
  const seller = await upsertUser(SELLER_EMAIL, SELLER_PASSWORD, 'E2E Seller', Role.MANAGER, 'AABCE1234E');
  const admin = await upsertUser(ADMIN_EMAIL, ADMIN_PASSWORD, 'E2E Admin', Role.ADMIN);
  console.log(`Users ready: ${buyer.email} / ${seller.email} / ${admin.email}`);

  const sellerCompany = await upsertCompany('Test Seller Company', 'cmp-seller-001', seller.id);
  await upsertCompany('Test Buyer Corp', 'cmp-buyer-001', buyer.id);

  const pcbCategory = await upsertCategory('PCB Components', 'pcb-components');
  await upsertCategory('Organic Chemicals', 'organic-chemicals');

  await upsertCatalog();

  const pcbItem = await prisma.catalogItem.findUnique({ where: { slug: 'industrial-pcb-board-4-layer' } });
  const solventItem = await prisma.catalogItem.findUnique({ where: { slug: 'industrial-grade-solvent-99-9' } });

  if (!pcbItem) throw new Error('PCB catalog item missing');
  if (!solventItem) throw new Error('Solvent catalog item missing');

  const pcb = await upsertProduct({
    companyId: sellerCompany.id,
    categoryId: pcbCategory.id,
    catalogItemId: pcbItem.id,
    name: 'Industrial PCB Board 4-Layer',
    slug: 'industrial-pcb-board-4-layer',
    moq: 100,
    unit: 'piece',
    specifications: [
      { key: 'Material', value: 'FR-4' },
      { key: 'Layers', value: '4-Layer' },
      { key: 'Copper Weight', value: '1 oz' },
    ],
    slabs: [
      { minQty: 100, maxQty: 499, price: 10.5 },
      { minQty: 1000, maxQty: 4999, price: 8 },
      { minQty: 5000, maxQty: null, price: 6 },
    ],
  });

  const solvent = await upsertProduct({
    companyId: sellerCompany.id,
    categoryId: (await prisma.category.findUnique({ where: { slug: 'organic-chemicals' } }))!.id,
    catalogItemId: solventItem.id,
    name: 'Industrial Grade Solvent 99.9%',
    slug: 'industrial-grade-solvent-99-9',
    moq: 1,
    unit: 'litre',
    specifications: [
      { key: 'Purity', value: '99.9%' },
    ],
    slabs: [
      { minQty: 1, maxQty: 1000, price: 120 },
      { minQty: 1001, maxQty: null, price: 110 },
    ],
  });

  console.log(`Products ready: ${pcb?.slug ?? 'skipped'} / ${solvent?.slug ?? 'skipped'}`);
  console.log('E2E seed completed successfully');
}

main()
  .catch((err) => {
    console.error('E2E seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });