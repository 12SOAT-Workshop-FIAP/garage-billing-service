import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum QuoteStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true })
export class Quote extends Document {
  @Prop({ required: true })
  workOrderId: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({
    type: [
      {
        name: String,
        description: String,
        quantity: Number,
        unitPrice: Number,
      },
    ],
  })
  items: {
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ type: String, enum: QuoteStatus, default: QuoteStatus.PENDING })
  status: QuoteStatus;

  @Prop()
  validUntil: Date;

  @Prop()
  approvedAt: Date;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
