import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Part } from './schemas/part.schema';
import { CreatePartDto } from './dto/create-part.dto';

@Injectable()
export class PartService {
  constructor(@InjectModel(Part.name) private partModel: Model<Part>) {}

  async create(createDto: CreatePartDto): Promise<Part> {
    const existing = await this.partModel.findOne({ partNumber: createDto.partNumber }).exec();
    if (existing) {
      throw new ConflictException('Part with this part number already exists');
    }
    const part = new this.partModel(createDto);
    return part.save();
  }

  async findAll(): Promise<Part[]> {
    return this.partModel.find().exec();
  }

  async findOne(id: string): Promise<Part> {
    const part = await this.partModel.findById(id).exec();
    if (!part) throw new NotFoundException(`Part ${id} not found`);
    return part;
  }

  async findByPartNumber(partNumber: string): Promise<Part> {
    const part = await this.partModel.findOne({ partNumber }).exec();
    if (!part) throw new NotFoundException(`Part ${partNumber} not found`);
    return part;
  }

  async findLowStock(): Promise<Part[]> {
    return this.partModel.find({ $expr: { $lte: ['$stockQuantity', '$minStockLevel'] } }).exec();
  }

  async update(id: string, updateDto: Partial<CreatePartDto>): Promise<Part> {
    const part = await this.partModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!part) throw new NotFoundException(`Part ${id} not found`);
    return part;
  }

  async updateStock(id: string, quantity: number): Promise<Part> {
    const part = await this.findOne(id);
    part.stockQuantity = quantity;
    return part.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.partModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Part ${id} not found`);
  }
}
