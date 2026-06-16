import { Test, TestingModule } from '@nestjs/testing';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';

describe('QuoteController', () => {
  let controller: QuoteController;
  let service: jest.Mocked<QuoteService>;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    submit: jest.fn(),
    withdraw: jest.fn(),
    accept: jest.fn(),
    reject: jest.fn(),
    revise: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuoteController],
      providers: [{ provide: QuoteService, useValue: mockService }],
    }).compile();

    controller = module.get<QuoteController>(QuoteController);
    service = module.get(QuoteService);
  });

  describe('create', () => {
    it('should call service.create with correct params', async () => {
      const dto = { totalAmount: 10000 };
      mockService.create.mockResolvedValue({ id: 'q-1' });

      const result = await controller.create('vendor-1', 'rfq-1', dto as any, 'user-1');

      expect(service.create).toHaveBeenCalledWith('vendor-1', 'rfq-1', 'user-1', dto);
      expect(result).toEqual({ id: 'q-1' });
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with companyId and rfqId', async () => {
      mockService.findAll.mockResolvedValue([{ id: 'q-1' }]);

      const result = await controller.findAll('buyer-1', 'rfq-1');

      expect(service.findAll).toHaveBeenCalledWith('rfq-1', 'buyer-1');
      expect(result).toEqual([{ id: 'q-1' }]);
    });
  });

  describe('findById', () => {
    it('should call service.findById with correct params', async () => {
      mockService.findById.mockResolvedValue({ id: 'q-1' });

      const result = await controller.findById('buyer-1', 'rfq-1', 'quote-1');

      expect(service.findById).toHaveBeenCalledWith('rfq-1', 'quote-1', 'buyer-1');
      expect(result).toEqual({ id: 'q-1' });
    });
  });

  describe('update', () => {
    it('should call service.update with correct params', async () => {
      const dto = { notes: 'Updated notes' };
      mockService.update.mockResolvedValue({ id: 'q-1' });

      const result = await controller.update('rfq-1', 'quote-1', dto, 'user-1');

      expect(service.update).toHaveBeenCalledWith('rfq-1', 'quote-1', 'user-1', dto);
      expect(result).toEqual({ id: 'q-1' });
    });
  });

  describe('submit', () => {
    it('should call service.submit with correct params', async () => {
      mockService.submit.mockResolvedValue({ id: 'q-1', status: 'SUBMITTED' });

      const result = await controller.submit('rfq-1', 'quote-1', 'user-1');

      expect(service.submit).toHaveBeenCalledWith('rfq-1', 'quote-1', 'user-1');
      expect(result).toEqual({ id: 'q-1', status: 'SUBMITTED' });
    });
  });

  describe('withdraw', () => {
    it('should call service.withdraw with reason', async () => {
      mockService.withdraw.mockResolvedValue({ id: 'q-1', status: 'WITHDRAWN' });

      const result = await controller.withdraw('rfq-1', 'quote-1', 'Changed mind', 'user-1');

      expect(service.withdraw).toHaveBeenCalledWith('rfq-1', 'quote-1', 'user-1', 'Changed mind');
      expect(result).toEqual({ id: 'q-1', status: 'WITHDRAWN' });
    });

    it('should call service.withdraw without reason', async () => {
      mockService.withdraw.mockResolvedValue({ id: 'q-1', status: 'WITHDRAWN' });

      const result = await controller.withdraw('rfq-1', 'quote-1', undefined, 'user-1');

      expect(service.withdraw).toHaveBeenCalledWith('rfq-1', 'quote-1', 'user-1', undefined);
    });
  });

  describe('accept', () => {
    it('should call service.accept with correct params', async () => {
      mockService.accept.mockResolvedValue({ id: 'q-1', status: 'ACCEPTED' });

      const result = await controller.accept('rfq-1', 'quote-1', 'buyer-1', 'user-1');

      expect(service.accept).toHaveBeenCalledWith('rfq-1', 'quote-1', 'buyer-1', 'user-1');
      expect(result).toEqual({ id: 'q-1', status: 'ACCEPTED' });
    });
  });

  describe('reject', () => {
    it('should call service.reject with reason', async () => {
      mockService.reject.mockResolvedValue({ id: 'q-1', status: 'REJECTED' });

      const result = await controller.reject('rfq-1', 'quote-1', 'buyer-1', 'Too expensive', 'user-1');

      expect(service.reject).toHaveBeenCalledWith('rfq-1', 'quote-1', 'buyer-1', 'user-1', 'Too expensive');
      expect(result).toEqual({ id: 'q-1', status: 'REJECTED' });
    });

    it('should call service.reject without reason', async () => {
      mockService.reject.mockResolvedValue({ id: 'q-1', status: 'REJECTED' });

      const result = await controller.reject('rfq-1', 'quote-1', 'buyer-1', undefined, 'user-1');

      expect(service.reject).toHaveBeenCalledWith('rfq-1', 'quote-1', 'buyer-1', 'user-1', undefined);
    });
  });

  describe('revise', () => {
    it('should call service.revise with correct params', async () => {
      const dto = { totalAmount: 8000, revisionComment: 'Lower price' };
      mockService.revise.mockResolvedValue({ id: 'q-1', quoteVersion: 2 });

      const result = await controller.revise('rfq-1', 'quote-1', dto, 'user-1');

      expect(service.revise).toHaveBeenCalledWith('rfq-1', 'quote-1', 'user-1', dto);
      expect(result).toEqual({ id: 'q-1', quoteVersion: 2 });
    });
  });
});
