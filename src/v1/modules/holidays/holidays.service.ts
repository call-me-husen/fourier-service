import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../../shared/services/base.service';
import { Employee } from '../../../shared/entities/employee.entity';
import { Holiday } from '../../../shared/entities/holiday.entity';
import {
  CacheService,
  CACHE_KEYS,
} from '../../../common/services/cache.service';
import {
  AuditActor,
  AuditPublisherService,
} from '../../../common/services/audit-publisher.service';

@Injectable()
export class HolidayService extends BaseService<Holiday> {
  private readonly CACHE_TTL = 60;

  private toAuditActor(actor?: Employee): AuditActor | undefined {
    if (!actor) return undefined;
    return { id: actor.id, email: actor.email, role: actor.role?.name ?? null };
  }

  constructor(
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
    private cacheService: CacheService,
    private auditPublisherService: AuditPublisherService,
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

  async createWithCache(
    data: Partial<Holiday>,
    actor?: Employee,
  ): Promise<Holiday> {
    const date = data.date;
    const existingHoliday = await this.findByDate(date!);
    if (existingHoliday) {
      throw new BadRequestException(
        `Holiday with date '${date}' already exists`,
      );
    }
    const result = await this.create(data);
    await this.cacheService.delByPrefix(CACHE_KEYS.HOLIDAYS);
    await this.auditPublisherService.publishEntityChange(
      'holiday',
      'created',
      result,
      result.id,
      this.toAuditActor(actor),
    );
    return result;
  }

  async deleteWithCache(id: string, actor?: Employee): Promise<void> {
    const existing = await this.findById(id);
    await this.delete(id);
    await this.cacheService.delByPrefix(CACHE_KEYS.HOLIDAYS);
    await this.auditPublisherService.publishEntityChange(
      'holiday',
      'deleted',
      existing,
      id,
      this.toAuditActor(actor),
    );
  }
}
