import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ServiceCatalog extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: true })
  active: boolean;

  @Prop({ required: true })
  duration: number;
}

export const ServiceCatalogSchema = SchemaFactory.createForClass(ServiceCatalog);
