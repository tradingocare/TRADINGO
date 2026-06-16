import { Test, TestingModule } from '@nestjs/testing';
import { CsvParserService } from '../services/csv-parser.service';

describe('CsvParserService', () => {
  let service: CsvParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvParserService],
    }).compile();
    service = module.get<CsvParserService>(CsvParserService);
  });

  const validHeader = 'S.No,Category (Landing Page),Sub Category,Product / Service Name,Type,Unit Mapping,Alt / Secondary Units,Quantity Parameters\n';

  function csvRow(overrides: Partial<Record<string, string | undefined>> = {}): string {
    const val = (key: string, fallback: string) => {
      const v = (overrides as any)[key];
      return v !== undefined ? v : fallback;
    };
    return [
      val('sNo', '1'),
      val('category', 'Test Category'),
      val('subCategory', 'Test Sub'),
      val('name', 'Test Product'),
      val('type', 'Product'),
      val('unit', 'Piece'),
      val('altUnits', 'Dozen'),
      val('qty', '10'),
    ].join(',');
  }

  describe('parse', () => {
    it('should parse valid CSV rows', () => {
      const csv = validHeader + csvRow();
      const result = service.parse(csv);

      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(0);
      expect(result.rows[0].name).toBe('Test Product');
      expect(result.rows[0].type).toBe('Product');
      expect(result.rows[0].category).toBe('Test Category');
      expect(result.rows[0].subCategory).toBe('Test Sub');
      expect(result.rows[0].unit).toBe('Piece');
    });

    it('should parse multiple rows', () => {
      const csv = validHeader +
        csvRow({ sNo: '1', name: 'Product A', category: 'Cat1' }) + '\n' +
        csvRow({ sNo: '2', name: 'Product B', category: 'Cat1' }) + '\n' +
        csvRow({ sNo: '3', name: 'Service C', type: 'Service', category: 'Cat2' });

      const result = service.parse(csv);

      expect(result.validRows).toBe(3);
      expect(result.products.length).toBe(2);
      expect(result.services.length).toBe(1);
    });

    it('should extract unique categories', () => {
      const csv = validHeader +
        csvRow({ sNo: '1', name: 'P1', category: 'Electronics' }) + '\n' +
        csvRow({ sNo: '2', name: 'P2', category: 'Electronics' }) + '\n' +
        csvRow({ sNo: '3', name: 'P3', category: 'Clothing' });

      const result = service.parse(csv);
      expect(result.categories).toEqual(expect.arrayContaining(['Electronics', 'Clothing']));
      expect(result.categories.length).toBe(2);
    });

    it('should extract subcategories per category', () => {
      const csv = validHeader +
        csvRow({ sNo: '1', name: 'P1', category: 'Electronics', subCategory: 'Mobiles' }) + '\n' +
        csvRow({ sNo: '2', name: 'P2', category: 'Electronics', subCategory: 'Laptops' }) + '\n' +
        csvRow({ sNo: '3', name: 'P3', category: 'Clothing', subCategory: 'Shirts' });

      const result = service.parse(csv);
      expect(result.subcategories.get('Electronics')).toEqual(expect.arrayContaining(['Mobiles', 'Laptops']));
      expect(result.subcategories.get('Clothing')).toEqual(['Shirts']);
    });

    it('should report invalid rows', () => {
      const csv = validHeader +
        csvRow({ name: '' }) + '\n' +
        csvRow({ type: 'InvalidType' });

      const result = service.parse(csv);
      expect(result.invalidRows).toBe(2);
      expect(result.validRows).toBe(0);
    });

    it('should return empty result for empty CSV', () => {
      const result = service.parse('');
      expect(result.totalRows).toBe(0);
      expect(result.validRows).toBe(0);
    });

    it('should return empty result for header-only CSV', () => {
      const result = service.parse(validHeader);
      expect(result.totalRows).toBe(0);
    });

    it('should handle Buffer input', () => {
      const csv = validHeader + csvRow();
      const result = service.parse(Buffer.from(csv));
      expect(result.validRows).toBe(1);
    });

    it('should detect invalid header', () => {
      const csv = 'Bad,Header\n1,Test';
      const result = service.parse(csv);
      expect(result.validRows).toBe(0);
      expect(result.errors[0].message).toContain('Invalid CSV header');
    });

    it('should handle large batch of rows', () => {
      const rows: string[] = [];
      for (let i = 1; i <= 500; i++) {
        rows.push(csvRow({ sNo: String(i), name: `Product ${i}`, category: `Cat ${Math.ceil(i / 100)}` }));
      }
      const csv = validHeader + rows.join('\n');
      const result = service.parse(csv);
      expect(result.validRows).toBe(500);
      expect(result.categories.length).toBe(5);
    });

    it('should handle product names with special characters', () => {
      const csv = validHeader + csvRow({ name: 'LED TV 40" - Full HD (2024 Model)' });
      const result = service.parse(csv);
      expect(result.validRows).toBe(1);
      expect(result.rows[0].name).toBe('LED TV 40" - Full HD (2024 Model)');
    });

    it('should handle services correctly', () => {
      const csv = validHeader + csvRow({ name: 'Consulting Service', type: 'Service', unit: 'Per Hour' });
      const result = service.parse(csv);
      expect(result.services.length).toBe(1);
      expect(result.products.length).toBe(0);
      expect(result.rows[0].type).toBe('Service');
    });
  });
});
