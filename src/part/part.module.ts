import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Part, PartSchema } from './schemas/part.schema';
import { PartService } from './part.service';
import { PartController } from './part.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Part.name, schema: PartSchema }])],
  controllers: [PartController],
  providers: [PartService],
  exports: [PartService],
})
export class PartModule {}
