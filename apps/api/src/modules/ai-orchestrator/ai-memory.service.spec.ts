import { Test, TestingModule } from '@nestjs/testing';
import { AiMemoryService } from './ai-memory.service';

describe('AiMemoryService', () => {
  let service: AiMemoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiMemoryService],
    }).compile();

    service = module.get<AiMemoryService>(AiMemoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return undefined for missing key', () => {
      const result = service.get('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should store and retrieve value', () => {
      service.set('key-1', { data: 'test' });
      const result = service.get('key-1');
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('delete', () => {
    it('should remove stored value', () => {
      service.set('key-1', 'value');
      service.delete('key-1');
      expect(service.get('key-1')).toBeUndefined();
    });
  });
});
