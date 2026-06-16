import { Test, TestingModule } from '@nestjs/testing';
import { RfqController } from './rfq.controller';
import { RfqService } from './rfq.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CanActivate } from '@nestjs/common';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqDto } from './dto/update-rfq.dto';
import { RfqSearchDto } from './dto/rfq-search.dto';
import { RfqQueryDto } from './dto/rfq-query.dto';

const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

describe('RfqController', () => {
  let controller: RfqController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      publish: jest.fn(),
      close: jest.fn(),
      reopen: jest.fn(),
      cancel: jest.fn(),
      getCreditBalance: jest.fn(),
      purchaseCreditPack: jest.fn(),
      adminGrantCredits: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RfqController],
      providers: [{ provide: RfqService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard).useValue(mockGuard)
      .overrideGuard(CompanyOwnerGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();

    controller = module.get<RfqController>(RfqController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should call service.create with companyId, dto, userId', async () => {
      const dto = { title: 'Test', rfqType: 'PRODUCT', quantity: 1, unit: 'pcs' } as CreateRfqDto;
      service.create.mockResolvedValue({ id: 'rfq-1', title: 'Test' });

      const result = await controller.create('c1', dto, 'u1');

      expect(service.create).toHaveBeenCalledWith('c1', dto, 'u1');
      expect(result.title).toBe('Test');
    });
  });

  // ---------------------------------------------------------------------------
  // FIND ALL
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should call service.findAll with companyId and query', async () => {
      const query = { page: 2, limit: 10, status: 'ACTIVE' } as any;
      service.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 2, limit: 10, totalPages: 0 } });

      const result = await controller.findAll('c1', query);

      expect(service.findAll).toHaveBeenCalledWith('c1', query);
      expect(result.meta.page).toBe(2);
    });

    it('should pass query params including status filter', async () => {
      const query = { status: 'DRAFT' } as RfqQueryDto;
      service.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });

      await controller.findAll('c1', query);

      expect(service.findAll).toHaveBeenCalledWith('c1', { status: 'DRAFT' });
    });
  });

  // ---------------------------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------------------------
  describe('search', () => {
    it('should call service.search with companyId and query', async () => {
      const query = { rfqNumber: 'TRFQ', title: 'steel' } as RfqSearchDto;
      service.search.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });

      const result = await controller.search('c1', query);

      expect(service.search).toHaveBeenCalledWith('c1', query);
      expect(result.meta.total).toBe(0);
    });

    it('should pass search filters correctly', async () => {
      const query = { status: 'ACTIVE', dateFrom: '2026-06-01', dateTo: '2026-06-30' } as RfqSearchDto;
      service.search.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });

      await controller.search('c1', query);

      expect(service.search).toHaveBeenCalledWith('c1', { status: 'ACTIVE', dateFrom: '2026-06-01', dateTo: '2026-06-30' });
    });
  });

  // ---------------------------------------------------------------------------
  // FIND BY ID
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should call service.findById with id', async () => {
      service.findById.mockResolvedValue({ id: 'rfq-1', title: 'Test' });

      const result = await controller.findById('rfq-1');

      expect(service.findById).toHaveBeenCalledWith('rfq-1');
      expect(result.id).toBe('rfq-1');
    });
  });

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should call service.update with id, dto, userId', async () => {
      const dto = { title: 'Updated' } as UpdateRfqDto;
      service.update.mockResolvedValue({ id: 'rfq-1', title: 'Updated' });

      const result = await controller.update('rfq-1', dto, 'u1');

      expect(service.update).toHaveBeenCalledWith('rfq-1', dto, 'u1');
      expect(result.title).toBe('Updated');
    });
  });

  // ---------------------------------------------------------------------------
  // REMOVE
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should call service.remove with id and userId and return 204', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove('rfq-1', 'u1');

      expect(service.remove).toHaveBeenCalledWith('rfq-1', 'u1');
      expect(result).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // PUBLISH
  // ---------------------------------------------------------------------------
  describe('publish', () => {
    it('should call service.publish with id and userId', async () => {
      service.publish.mockResolvedValue({ id: 'rfq-1', status: 'ACTIVE' });

      const result = await controller.publish('rfq-1', 'u1');

      expect(service.publish).toHaveBeenCalledWith('rfq-1', 'u1');
      expect(result.status).toBe('ACTIVE');
    });
  });

  // ---------------------------------------------------------------------------
  // CANCEL
  // ---------------------------------------------------------------------------
  describe('cancel', () => {
    it('should call service.cancel with id, reason, userId', async () => {
      service.cancel.mockResolvedValue({ id: 'rfq-1', status: 'CANCELLED' });

      const result = await controller.cancel('rfq-1', 'No longer needed', 'u1');

      expect(service.cancel).toHaveBeenCalledWith('rfq-1', 'No longer needed', 'u1');
      expect(result.status).toBe('CANCELLED');
    });

    it('should pass undefined reason when body is empty', async () => {
      service.cancel.mockResolvedValue({ id: 'rfq-1', status: 'CANCELLED' });

      await controller.cancel('rfq-1', undefined, 'u1');

      expect(service.cancel).toHaveBeenCalledWith('rfq-1', undefined, 'u1');
    });
  });

  // ---------------------------------------------------------------------------
  // CLOSE
  // ---------------------------------------------------------------------------
  describe('close', () => {
    it('should call service.close with id and userId', async () => {
      service.close.mockResolvedValue({ id: 'rfq-1', status: 'CLOSED' });

      const result = await controller.close('rfq-1', 'u1');

      expect(service.close).toHaveBeenCalledWith('rfq-1', 'u1');
      expect(result.status).toBe('CLOSED');
    });
  });

  // ---------------------------------------------------------------------------
  // REOPEN
  // ---------------------------------------------------------------------------
  describe('reopen', () => {
    it('should call service.reopen with id and userId', async () => {
      service.reopen.mockResolvedValue({ id: 'rfq-1', status: 'ACTIVE', reopenCount: 1 });

      const result = await controller.reopen('rfq-1', 'u1');

      expect(service.reopen).toHaveBeenCalledWith('rfq-1', 'u1');
      expect(result.status).toBe('ACTIVE');
    });
  });

  // ---------------------------------------------------------------------------
  // GET CREDIT BALANCE
  // ---------------------------------------------------------------------------
  describe('getCreditBalance', () => {
    it('should call service.getCreditBalance and return { balance }', async () => {
      service.getCreditBalance.mockResolvedValue(42);

      const result = await controller.getCreditBalance('c1');

      expect(service.getCreditBalance).toHaveBeenCalledWith('c1');
      expect(result).toEqual({ balance: 42 });
    });
  });

  // ---------------------------------------------------------------------------
  // PURCHASE CREDIT PACK
  // ---------------------------------------------------------------------------
  describe('purchaseCreditPack', () => {
    it('should call service.purchaseCreditPack with companyId and userId', async () => {
      service.purchaseCreditPack.mockResolvedValue({ id: 'pack-1', credits: 5 });

      const result = await controller.purchaseCreditPack('c1', 'u1');

      expect(service.purchaseCreditPack).toHaveBeenCalledWith('c1', 'u1');
      expect(result.id).toBe('pack-1');
    });
  });

  // ---------------------------------------------------------------------------
  // GRANT CREDITS (admin)
  // ---------------------------------------------------------------------------
  describe('grantCredits', () => {
    it('should call service.adminGrantCredits with companyId, amount, userId', async () => {
      service.adminGrantCredits.mockResolvedValue(undefined);

      const result = await controller.grantCredits('c1', 100, 'admin-u1');

      expect(service.adminGrantCredits).toHaveBeenCalledWith('c1', 100, 'admin-u1');
      expect(result).toEqual({ message: '100 credits granted' });
    });
  });

  // ---------------------------------------------------------------------------
  // GUARDS
  // ---------------------------------------------------------------------------
  describe('guard application', () => {
    it('should have JwtAuthGuard applied', async () => {
      const guards = Reflect.getMetadata('__guards__', RfqController);
      expect(guards).toBeDefined();
      const guardNames = guards.map((g: any) => g.name || g.toString());
      expect(guardNames.some((n: string) => n.includes('JwtAuthGuard'))).toBe(true);
    });

    it('should have CompanyOwnerGuard applied at class level', async () => {
      const guards = Reflect.getMetadata('__guards__', RfqController);
      const guardNames = guards.map((g: any) => g.name || g.toString());
      expect(guardNames.some((n: string) => n.includes('CompanyOwnerGuard'))).toBe(true);
    });
  });
});
