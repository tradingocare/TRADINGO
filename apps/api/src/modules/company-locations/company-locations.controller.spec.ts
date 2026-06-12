import { Test, TestingModule } from '@nestjs/testing';
import { CompanyLocationsController } from './company-locations.controller';
import { CompanyLocationsService } from './company-locations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';

describe('CompanyLocationsController', () => {
  let controller: CompanyLocationsController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findByCompany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyLocationsController],
      providers: [{ provide: CompanyLocationsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<CompanyLocationsController>(CompanyLocationsController);
  });

  it('should create', async () => {
    service.create.mockResolvedValue({ id: '1', city: 'Mumbai' });
    const result = await controller.create({ city: 'Mumbai' } as any, 'user-1');
    expect(result.city).toBe('Mumbai');
  });

  it('should findByCompany', async () => {
    service.findByCompany.mockResolvedValue([{ city: 'Mumbai' }]);
    const result = await controller.findByCompany('comp-1');
    expect(result).toHaveLength(1);
  });

  it('should findOne', async () => {
    service.findById.mockResolvedValue({ id: '1' });
    const result = await controller.findOne('1');
    expect(result.id).toBe('1');
  });

  it('should update', async () => {
    service.update.mockResolvedValue({ id: '1', city: 'Delhi' });
    const result = await controller.update('1', { city: 'Delhi' } as any, 'user-1');
    expect(result.city).toBe('Delhi');
  });

  it('should remove', async () => {
    await controller.remove('1', 'user-1');
    expect(service.remove).toHaveBeenCalledWith('1', 'user-1');
  });
});
