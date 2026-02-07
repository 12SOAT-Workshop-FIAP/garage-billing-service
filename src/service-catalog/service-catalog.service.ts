import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceCatalog } from './schemas/service-catalog.schema';
import { CreateServiceCatalogDto } from './dto/create-service-catalog.dto';

@Injectable()
export class ServiceCatalogService {
  constructor(@InjectModel(ServiceCatalog.name) private serviceModel: Model<ServiceCatalog>) {}

  async create(createDto: CreateServiceCatalogDto): Promise<ServiceCatalog> {
    const service = new this.serviceModel(createDto);
    return service.save();
  }

  async findAll(): Promise<ServiceCatalog[]> {
    return this.serviceModel.find().exec();
  }

  async findOne(id: string): Promise<ServiceCatalog> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    return service;
  }

  async update(id: string, updateDto: Partial<CreateServiceCatalogDto>): Promise<ServiceCatalog> {
    const service = await this.serviceModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    return service;
  }

  async remove(id: string): Promise<void> {
    const result = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Service ${id} not found`);
  }
}
