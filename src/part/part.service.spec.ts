import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PartService } from './part.service';
import { Part } from './schemas/part.schema';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('PartService', () => {
  let service: PartService;

  const mockPartModel = {
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    findByIdAndDelete: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockConstructor = Object.assign(function (dto: any) {
    return {
      ...dto,
      _id: 'mock-id',
      save: jest.fn().mockResolvedValue({ _id: 'mock-id', ...dto }),
    };
  }, mockPartModel);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PartService, { provide: getModelToken(Part.name), useValue: mockConstructor }],
    }).compile();
    service = module.get<PartService>(PartService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create a part', async () => {
      mockPartModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      const result = await service.create({ name: 'Filter', partNumber: 'F-01', price: 35, costPrice: 20, stockQuantity: 100 } as any);
      expect(result._id).toBe('mock-id');
    });

    it('should throw ConflictException if part exists', async () => {
      mockPartModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
      await expect(service.create({ partNumber: 'F-01' } as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all parts', async () => {
      mockPartModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: '1' }]) });
      expect(await service.findAll()).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a part', async () => {
      mockPartModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
      expect((await service.findOne('1'))._id).toBe('1');
    });
    it('should throw NotFoundException', async () => {
      mockPartModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPartNumber', () => {
    it('should find part by number', async () => {
      mockPartModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1', partNumber: 'F-01' }) });
      expect((await service.findByPartNumber('F-01')).partNumber).toBe('F-01');
    });
    it('should throw NotFoundException', async () => {
      mockPartModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findByPartNumber('NONE')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLowStock', () => {
    it('should return low stock parts', async () => {
      mockPartModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: '1', stockQuantity: 2 }]) });
      expect(await service.findLowStock()).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update a part', async () => {
      mockPartModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1', name: 'Updated' }) });
      expect((await service.update('1', { name: 'Updated' } as any)).name).toBe('Updated');
    });
    it('should throw NotFoundException', async () => {
      mockPartModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.update('999', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStock', () => {
    it('should update stock quantity', async () => {
      const mockPart = { _id: '1', stockQuantity: 10, save: jest.fn().mockResolvedValue({ _id: '1', stockQuantity: 50 }) };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPart as any);
      const result = await service.updateStock('1', 50);
      expect(result.stockQuantity).toBe(50);
    });
  });

  describe('remove', () => {
    it('should remove a part', async () => {
      mockPartModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
      await expect(service.remove('1')).resolves.toBeUndefined();
    });
    it('should throw NotFoundException', async () => {
      mockPartModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
