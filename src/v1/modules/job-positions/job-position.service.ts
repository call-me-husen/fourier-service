import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../../shared/services/base.service';
import { JobPosition } from '../../../shared/entities/job-position.entity';
import {
  CacheService,
  CACHE_KEYS,
} from '../../../common/services/cache.service';

@Injectable()
export class JobPositionService extends BaseService<JobPosition> {
  private readonly CACHE_TTL = 60;

  constructor(
    @InjectRepository(JobPosition)
    private jobPositionRepository: Repository<JobPosition>,
    private cacheService: CacheService,
  ) {
    super(jobPositionRepository);
  }

  async findAllWithCache(): Promise<JobPosition[]> {
    return this.cacheService.wrap(
      CACHE_KEYS.JOB_POSITIONS,
      () => this.findAll(),
      this.CACHE_TTL,
    );
  }

  async findOneWithCache(id: string): Promise<JobPosition | null> {
    const cacheKey = `${CACHE_KEYS.JOB_POSITION}:${id}`;
    return this.cacheService.wrap(
      cacheKey,
      () => this.findOne({ where: { id } }),
      this.CACHE_TTL,
    );
  }

  async createWithCache(data: Partial<JobPosition>): Promise<JobPosition> {
    const result = await this.create(data);
    await this.cacheService.delByPrefix(CACHE_KEYS.JOB_POSITIONS);
    return result;
  }

  async updateWithCache(
    id: string,
    data: Partial<JobPosition>,
  ): Promise<JobPosition> {
    const result = await this.update(id, data);
    await this.cacheService.delByPrefix(CACHE_KEYS.JOB_POSITIONS);
    await this.cacheService.del(`${CACHE_KEYS.JOB_POSITION}:${id}`);
    return result;
  }

  async deleteWithCache(id: string): Promise<void> {
    await this.delete(id);
    await this.cacheService.delByPrefix(CACHE_KEYS.JOB_POSITIONS);
    await this.cacheService.del(`${CACHE_KEYS.JOB_POSITION}:${id}`);
  }
}
