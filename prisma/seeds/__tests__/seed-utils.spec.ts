import { parseCsvLine, parseCsv, slugify, generateUniqueSlug, generateKeywords, createJobRow } from '../seed.utils';
import * as fs from 'fs';
import * as path from 'path';

describe('SeedUtils', () => {
  describe('parseCsvLine', () => {
    it('should parse simple CSV line', () => {
      const result = parseCsvLine('1,Electronics,Mobiles,Phone,Product,Piece,Box,100');
      expect(result).toEqual(['1', 'Electronics', 'Mobiles', 'Phone', 'Product', 'Piece', 'Box', '100']);
    });

    it('should handle quoted values', () => {
      const result = parseCsvLine('1,Electronics,Mobiles,"LED TV 40"" - Full HD",Product,Piece,Box,100');
      expect(result[3]).toBe('LED TV 40" - Full HD');
    });

    it('should handle empty trailing fields', () => {
      const result = parseCsvLine('1,Cat,Sub,Name,Product,,,');
      expect(result[5]).toBe('');
      expect(result[6]).toBe('');
      expect(result[7]).toBe('');
    });

    it('should handle values with commas inside quotes', () => {
      const result = parseCsvLine('1,Cat,Sub,"Product, Model X",Product,Piece,,');
      expect(result[3]).toBe('Product, Model X');
    });
  });

  describe('slugify', () => {
    it('should convert name to slug', () => {
      expect(slugify('Electronics & Appliances')).toBe('electronics-appliances');
    });

    it('should handle special characters', () => {
      expect(slugify('Steel & Metals 2024!')).toBe('steel-metals-2024');
    });

    it('should collapse multiple hyphens', () => {
      expect(slugify('Foo   Bar')).toBe('foo-bar');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(slugify(' -Foo- ')).toBe('foo');
    });
  });

  describe('generateUniqueSlug', () => {
    it('should return base slug when unique', () => {
      const existing = new Set<string>(['foo']);
      expect(generateUniqueSlug('Bar', existing)).toBe('bar');
    });

    it('should append counter when slug exists', () => {
      const existing = new Set<string>(['bar']);
      expect(generateUniqueSlug('Bar', existing)).toBe('bar-2');
    });

    it('should increment counter for multiple duplicates', () => {
      const existing = new Set<string>(['bar', 'bar-2', 'bar-3']);
      expect(generateUniqueSlug('Bar', existing)).toBe('bar-4');
    });
  });

  describe('generateKeywords', () => {
    it('should extract words longer than 2 chars', () => {
      expect(generateKeywords('LED TV 40 Inch')).toEqual(['led', 'inch']);
    });

    it('should handle comma-separated words', () => {
      expect(generateKeywords('smart,phone,device')).toEqual(['smart', 'phone', 'device']);
    });

    it('should return empty array for empty input', () => {
      expect(generateKeywords('')).toEqual([]);
    });
  });

  describe('createJobRow', () => {
    it('should create a job row insert object', () => {
      const row = createJobRow('job-1', 1, 'IMPORTED', 'CATEGORY', 'cat-1', { name: 'Test' });
      expect(row.importJobId).toBe('job-1');
      expect(row.rowNumber).toBe(1);
      expect(row.status).toBe('IMPORTED');
      expect(row.entityType).toBe('CATEGORY');
      expect(row.entityId).toBe('cat-1');
      expect(row.rawData).toEqual({ name: 'Test' });
      expect(row.errors).toEqual([]);
      expect(row.warnings).toEqual([]);
    });

    it('should include errors when provided', () => {
      const row = createJobRow('job-1', 1, 'ERROR', 'PRODUCT', undefined, {}, ['Something went wrong']);
      expect(row.errors).toEqual(['Something went wrong']);
    });
  });

  describe('parseCsv', () => {
    const tmpDir = path.resolve(__dirname, '../__testdata__');
    const tmpFile = path.join(tmpDir, 'test-catalog.csv');

    beforeAll(() => {
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(tmpFile, [
        'S.No,Category,Sub Category,Name,Type,Unit,Alt,Quantity',
        '1,Electronics,Mobiles,Smartphone,Product,Piece,Box,100',
        '2,Electronics,Laptops,Laptop,Product,Piece,Carton,50',
        '3,Accounting,Tax,Audit Service,Service,Per Project,Contract,1',
      ].join('\n'), 'utf-8');
    });

    afterAll(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should parse CSV file into rows', () => {
      const result = parseCsv(tmpFile);
      expect(result.rows.length).toBe(3);
      expect(result.categories).toEqual(['Electronics', 'Accounting']);
    });

    it('should extract category mapping', () => {
      const result = parseCsv(tmpFile);
      expect(result.categories).toContain('Electronics');
      expect(result.categories).toContain('Accounting');
    });

    it('should extract subcategory mapping', () => {
      const result = parseCsv(tmpFile);
      expect(result.subcategoryMap.get('Electronics')).toEqual(new Set(['Mobiles', 'Laptops']));
    });

    it('should return empty for empty file', () => {
      const emptyFile = path.join(tmpDir, 'empty.csv');
      fs.writeFileSync(emptyFile, 'S.No', 'utf-8');
      const result = parseCsv(emptyFile);
      expect(result.rows.length).toBe(0);
    });

    it('should skip invalid rows', () => {
      const badFile = path.join(tmpDir, 'bad.csv');
      fs.writeFileSync(badFile, [
        'S.No,Category,Sub,Name,Type',
        '1,Elec,,,InvalidType',
      ].join('\n'), 'utf-8');
      const result = parseCsv(badFile);
      expect(result.rows.length).toBe(0);
    });
  });
});
