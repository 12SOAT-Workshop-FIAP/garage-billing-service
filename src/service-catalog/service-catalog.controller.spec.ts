import { Test, TestingModule } from '@nestjs/testing';
import { ServiceCatalogController } from './service-catalog.controller';
import { ServiceCatalogService } from './service-catalog.service';

describe('ServiceCatalogController', () => {
  let controller: ServiceCatalogController;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceCatalogController],
      providers: [{ provide: ServiceCatalogService, useValue: mockService }],
    }).compile();
    controller = module.get<ServiceCatalogController>(ServiceCatalogController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a service', async () => {
    mockService.create.mockResolvedValue({ _id: '1', name: 'Oil Change' });
    expect((await controller.create({ name: 'Oil Change', price: 80, duration: 60 } as any))._id).toBe('1');
  });

  it('should list all services', async () => {
    mockService.findAll.mockResolvedValue([{ _id: '1' }]);
    expect(await controller.findAll()).toHaveLength(1);
  });

  it('should find service by id', async () => {
    mockService.findOne.mockResolvedValue({ _id: '1' });
    expect((await controller.findOne('1'))._id).toBe('1');
  });

  it('should update a service', async () => {
    mockService.update.mockResolvedValue({ _id: '1', name: 'Updated' });
    expect((await controller.update('1', { name: 'Updated' })).name).toBe('Updated');
  });

  it('should delete a service', async () => {
    mockService.remove.mockResolvedValue(undefined);
    await expect(controller.remove('1')).resolves.toBeUndefined();
  });
});
