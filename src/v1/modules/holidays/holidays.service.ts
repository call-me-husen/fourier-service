import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../../shared/services/base.service';
import { Holiday } from '../../../shared/entities/holiday.entity';
import {
  CacheService,
  CACHE_KEYS,
} from '../../../common/services/cache.service';

@Injectable()
export class HolidayService extends BaseService<Holiday> {
  private readonly CACHE_TTL = 60;

  constructor(
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
    private cacheService: CacheService,
  ) {
    super(holidayRepository);
  }

  async findAllWithCache(): Promise<Holiday[]> {
    return this.cacheService.wrap(
      CACHE_KEYS.HOLIDAYS,
      () => this.findAll(),
      this.CACHE_TTL,
    );
  }

  async findByDate(date: string) {
    return this.holidayRepository.findOne({ where: { date } });
  }

  async createWithCache(data: Partial<Holiday>): Promise<Holiday> {
    const date = data.date;
    const existingHoliday = await this.findByDate(date!);
    if (existingHoliday) {
      throw new BadRequestException(`Holiday with date '${date}' already exists`);
    }
    const result = await this.create(data);
    await this.cacheService.delByPrefix(CACHE_KEYS.HOLIDAYS);
    return result;
  }

  async deleteWithCache(id: string): Promise<void> {
    await this.delete(id);
    await this.cacheService.delByPrefix(CACHE_KEYS.HOLIDAYS);
  }
}
