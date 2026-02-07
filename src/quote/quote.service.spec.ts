import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { QuoteService } from './quote.service';
import { Quote, QuoteStatus } from './schemas/quote.schema';
import { MessagingService } from '../messaging/messaging.service';
import { NotFoundException } from '@nestjs/common';

describe('QuoteService', () => {
  let service: QuoteService;

  const mockQuoteModel = function (dto: any) {
    this.data = { ...dto, _id: 'mock-quote-id' };
    this.save = jest.fn().mockResolvedValue(this.data);
  };

  Object.assign(mockQuoteModel, {
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  });

  const mockMessagingService = { publish: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuoteService,
        { provide: getModelToken(Quote.name), useValue: mockQuoteModel },
        { provide: MessagingService, useValue: mockMessagingService },
      ],
    }).compile();
    service = module.get<QuoteService>(QuoteService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create a quote and calculate total', async () => {
      const dto = {
        workOrderId: 'wo-1',
        customerId: 'c-1',
        items: [
          { name: 'A', description: 'D', quantity: 2, unitPrice: 50 },
          { name: 'B', description: 'D', quantity: 1, unitPrice: 100 },
        ],
      };
      const result = await service.create(dto as any);
      expect(result.totalAmount).toBe(200);
      expect(mockMessagingService.publish).toHaveBeenCalledWith('quote.created', expect.any(Object));
    });
  });

  describe('findAll', () => {
    it('should return all quotes', async () => {
      (mockQuoteModel as any).find.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: '1' }]) });
      expect(await service.findAll()).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a quote', async () => {
      (mockQuoteModel as any).findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
      expect((await service.findOne('1'))._id).toBe('1');
    });
    it('should throw NotFoundException', async () => {
      (mockQuoteModel as any).findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByWorkOrder', () => {
    it('should return quotes by work order', async () => {
      (mockQuoteModel as any).find.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: '1' }]) });
      expect(await service.findByWorkOrder('wo-1')).toHaveLength(1);
    });
  });

  describe('approve', () => {
    it('should approve a valid quote', async () => {
      const mockQuote = {
        _id: 'q-1', workOrderId: 'wo-1', status: QuoteStatus.SENT,
        validUntil: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue({ _id: 'q-1', status: QuoteStatus.APPROVED, approvedAt: new Date() }),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockQuote as any);
      const result = await service.approve('q-1');
      expect(result.status).toBe(QuoteStatus.APPROVED);
      expect(mockMessagingService.publish).toHaveBeenCalledWith('quote.approved', expect.any(Object));
    });

    it('should throw if quote expired', async () => {
      const mockQuote = {
        _id: 'q-1', status: QuoteStatus.SENT,
        validUntil: new Date(Date.now() - 86400000),
        save: jest.fn().mockResolvedValue({ status: QuoteStatus.EXPIRED }),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockQuote as any);
      await expect(service.approve('q-1')).rejects.toThrow('Quote has expired');
    });
  });

  describe('reject', () => {
    it('should reject a quote', async () => {
      const mockQuote = {
        _id: 'q-1', workOrderId: 'wo-1', status: QuoteStatus.SENT,
        save: jest.fn().mockResolvedValue({ _id: 'q-1', status: QuoteStatus.REJECTED }),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockQuote as any);
      const result = await service.reject('q-1');
      expect(result.status).toBe(QuoteStatus.REJECTED);
      expect(mockMessagingService.publish).toHaveBeenCalledWith('quote.rejected', expect.any(Object));
    });
  });

  describe('send', () => {
    it('should send a quote', async () => {
      const mockQuote = {
        _id: 'q-1', workOrderId: 'wo-1', customerId: 'c-1', totalAmount: 100, status: QuoteStatus.PENDING,
        save: jest.fn().mockResolvedValue({ _id: 'q-1', status: QuoteStatus.SENT }),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockQuote as any);
      const result = await service.send('q-1');
      expect(result.status).toBe(QuoteStatus.SENT);
      expect(mockMessagingService.publish).toHaveBeenCalledWith('quote.sent', expect.any(Object));
    });
  });
});
