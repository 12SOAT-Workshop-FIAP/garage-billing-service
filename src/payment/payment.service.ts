import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentStatus } from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MercadoPagoService } from './mercado-pago.service';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private mercadoPagoService: MercadoPagoService,
    private messagingService: MessagingService,
  ) {}

  async create(createDto: CreatePaymentDto): Promise<Payment> {
    const payment = new this.paymentModel(createDto);
    const saved = await payment.save();

    await this.messagingService.publish('payment.created', {
      paymentId: saved._id.toString(),
      quoteId: saved.quoteId,
      workOrderId: saved.workOrderId,
      amount: saved.amount,
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  async processPayment(id: string): Promise<Payment> {
    const payment = await this.findOne(id);

    payment.status = PaymentStatus.PROCESSING;
    await payment.save();

    try {
      const mpResponse = await this.mercadoPagoService.createPayment({
        transaction_amount: payment.amount,
        description: `Pagamento OS ${payment.workOrderId}`,
        payment_method_id: this.mapPaymentMethod(payment.paymentMethod),
        payer: {
          email: 'customer@example.com', // Deve vir do customer
        },
      });

      payment.mercadoPagoId = mpResponse.id;
      payment.mercadoPagoStatus = mpResponse.status;
      payment.mercadoPagoResponse = mpResponse;

      if (mpResponse.status === 'approved') {
        payment.status = PaymentStatus.APPROVED;
        payment.approvedAt = new Date();

        await this.messagingService.publish('payment.approved', {
          paymentId: payment._id.toString(),
          workOrderId: payment.workOrderId,
          quoteId: payment.quoteId,
          amount: payment.amount,
          timestamp: new Date().toISOString(),
        });
      } else if (mpResponse.status === 'rejected') {
        payment.status = PaymentStatus.REJECTED;

        await this.messagingService.publish('payment.rejected', {
          paymentId: payment._id.toString(),
          workOrderId: payment.workOrderId,
          reason: mpResponse.status_detail,
          timestamp: new Date().toISOString(),
        });
      }

      return await payment.save();
    } catch (error) {
      payment.status = PaymentStatus.REJECTED;
      payment.metadata = { ...payment.metadata, error: error.message };
      await payment.save();

      await this.messagingService.publish('payment.failed', {
        paymentId: payment._id.toString(),
        workOrderId: payment.workOrderId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentModel.findById(id).exec();
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return payment;
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentModel.find().exec();
  }

  async findByWorkOrder(workOrderId: string): Promise<Payment[]> {
    return this.paymentModel.find({ workOrderId }).exec();
  }

  async verifyPayment(id: string): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.mercadoPagoId) {
      const mpStatus = await this.mercadoPagoService.getPaymentStatus(payment.mercadoPagoId);
      payment.mercadoPagoStatus = mpStatus.status;

      if (mpStatus.status === 'approved' && payment.status !== PaymentStatus.APPROVED) {
        payment.status = PaymentStatus.APPROVED;
        payment.approvedAt = new Date();

        await this.messagingService.publish('payment.approved', {
          paymentId: payment._id.toString(),
          workOrderId: payment.workOrderId,
          timestamp: new Date().toISOString(),
        });
      }

      return await payment.save();
    }

    return payment;
  }

  private mapPaymentMethod(method: string): string {
    const mapping = {
      PIX: 'pix',
      CREDIT_CARD: 'credit_card',
      DEBIT_CARD: 'debit_card',
      BOLETO: 'boleto',
    };
    return mapping[method] || 'pix';
  }
}
