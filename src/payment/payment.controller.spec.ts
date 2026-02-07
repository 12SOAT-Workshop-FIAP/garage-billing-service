import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  const mockService = {
    create: jest.fn(),
    processPayment: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByWorkOrder: jest.fn(),
    verifyPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: PaymentService, useValue: mockService }],
    }).compile();
    controller = module.get<PaymentController>(PaymentController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a payment', async () => {
    mockService.create.mockResolvedValue({ _id: '1' });
    expect((await controller.create({ quoteId: 'q-1', workOrderId: 'wo-1', customerId: 'c-1', amount: 100, paymentMethod: 'PIX' } as any))._id).toBe('1');
  });

  it('should process a payment', async () => {
    mockService.processPayment.mockResolvedValue({ _id: '1', status: 'APPROVED' });
    expect((await controller.processPayment('1')).status).toBe('APPROVED');
  });

  it('should list all payments', async () => {
    mockService.findAll.mockResolvedValue([{ _id: '1' }]);
    expect(await controller.findAll()).toHaveLength(1);
  });

  it('should find payment by id', async () => {
    mockService.findOne.mockResolvedValue({ _id: '1' });
    expect((await controller.findOne('1'))._id).toBe('1');
  });

  it('should find payments by work order', async () => {
    mockService.findByWorkOrder.mockResolvedValue([{ _id: '1' }]);
    expect(await controller.findByWorkOrder('wo-1')).toHaveLength(1);
  });

  it('should verify payment', async () => {
    mockService.verifyPayment.mockResolvedValue({ _id: '1', status: 'APPROVED' });
    expect((await controller.verifyPayment('1')).status).toBe('APPROVED');
  });
});
