import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import * as amqp from 'amqplib';
import { QuoteService } from '../quote/quote.service';
import { PaymentMethod } from '../payment/schemas/payment.schema';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class MessagingService implements OnModuleInit {
  private readonly logger = new Logger(MessagingService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private isConnected = false;

  constructor(
    @Inject(forwardRef(() => QuoteService))
    private quoteService: QuoteService,
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.setupEventListeners();
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  private async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
      this.channel = await this.connection.createChannel();
      this.isConnected = true;
      this.logger.log('Billing Service connected to RabbitMQ');

      this.connection.on('close', () => {
        this.isConnected = false;
        this.logger.warn('RabbitMQ connection closed. Reconnecting...');
        setTimeout(() => this.reconnect(), 5000);
      });

      this.connection.on('error', (err) => {
        this.isConnected = false;
        this.logger.error('RabbitMQ connection error:', err.message);
      });
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Failed to connect to RabbitMQ:', error.message);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async reconnect() {
    await this.connect();
    if (this.isConnected) {
      await this.setupEventListeners();
    }
  }

  async publish(routingKey: string, message: any): Promise<void> {
    if (!this.channel) {
      this.logger.error(`Cannot publish to "${routingKey}": RabbitMQ channel not available`);
      throw new Error(`RabbitMQ channel not available for publishing to "${routingKey}"`);
    }
    const exchange = 'garage-events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
  }

  async subscribe(queue: string, routingKey: string, handler: (msg: any) => void): Promise<void> {
    if (!this.channel) {
      this.logger.error(`Cannot subscribe to "${routingKey}": RabbitMQ channel not available`);
      return;
    }
    const exchange = 'garage-events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, routingKey);

    this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`Error processing message from ${routingKey}:`, error.message);
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  private async setupEventListeners() {
    // Quando uma OS é criada, gerar orçamento inicial com itens de avaliação
    await this.subscribe('billing-work-order-created', 'work-order.created', async (data) => {
      this.logger.log(`Work order created - generating initial quote: ${data.workOrderId}`);
      try {
        await this.quoteService.create({
          workOrderId: data.workOrderId,
          customerId: data.customerId,
          items: [
            {
              name: 'Avaliação/Diagnóstico',
              description: `Avaliação inicial: ${data.description || 'Verificação geral'}`,
              quantity: 1,
              unitPrice: data.estimatedCost || 0,
            },
          ],
        });
        this.logger.log(`Quote created for work order ${data.workOrderId}`);
      } catch (error) {
        this.logger.error(
          `Failed to create quote for work order ${data.workOrderId}:`,
          error.message,
        );
      }
    });

    // Compensação de saga: cancelar orçamentos e pagamentos pendentes
    await this.subscribe('billing-work-order-cancelled', 'work-order.cancelled', async (data) => {
      this.logger.log(`Work order cancelled - cancelling quotes/payments: ${data.workOrderId}`);
      try {
        const quotes = await this.quoteService.findByWorkOrder(data.workOrderId);
        for (const quote of quotes) {
          if (quote.status === 'PENDING' || quote.status === 'SENT') {
            await this.quoteService.reject(quote._id.toString());
            this.logger.log(
              `Rejected quote ${quote._id} for cancelled work order ${data.workOrderId}`,
            );
          }
        }

        const payments = await this.paymentService.findByWorkOrder(data.workOrderId);
        for (const payment of payments) {
          if (payment.status === 'PENDING' || payment.status === 'PROCESSING') {
            this.logger.log(`Cancelling payment ${payment._id} for work order ${data.workOrderId}`);
            await this.publish('payment.cancelled', {
              paymentId: payment._id.toString(),
              workOrderId: data.workOrderId,
              reason: 'Work order cancelled',
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed saga compensation for work order ${data.workOrderId}:`,
          error.message,
        );
      }
    });

    // Compensação de saga: processar reembolso quando execução falha
    await this.subscribe('billing-execution-failed', 'execution.failed', async (data) => {
      this.logger.log(`Execution failed - processing refund: ${data.workOrderId}`);
      try {
        const payments = await this.paymentService.findByWorkOrder(data.workOrderId);
        const approvedPayments = payments.filter((p) => p.status === 'APPROVED');

        for (const payment of approvedPayments) {
          this.logger.log(
            `Processing refund for payment ${payment._id}, work order ${data.workOrderId}`,
          );
          await this.publish('payment.refund-requested', {
            paymentId: payment._id.toString(),
            workOrderId: data.workOrderId,
            amount: payment.amount,
            reason: data.reason || 'Execution failed',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        this.logger.error(
          `Failed to process refund for work order ${data.workOrderId}:`,
          error.message,
        );
      }
    });

    // Aprovação da OS → Criar Pagamento
    await this.subscribe('billing-work-order-approved', 'work-order.approved', async (data) => {
      this.logger.log(`Work order approved - creating payment: ${data.workOrderId}`);
      try {
        // Encontrar o orçamento associado
        const quotes = await this.quoteService.findByWorkOrder(data.workOrderId);
        if (!quotes || quotes.length === 0) {
          this.logger.warn(`No quote found for work order ${data.workOrderId}`);
          return;
        }

        // Usar o orçamento mais recente
        const quote = quotes[quotes.length - 1];

        // Validar e aprovar o orçamento se necessário
        if (quote.status !== 'APPROVED') {
          await this.quoteService.approve(quote._id.toString());
        }

        // Criar o pagamento
        const payment = await this.paymentService.create({
          quoteId: quote._id.toString(),
          workOrderId: data.workOrderId,
          customerId: data.customerId,
          amount: quote.totalAmount,
          paymentMethod: PaymentMethod.PIX, // Default
        });

        this.logger.log(`Payment created ${payment._id} for work order ${data.workOrderId}`);
      } catch (error) {
        this.logger.error(
          `Failed to create payment for work order ${data.workOrderId}:`,
          error.message,
        );
      }
    });
  }
}
