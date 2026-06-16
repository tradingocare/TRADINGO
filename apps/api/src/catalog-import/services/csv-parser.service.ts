import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

export interface CsvRow {
  serialNo: number;
  category: string;
  subCategory: string;
  name: string;
  type: 'Product' | 'Service';
  unit: string;
  altUnits: string;
  quantityParams: string;
}

export interface CsvParseResult {
  rows: CsvRow[];
  categories: string[];
  subcategories: Map<string, string[]>;
  products: CsvRow[];
  services: CsvRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: { row: number; message: string }[];
}

@Injectable()
export class CsvParserService {
  private readonly logger = new Logger(CsvParserService.name);

  parse(csvContent: string | Buffer): CsvParseResult {
    const raw = typeof csvContent === 'string' ? csvContent : csvContent.toString('utf-8');
    const records: string[][] = parse(raw, {
      columns: false,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      trim: true,
    });

    if (records.length < 2) {
      return {
        rows: [],
        categories: [],
        subcategories: new Map(),
        products: [],
        services: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errors: [{ row: 0, message: 'CSV file is empty or has only header' }],
      };
    }

    const header = records[0];
    const validHeader = this.validateHeader(header);
    if (!validHeader) {
      return {
        rows: [],
        categories: [],
        subcategories: new Map(),
        products: [],
        services: [],
        totalRows: records.length - 1,
        validRows: 0,
        invalidRows: records.length - 1,
        errors: [{ row: 0, message: `Invalid CSV header. Expected columns: S.No, Category, Sub Category, Product/Service Name, Type, Unit Mapping, Alt/Secondary Units, Quantity Parameters. Got: ${header.join(', ')}` }],
      };
    }

    const rows: CsvRow[] = [];
    const errors: { row: number; message: string }[] = [];
    const categorySet = new Set<string>();
    const subcategoryMap = new Map<string, Set<string>>();

    for (let i = 1; i < records.length; i++) {
      const cols = records[i];
      const rowNum = i + 1;

      if (!cols || cols.length < 4 || !cols[0]) {
        continue;
      }

      const serialNo = parseInt(cols[0], 10);
      const category = (cols[1] || '').trim();
      const subCategory = (cols[2] || '').trim();
      const name = (cols[3] || '').trim();
      const typeRaw = (cols[4] || '').trim();
      const unit = (cols[5] || '').trim();
      const altUnits = (cols[6] || '').trim();
      const quantityParams = (cols[7] || '').trim();

      if (!name) {
        errors.push({ row: rowNum, message: 'Product/Service Name is empty' });
        continue;
      }

      if (typeRaw !== 'Product' && typeRaw !== 'Service') {
        errors.push({ row: rowNum, message: `Invalid Type "${typeRaw}". Must be "Product" or "Service"` });
        continue;
      }

      const row: CsvRow = {
        serialNo: isNaN(serialNo) ? i : serialNo,
        category,
        subCategory,
        name,
        type: typeRaw as 'Product' | 'Service',
        unit,
        altUnits,
        quantityParams,
      };

      rows.push(row);

      if (category) {
        categorySet.add(category);
        if (!subcategoryMap.has(category)) {
          subcategoryMap.set(category, new Set());
        }
        if (subCategory) {
          subcategoryMap.get(category)!.add(subCategory);
        }
      }
    }

    const finalSubcategories = new Map<string, string[]>();
    for (const [cat, subs] of subcategoryMap) {
      finalSubcategories.set(cat, [...subs]);
    }

    this.logger.log(`Parsed ${rows.length} valid rows from CSV (${errors.length} errors)`);

    return {
      rows,
      categories: [...categorySet],
      subcategories: finalSubcategories,
      products: rows.filter((r) => r.type === 'Product'),
      services: rows.filter((r) => r.type === 'Service'),
      totalRows: records.length - 1,
      validRows: rows.length,
      invalidRows: errors.length,
      errors,
    };
  }

  private validateHeader(header: string[]): boolean {
    if (!header || header.length < 4) return false;
    const normalized = header.map((h) => h.toLowerCase().trim());
    const sNoMatch = normalized[0].includes('s.no') || (normalized[0].includes('s') && normalized[0].includes('no'));
    const categoryMatch = normalized[1].includes('category');
    const nameMatch = normalized[3].includes('product') || normalized[3].includes('service') || normalized[3].includes('name');
    return sNoMatch && categoryMatch && nameMatch;
  }
}
