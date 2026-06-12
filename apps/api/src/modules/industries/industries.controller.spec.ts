import { Test, TestingModule } from '@nestjs/testing';
import { IndustriesController } from './industries.controller';
import { IndustriesService } from './industries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';

describe('IndustriesController', () => {
  let controller: IndustriesController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findBySlug: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndustriesController],
      providers: [{ provide: IndustriesService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<IndustriesController>(IndustriesController);
  });

  it('should create', async () => {
    service.create.mockResolvedValue({ id: '1', name: 'Tech' });
    const result = await controller.create({ name: 'Tech' } as any, 'user-1');
    expect(result.name).toBe('Tech');
  });

  it('should findAll', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
    const result = await controller.findAll({});
    expect(result.meta.total).toBe(0);
  });

  it('should findBySlug', async () => {
    service.findBySlug.mockResolvedValue({ slug: 'tech' });
    const result = await controller.findBySlug('tech');
    expect(result.slug).toBe('tech');
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
});
