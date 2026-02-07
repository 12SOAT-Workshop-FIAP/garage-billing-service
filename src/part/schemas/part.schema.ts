import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum PartStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true })
export class Part extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, unique: true })
  partNumber: string;

  @Prop()
  category: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  costPrice: number;

  @Prop({ required: true, default: 0 })
  stockQuantity: number;

  @Prop({ default: 5 })
  minStockLevel: number;

  @Prop({ default: 'unit' })
  unit: string;

  @Prop()
  supplier: string;

  @Prop({ type: String, enum: PartStatus, default: PartStatus.ACTIVE })
  status: PartStatus;
}

export const PartSchema = SchemaFactory.createForClass(Part);
