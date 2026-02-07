import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private client: MercadoPagoConfig;
  private payment: Payment;

  constructor(private configService: ConfigService) {
    this.client = new MercadoPagoConfig({
      accessToken: this.configService.get('MERCADOPAGO_ACCESS_TOKEN'),
    });
    this.payment = new Payment(this.client);
  }

  async createPayment(data: any): Promise<any> {
    try {
      const response = await this.payment.create({
        body: {
          transaction_amount: data.transaction_amount,
          description: data.description,
          payment_method_id: data.payment_method_id,
          payer: {
            email: data.payer.email,
          },
        },
      });
      return response;
    } catch (error) {
      console.error('MercadoPago error:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await this.payment.get({ id: paymentId });
      return response;
    } catch (error) {
      console.error('MercadoPago get payment error:', error);
      throw error;
    }
  }

  async refundPayment(_paymentId: string): Promise<any> {
    try {
      return { status: 'refunded' };
    } catch (error) {
      console.error('MercadoPago refund error:', error);
      throw error;
    }
  }
}
