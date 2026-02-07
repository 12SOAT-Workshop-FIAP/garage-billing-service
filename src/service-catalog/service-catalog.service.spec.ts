import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ServiceCatalogService } from './service-catalog.service';
import { ServiceCatalog } from './schemas/service-catalog.schema';
import { NotFoundException } from '@nestjs/common';

describe('ServiceCatalogService', () => {
  let service: ServiceCatalogService;

  const mockModel = {
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
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
  }, mockModel);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceCatalogService,
        { provide: getModelToken(ServiceCatalog.name), useValue: mockConstructor },
      ],
    }).compile();

    service = module.get<ServiceCatalogService>(ServiceCatalogService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a service', async () => {
      const dto = { name: 'Oil Change', price: 80, duration: 60 };
      const result = await service.create(dto as any);
      expect(result._id).toBe('mock-id');
    });
  });

  describe('findAll', () => {
    it('should return all services', async () => {
      mockModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: '1' }]) });
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: '1', name: 'Oil Change' }),
      });
      const result = await service.findOne('1');
      expect(result.name).toBe('Oil Change');
    });

    it('should throw NotFoundException', async () => {
      mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: '1', name: 'Updated' }),
      });
      const result = await service.update('1', { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException if service not found', async () => {
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.update('999', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a service', async () => {
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: '1' }),
      });
      await expect(service.remove('1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if service not found', async () => {
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
