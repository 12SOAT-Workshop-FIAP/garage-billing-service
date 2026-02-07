import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quote, QuoteStatus } from './schemas/quote.schema';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class QuoteService {
  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<Quote>,
    private messagingService: MessagingService,
  ) {}

  async create(createDto: CreateQuoteDto): Promise<Quote> {
    const totalAmount = createDto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const validUntil = createDto.validUntil
      ? new Date(createDto.validUntil)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    const quote = new this.quoteModel({
      ...createDto,
      totalAmount,
      validUntil,
    });

    const saved = await quote.save();

    await this.messagingService.publish('quote.created', {
      quoteId: saved._id.toString(),
      workOrderId: saved.workOrderId,
      customerId: saved.customerId,
      totalAmount: saved.totalAmount,
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  async findAll(): Promise<Quote[]> {
    return this.quoteModel.find().exec();
  }

  async findOne(id: string): Promise<Quote> {
    const quote = await this.quoteModel.findById(id).exec();
    if (!quote) {
      throw new NotFoundException(`Quote ${id} not found`);
    }
    return quote;
  }

  async findByWorkOrder(workOrderId: string): Promise<Quote[]> {
    return this.quoteModel.find({ workOrderId }).exec();
  }

  async approve(id: string): Promise<Quote> {
    const quote = await this.findOne(id);

    if (new Date() > quote.validUntil) {
      quote.status = QuoteStatus.EXPIRED;
      await quote.save();
      throw new Error('Quote has expired');
    }

    quote.status = QuoteStatus.APPROVED;
    quote.approvedAt = new Date();
    const updated = await quote.save();

    await this.messagingService.publish('quote.approved', {
      quoteId: updated._id.toString(),
      workOrderId: updated.workOrderId,
      totalAmount: updated.totalAmount,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async reject(id: string): Promise<Quote> {
    const quote = await this.findOne(id);
    quote.status = QuoteStatus.REJECTED;
    const updated = await quote.save();

    await this.messagingService.publish('quote.rejected', {
      quoteId: updated._id.toString(),
      workOrderId: updated.workOrderId,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async send(id: string): Promise<Quote> {
    const quote = await this.findOne(id);
    quote.status = QuoteStatus.SENT;
    const updated = await quote.save();

    await this.messagingService.publish('quote.sent', {
      quoteId: updated._id.toString(),
      workOrderId: updated.workOrderId,
      customerId: updated.customerId,
      totalAmount: updated.totalAmount,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }
}
