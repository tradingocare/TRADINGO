import { Test, TestingModule } from '@nestjs/testing';
import { ProductAttributeDisplayService } from '../product-attribute-display.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RedisService } from '../../../../common/services/redis.service';

describe('ProductAttributeDisplayService', () => {
  let service: ProductAttributeDisplayService;
  let prisma: any;
  let redis: any;

  const mockPrisma = {
    categoryTemplate: { findFirst: jest.fn() },
    productAttribute: { findMany: jest.fn() },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductAttributeDisplayService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<ProductAttributeDisplayService>(ProductAttributeDisplayService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDisplayAttributes', () => {
    const mockTemplate = {
      id: 'tpl1',
      name: 'Food Template',
      version: 1,
      sections: [
        {
          id: 'sec1',
          key: 'basic-info',
          title: 'Basic Information',
          description: 'Core product details',
          icon: 'info',
          sortOrder: 0,
          isActive: true,
          fields: [
            {
              id: 'f1', key: 'weight', label: 'Weight', type: 'NUMBER',
              placeholder: null, helpText: null, unit: 'kg', isRequired: true,
              options: null, sortOrder: 0, isActive: true, defaultValue: null,
              validation: null, visibility: null, metadata: null,
              sectionId: 'sec1', createdAt: new Date(), updatedAt: new Date(),
            },
            {
              id: 'f2', key: 'ingredients', label: 'Ingredients', type: 'TAGS',
              placeholder: null, helpText: null, unit: null, isRequired: false,
              options: null, sortOrder: 1, isActive: true, defaultValue: null,
              validation: null, visibility: null, metadata: null,
              sectionId: 'sec1', createdAt: new Date(), updatedAt: new Date(),
            },
            {
              id: 'f3', key: 'organic', label: 'Organic Certified', type: 'CHECKBOX',
              placeholder: null, helpText: null, unit: null, isRequired: false,
              options: null, sortOrder: 2, isActive: true, defaultValue: null,
              validation: null, visibility: null, metadata: null,
              sectionId: 'sec1', createdAt: new Date(), updatedAt: new Date(),
            },
          ],
        },
        {
          id: 'sec2',
          key: 'pricing',
          title: 'Pricing',
          description: null,
          icon: null,
          sortOrder: 1,
          isActive: true,
          fields: [
            {
              id: 'f4', key: 'retail_price', label: 'Retail Price', type: 'PRICE',
              placeholder: null, helpText: null, unit: 'kg', isRequired: true,
              options: null, sortOrder: 0, isActive: true, defaultValue: null,
              validation: null, visibility: null, metadata: null,
              sectionId: 'sec2', createdAt: new Date(), updatedAt: new Date(),
            },
          ],
        },
      ],
    };

    const mockAttributes = [
      { id: 'a1', productId: 'p1', fieldId: 'f1', fieldKey: 'weight', value: 5 },
      { id: 'a2', productId: 'p1', fieldId: 'f2', fieldKey: 'ingredients', value: ['rice', 'spices', 'oil'] },
      { id: 'a3', productId: 'p1', fieldId: 'f3', fieldKey: 'organic', value: true },
      { id: 'a4', productId: 'p1', fieldId: 'f4', fieldKey: 'retail_price', value: 299 },
    ];

    it('should return empty result when no categoryId', async () => {
      const result = await service.getDisplayAttributes('p1');
      expect(result.sections).toEqual([]);
      expect(result.flattened).toEqual({});
    });

    it('should return empty result when no template found', async () => {
      mockPrisma.categoryTemplate.findFirst.mockResolvedValue(null);

      const result = await service.getDisplayAttributes('p1', 'cat1');
      expect(result.sections).toEqual([]);
      expect(result.flattened).toEqual({});
    });

    it('should group attributes by section with correct structure', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.categoryTemplate.findFirst.mockResolvedValue(mockTemplate);
      mockPrisma.productAttribute.findMany.mockResolvedValue(mockAttributes);

      const result = await service.getDisplayAttributes('p1', 'cat1');

      expect(result.template).toBeDefined();
      expect(result.template!.name).toBe('Food Template');
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].sectionKey).toBe('basic-info');
      expect(result.sections[0].sectionTitle).toBe('Basic Information');
      expect(result.sections[1].sectionKey).toBe('pricing');

      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should format values correctly by field type', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.categoryTemplate.findFirst.mockResolvedValue(mockTemplate);
      mockPrisma.productAttribute.findMany.mockResolvedValue(mockAttributes);

      const result = await service.getDisplayAttributes('p1', 'cat1');

      const basicFields = result.sections[0].fields;
      expect(basicFields.find(f => f.key === 'weight')!.displayValue).toBe(5);
      expect(basicFields.find(f => f.key === 'ingredients')!.displayValue).toEqual(['rice', 'spices', 'oil']);
      expect(basicFields.find(f => f.key === 'organic')!.displayValue).toBe(true);
    });

    it('should return cached result from redis', async () => {
      const cached = { sections: [{ sectionKey: 'cached' }], flattened: {} };
      mockRedis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getDisplayAttributes('p1', 'cat1');

      expect(result.sections[0].sectionKey).toBe('cached');
      expect(mockPrisma.categoryTemplate.findFirst).not.toHaveBeenCalled();
    });

    it('should sort fields by sortOrder', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.categoryTemplate.findFirst.mockResolvedValue(mockTemplate);
      mockPrisma.productAttribute.findMany.mockResolvedValue(mockAttributes);

      const result = await service.getDisplayAttributes('p1', 'cat1');

      const keys = result.sections[0].fields.map(f => f.key);
      expect(keys).toEqual(['weight', 'ingredients', 'organic']);
    });

    it('should handle empty attributes gracefully', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.categoryTemplate.findFirst.mockResolvedValue(mockTemplate);
      mockPrisma.productAttribute.findMany.mockResolvedValue([]);

      const result = await service.getDisplayAttributes('p1', 'cat1');

      expect(result.sections[0].fields[0].displayValue).toBeNull();
      expect(result.sections[0].fields[0].rawValue).toBeNull();
    });

    it('should populate flattened map', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.categoryTemplate.findFirst.mockResolvedValue(mockTemplate);
      mockPrisma.productAttribute.findMany.mockResolvedValue(mockAttributes);

      const result = await service.getDisplayAttributes('p1', 'cat1');

      expect(result.flattened.weight).toBe(5);
      expect(result.flattened.organic).toBe(true);
      expect(result.flattened.retail_price).toBe(299);
    });
  });

  describe('formatValue - 19 field types', () => {
    const callFormat = (type: string, value: any, options?: any) =>
      (service as any).formatValue(type, value, options);

    it('should format TEXT type', () => {
      expect(callFormat('TEXT', 'hello')).toBe('hello');
      expect(callFormat('TEXT', 123)).toBe('123');
      expect(callFormat('TEXT', null)).toBeNull();
    });

    it('should format TEXTAREA type', () => {
      expect(callFormat('TEXTAREA', 'long text')).toBe('long text');
    });

    it('should format NUMBER type', () => {
      expect(callFormat('NUMBER', 42)).toBe(42);
      expect(callFormat('NUMBER', '42')).toBe(42);
      expect(callFormat('NUMBER', null)).toBeNull();
    });

    it('should format PRICE type', () => {
      expect(callFormat('PRICE', 299)).toBe(299);
      expect(callFormat('PRICE', '1500')).toBe(1500);
    });

    it('should format SELECT type', () => {
      expect(callFormat('SELECT', 'option_a')).toBe('option_a');
    });

    it('should format MULTI_SELECT type', () => {
      expect(callFormat('MULTI_SELECT', ['a', 'b'])).toEqual(['a', 'b']);
      expect(callFormat('MULTI_SELECT', 'a,b,c')).toEqual(['a', 'b', 'c']);
      expect(callFormat('MULTI_SELECT', null)).toBeNull();
    });

    it('should format CHECKBOX type', () => {
      expect(callFormat('CHECKBOX', true)).toBe(true);
      expect(callFormat('CHECKBOX', 'true')).toBe(true);
      expect(callFormat('CHECKBOX', 1)).toBe(true);
      expect(callFormat('CHECKBOX', '1')).toBe(true);
      expect(callFormat('CHECKBOX', 'yes')).toBe(true);
      expect(callFormat('CHECKBOX', false)).toBe(false);
      expect(callFormat('CHECKBOX', null)).toBeNull();
    });

    it('should format RADIO type', () => {
      expect(callFormat('RADIO', 'option_x')).toBe('option_x');
    });

    it('should format TAGS type', () => {
      expect(callFormat('TAGS', ['tag1', 'tag2'])).toEqual(['tag1', 'tag2']);
      expect(callFormat('TAGS', 'tag1,tag2,tag3')).toEqual(['tag1', 'tag2', 'tag3']);
      expect(callFormat('TAGS', '')).toEqual([]);
    });

    it('should format DATE type', () => {
      const result = callFormat('DATE', '2024-06-15T00:00:00Z');
      expect(result).toBe('2024-06-15');
      expect(callFormat('DATE', '2024-06-15')).toBe('2024-06-15');
      expect(callFormat('DATE', null)).toBeNull();
    });

    it('should format URL type', () => {
      expect(callFormat('URL', 'https://example.com')).toBe('https://example.com');
    });

    it('should format PHONE type', () => {
      expect(callFormat('PHONE', '+91-9876543210')).toBe('+91-9876543210');
    });

    it('should format FILE type', () => {
      expect(callFormat('FILE', 'https://cdn.example.com/doc.pdf')).toBe('https://cdn.example.com/doc.pdf');
      const obj = { url: 'https://cdn.example.com/file.pdf', name: 'Doc' };
      expect(callFormat('FILE', obj)).toEqual(obj);
    });

    it('should format IMAGE type', () => {
      expect(callFormat('IMAGE', 'https://cdn.example.com/img.jpg')).toBe('https://cdn.example.com/img.jpg');
    });

    it('should format VIDEO type', () => {
      expect(callFormat('VIDEO', 'https://cdn.example.com/vid.mp4')).toBe('https://cdn.example.com/vid.mp4');
    });

    it('should format PDF type', () => {
      expect(callFormat('PDF', 'https://cdn.example.com/doc.pdf')).toBe('https://cdn.example.com/doc.pdf');
    });

    it('should format LOCATION type', () => {
      const loc = { lat: 19.076, lng: 72.8777, address: 'Mumbai' };
      const result = callFormat('LOCATION', loc);
      expect(result.lat).toBe(19.076);
      expect(result.lng).toBe(72.8777);
      expect(result.address).toBe('Mumbai');

      const altLoc = { latitude: 12.9716, longitude: 77.5946, address: 'Bangalore' };
      const altResult = callFormat('LOCATION', altLoc);
      expect(altResult.lat).toBe(12.9716);
      expect(altResult.lng).toBe(77.5946);

      expect(callFormat('LOCATION', null)).toBeNull();
    });

    it('should format RICH_TEXT type', () => {
      expect(callFormat('RICH_TEXT', '<p>Hello</p>')).toBe('<p>Hello</p>');
    });

    it('should format JSON type', () => {
      const obj = { key: 'value', nested: { a: 1 } };
      expect(callFormat('JSON', obj)).toEqual(obj);
    });

    it('should handle unknown types gracefully', () => {
      expect(callFormat('UNKNOWN', 'anything')).toBe('anything');
      expect(callFormat('UNKNOWN', null)).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('should delete cache key', async () => {
      await service.invalidateCache('p1');
      expect(mockRedis.del).toHaveBeenCalledWith('product:attributes:p1');
    });
  });
});
