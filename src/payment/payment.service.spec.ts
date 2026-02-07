import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PaymentService } from './payment.service';
import { Payment, PaymentStatus, PaymentMethod } from './schemas/payment.schema';
import { MercadoPagoService } from './mercado-pago.service';
import { MessagingService } from '../messaging/messaging.service';
import { NotFoundException } from '@nestjs/common';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockPaymentModel = function (dto: any) {
    this.data = { ...dto, _id: 'mock-id' };
    this.save = jest.fn().mockResolvedValue(this.data);
  };

  Object.assign(mockPaymentModel, {
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  });

  const mockMercadoPagoService = { createPayment: jest.fn(), getPaymentStatus: jest.fn(), refundPayment: jest.fn() };
  const mockMessagingService = { publish: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getModelToken(Payment.name), useValue: mockPaymentModel },
        { provide: MercadoPagoService, useValue: mockMercadoPagoService },
        { provide: MessagingService, useValue: mockMessagingService },
      ],
    }).compile();
    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create a payment', async () => {
      const dto = { quoteId: 'q-1', workOrderId: 'wo-1', customerId: 'c-1', amount: 100, paymentMethod: PaymentMethod.PIX };
      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(mockMessagingService.publish).toHaveBeenCalledWith('payment.created', expect.any(Object));
    });
  });

  describe('processPayment', () => {
    it('should process and approve payment', async () => {
      const mockPayment = {
        _id: 'p-1', amount: 100, paymentMethod: PaymentMethod.PIX, workOrderId: 'wo-1', quoteId: 'q-1',
        status: PaymentStatus.PENDING,
        save: jest.fn().mockImplementation(function () { return Promise.resolve(this); }),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPayment as any);
      mockMercadoPagoService.createPayment.mockResolvedValue({ id: 'mp-1', status: 'approved' });

      const result = await service.processPayment('p-1');
      expect(result.mercadoPagoId).toBe('mp-1');
      expect(mockMessagingService.publish).toHaveBeenCalledWith('payment.approved', expect.any(Object));
    });

    it('should handle rejected payment', async () => {
      const mockPayment = {
        _id: 'p-1', amount: 100, paymentMethod: PaymentMethod.PIX, workOrderId: 'wo-1',
        status: PaymentStatus.PENDING,
        save: jest.fn().mockImplementation(function () { return Promise.resolve(this); }),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPayment as any);
      mockMercadoPagoService.createPayment.mockResolvedValue({ id: 'mp-1', status: 'rejected', status_detail: 'insufficient_funds' });

      const result = await service.processPayment('p-1');
      expect(result.status).toBe(PaymentStatus.REJECTED);
      expect(mockMessagingService.publish).toHaveBeenCalledWith('payment.rejected', expect.any(Object));
    });

    it('should handle payment error with saga compensation', async () => {
      const mockPayment = {
        _id: 'p-1', amount: 100, paymentMethod: PaymentMethod.PIX, workOrderId: 'wo-1',
        status: PaymentStatus.PENDING, metadata: {},
        save: jest.fn().mockImplementation(function () { return Promise.resolve(this); }),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPayment as any);
      mockMercadoPagoService.createPayment.mockRejectedValue(new Error('MP Error'));

      await expect(service.processPayment('p-1')).rejects.toThrow('MP Error');
      expect(mockMessagingService.publish).toHaveBeenCalledWith('payment.failed', expect.any(Object));
    });
  });

  describe('findOne', () => {
    it('should find payment', async () => {
      (mockPaymentModel as any).findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
      expect((await service.findOne('1'))._id).toBe('1');
    });
    it('should throw NotFoundException', async () => {
      (mockPaymentModel as any).findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all payments', async () => {
      (mockPaymentModel as any).find.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: '1' }]) });
      expect(await service.findAll()).toHaveLength(1);
    });
  });

  describe('findByWorkOrder', () => {
    it('should find by work order', async () => {
      (mockPaymentModel as any).find.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: '1' }]) });
      expect(await service.findByWorkOrder('wo-1')).toHaveLength(1);
    });
  });

  describe('verifyPayment', () => {
    it('should verify and approve payment', async () => {
      const mockPayment = {
        _id: 'p-1', mercadoPagoId: 'mp-1', workOrderId: 'wo-1', status: PaymentStatus.PENDING,
        save: jest.fn().mockImplementation(function () { return Promise.resolve(this); }),
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPayment as any);
      mockMercadoPagoService.getPaymentStatus.mockResolvedValue({ status: 'approved' });

      const result = await service.verifyPayment('p-1');
      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(mockMessagingService.publish).toHaveBeenCalledWith('payment.approved', expect.any(Object));
    });

    it('should return payment if no mercadoPagoId', async () => {
      const mockPayment = { _id: 'p-1', status: PaymentStatus.PENDING };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPayment as any);
      const result = await service.verifyPayment('p-1');
      expect(result.status).toBe(PaymentStatus.PENDING);
    });
  });
});
