import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';

describe('CompaniesController', () => {
  let controller: CompaniesController;
  let service: Record<string, jest.Mock>;

  const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findBySlug: jest.fn(),
      searchCompanies: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      addOwner: jest.fn(),
      removeOwner: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [{ provide: CompaniesService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<CompaniesController>(CompaniesController);
  });

  it('should create', async () => {
    service.create.mockResolvedValue({ id: '1', name: 'Co' });
    const result = await controller.create({ name: 'Co', organizationId: 'org-1' } as any, 'user-1');
    expect(result.name).toBe('Co');
  });

  it('should findAll', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
    const result = await controller.findAll({});
    expect(result.meta.total).toBe(0);
  });

  it('should search', async () => {
    service.searchCompanies.mockResolvedValue({ data: [], meta: { total: 0 } });
    const result = await controller.search('tech', 'SUPPLIER', 'Mumbai', 'MH');
    expect(service.searchCompanies).toHaveBeenCalledWith('tech', { businessType: 'SUPPLIER', city: 'Mumbai', state: 'MH' });
  });

  it('should findBySlug', async () => {
    service.findBySlug.mockResolvedValue({ slug: 'test-co' });
    const result = await controller.findBySlug('test-co');
    expect(result.slug).toBe('test-co');
  });

  it('should update', async () => {
    service.update.mockResolvedValue({ id: '1', name: 'Updated' });
    const result = await controller.update('1', { name: 'Updated' } as any, 'user-1');
    expect(result.name).toBe('Updated');
  });

  it('should remove', async () => {
    await controller.remove('1', 'user-1');
    expect(service.remove).toHaveBeenCalledWith('1', 'user-1');
  });

  it('should addOwner', async () => {
    service.addOwner.mockResolvedValue({ id: 'owner-1' });
    const result = await controller.addOwner('1', 'user-2', 'user-1');
    expect(service.addOwner).toHaveBeenCalledWith('1', 'user-2', 'user-1');
  });

  it('should removeOwner', async () => {
    await controller.removeOwner('1', 'user-2', 'user-1');
    expect(service.removeOwner).toHaveBeenCalledWith('1', 'user-2', 'user-1');
  });
});
