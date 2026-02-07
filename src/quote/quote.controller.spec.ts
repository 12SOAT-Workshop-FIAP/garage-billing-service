import { Test, TestingModule } from '@nestjs/testing';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';

describe('QuoteController', () => {
  let controller: QuoteController;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByWorkOrder: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuoteController],
      providers: [{ provide: QuoteService, useValue: mockService }],
    }).compile();
    controller = module.get<QuoteController>(QuoteController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a quote', async () => {
    mockService.create.mockResolvedValue({ _id: '1', totalAmount: 100 });
    const result = await controller.create({ workOrderId: 'wo-1', customerId: 'c-1', items: [] } as any);
    expect(result._id).toBe('1');
  });

  it('should list all quotes', async () => {
    mockService.findAll.mockResolvedValue([{ _id: '1' }]);
    expect(await controller.findAll()).toHaveLength(1);
  });

  it('should find quote by id', async () => {
    mockService.findOne.mockResolvedValue({ _id: '1' });
    expect((await controller.findOne('1'))._id).toBe('1');
  });

  it('should find quotes by work order', async () => {
    mockService.findByWorkOrder.mockResolvedValue([{ _id: '1' }]);
    expect(await controller.findByWorkOrder('wo-1')).toHaveLength(1);
  });

  it('should approve a quote', async () => {
    mockService.approve.mockResolvedValue({ _id: '1', status: 'APPROVED' });
    expect((await controller.approve('1')).status).toBe('APPROVED');
  });

  it('should reject a quote', async () => {
    mockService.reject.mockResolvedValue({ _id: '1', status: 'REJECTED' });
    expect((await controller.reject('1')).status).toBe('REJECTED');
  });

  it('should send a quote', async () => {
    mockService.send.mockResolvedValue({ _id: '1', status: 'SENT' });
    expect((await controller.send('1')).status).toBe('SENT');
  });
});
