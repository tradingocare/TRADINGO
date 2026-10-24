import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { TaxonomyService } from './taxonomy.service';

// Phase 2-B — public CatalogCategory-by-slug authority contract.
// READ-ONLY: exact slug lookup, public-safe field allowlist, 404 on missing.

describe('TaxonomyService.findCategoryBySlug (Phase 2-B)', () => {
  let service: TaxonomyService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const row = {
    id: 'cc-1',
    slug: 'steel-metals',
    name: 'Steel & Metals',
    description: 'desc',
    icon: null,
    seoTitle: 'Steel & Metals — TRADINGO',
    seoDescription: 'seo desc',
    isActive: true,
    sortOrder: 1,
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    subcategories: [],
    _count: { products: 3 },
  };

  beforeEach(async () => {
    prisma = {
      catalogCategory: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxonomyService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<TaxonomyService>(TaxonomyService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns the public-safe record for a valid slug', async () => {
    prisma.catalogCategory.findUnique.mockResolvedValueOnce(row);
    const out: any = await service.findCategoryBySlug('steel-metals');
    expect(out.slug).toBe('steel-metals');
    expect(out.seoTitle).toBe('Steel & Metals — TRADINGO');
    expect(prisma.catalogCategory.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'steel-metals' } }),
    );
  });

  it('trims the slug before lookup', async () => {
    prisma.catalogCategory.findUnique.mockResolvedValueOnce(row);
    await service.findCategoryBySlug('  steel-metals  ');
    expect(prisma.catalogCategory.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'steel-metals' } }),
    );
  });

  it('throws NotFoundException when no record exists (callers render 404)', async () => {
    prisma.catalogCategory.findUnique.mockResolvedValueOnce(null);
    await expect(service.findCategoryBySlug('no-such-category')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException on blank slug without querying', async () => {
    await expect(service.findCategoryBySlug('   ')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.catalogCategory.findUnique).not.toHaveBeenCalled();
  });

  it('returns (not hides) inactive records so callers can NOINDEX them', async () => {
    prisma.catalogCategory.findUnique.mockResolvedValueOnce({ ...row, isActive: false });
    const out: any = await service.findCategoryBySlug('steel-metals');
    expect(out.isActive).toBe(false);
  });

  it('selects only public-safe fields (no internal/audit surface)', async () => {
    prisma.catalogCategory.findUnique.mockResolvedValueOnce(row);
    await service.findCategoryBySlug('steel-metals');
    const select = prisma.catalogCategory.findUnique.mock.calls[0][0].select;
    const topKeys = Object.keys(select).sort();
    for (const k of ['id', 'slug', 'name', 'seoTitle', 'seoDescription', 'isActive']) {
      expect(topKeys).toContain(k);
    }
    expect(topKeys).not.toContain('createdBy');
    expect(topKeys).not.toContain('internalNotes');
  });
});
