import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BOLETO = 'BOLETO',
}

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ required: true })
  quoteId: string;

  @Prop({ required: true })
  workOrderId: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop()
  mercadoPagoId: string;

  @Prop()
  mercadoPagoStatus: string;

  @Prop({ type: Object })
  mercadoPagoResponse: any;

  @Prop()
  approvedAt: Date;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
