import { Test, TestingModule } from '@nestjs/testing';
import { CompanyVerificationController } from './company-verification.controller';
import { CompanyVerificationService } from './company-verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';

describe('CompanyVerificationController', () => {
  let controller: CompanyVerificationController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      submit: jest.fn(),
      findAll: jest.fn(),
      findByCompany: jest.fn(),
      findById: jest.fn(),
      review: jest.fn(),
    };

    const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyVerificationController],
      providers: [{ provide: CompanyVerificationService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<CompanyVerificationController>(CompanyVerificationController);
  });

  it('should submit', async () => {
    service.submit.mockResolvedValue({ id: '1', status: 'PENDING' });
    const result = await controller.submit({ companyId: 'comp-1' } as any, 'user-1');
    expect(result.status).toBe('PENDING');
  });

  it('should findAll', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
    const result = await controller.findAll({});
    expect(result.meta.total).toBe(0);
  });

  it('should findByCompany', async () => {
    service.findByCompany.mockResolvedValue([{ id: '1' }]);
    const result = await controller.findByCompany('comp-1');
    expect(result).toHaveLength(1);
  });

  it('should findOne', async () => {
    service.findById.mockResolvedValue({ id: '1' });
    const result = await controller.findOne('1');
    expect(result.id).toBe('1');
  });

  it('should review', async () => {
    service.review.mockResolvedValue({ id: '1', status: 'APPROVED' });
    const result = await controller.review('1', { status: 'APPROVED' } as any, 'user-1');
    expect(result.status).toBe('APPROVED');
  });
});
