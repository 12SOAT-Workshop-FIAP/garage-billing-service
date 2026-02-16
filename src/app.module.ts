import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { QuoteModule } from './quote/quote.module';
import { PaymentModule } from './payment/payment.module';
import { PartModule } from './part/part.module';
import { ServiceCatalogModule } from './service-catalog/service-catalog.module';
import { MessagingModule } from './messaging/messaging.module';
import { HealthController } from './health/health.controller';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Quote, QuoteSchema } from './quote/schemas/quote.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing_service'),
    MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }]),
    QuoteModule,
    PaymentModule,
    PartModule,
    ServiceCatalogModule,
    MessagingModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
