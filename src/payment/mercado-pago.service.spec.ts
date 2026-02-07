import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoService } from './mercado-pago.service';

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MercadoPagoService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MercadoPagoService>(MercadoPagoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    it('should have createPayment method', () => {
      expect(typeof service.createPayment).toBe('function');
    });
  });

  describe('getPaymentStatus', () => {
    it('should have getPaymentStatus method', () => {
      expect(typeof service.getPaymentStatus).toBe('function');
    });
  });

  describe('refundPayment', () => {
    it('should have refundPayment method', () => {
      expect(typeof service.refundPayment).toBe('function');
    });
  });
});
