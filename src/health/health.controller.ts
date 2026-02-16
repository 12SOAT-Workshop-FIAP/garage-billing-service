import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/jwt-auth.guard';
import { MessagingService } from '../messaging/messaging.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quote } from '../quote/schemas/quote.schema';
import { Response } from 'express';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private messagingService: MessagingService,
    @InjectModel(Quote.name) private quoteModel: Model<Quote>,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check' })
  async check(@Res() res: Response) {
    const rabbitmqOk = this.messagingService.getConnectionStatus();

    let databaseOk = false;
    try {
      await this.quoteModel.db.db.admin().ping();
      databaseOk = true;
    } catch {}

    const allOk = rabbitmqOk && databaseOk;
    const status = allOk ? 'ok' : 'degraded';
    const httpStatus = allOk ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(httpStatus).json({
      status,
      service: 'billing-service',
      timestamp: new Date().toISOString(),
      dependencies: {
        rabbitmq: rabbitmqOk ? 'connected' : 'disconnected',
        database: databaseOk ? 'connected' : 'disconnected',
      },
    });
  }
}
