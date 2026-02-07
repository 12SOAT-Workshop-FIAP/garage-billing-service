import { Test, TestingModule } from '@nestjs/testing';
import { PartController } from './part.controller';
import { PartService } from './part.service';

describe('PartController', () => {
  let controller: PartController;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findLowStock: jest.fn(),
    update: jest.fn(),
    updateStock: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PartController],
      providers: [{ provide: PartService, useValue: mockService }],
    }).compile();
    controller = module.get<PartController>(PartController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a part', async () => {
    mockService.create.mockResolvedValue({ _id: '1', name: 'Filter' });
    expect((await controller.create({ name: 'Filter', partNumber: 'F-01', price: 35, costPrice: 20, stockQuantity: 100 } as any))._id).toBe('1');
  });

  it('should list all parts', async () => {
    mockService.findAll.mockResolvedValue([{ _id: '1' }]);
    expect(await controller.findAll()).toHaveLength(1);
  });

  it('should list low stock parts', async () => {
    mockService.findLowStock.mockResolvedValue([{ _id: '1' }]);
    expect(await controller.findLowStock()).toHaveLength(1);
  });

  it('should find part by id', async () => {
    mockService.findOne.mockResolvedValue({ _id: '1' });
    expect((await controller.findOne('1'))._id).toBe('1');
  });

  it('should update a part', async () => {
    mockService.update.mockResolvedValue({ _id: '1', name: 'Updated' });
    expect((await controller.update('1', { name: 'Updated' })).name).toBe('Updated');
  });

  it('should update stock', async () => {
    mockService.updateStock.mockResolvedValue({ _id: '1', stockQuantity: 50 });
    expect((await controller.updateStock('1', 50)).stockQuantity).toBe(50);
  });

  it('should delete a part', async () => {
    mockService.remove.mockResolvedValue(undefined);
    await expect(controller.remove('1')).resolves.toBeUndefined();
  });
});
