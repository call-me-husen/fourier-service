import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../../shared/services/base.service';
import { Employee } from '../../../shared/entities/employee.entity';
import { JobPosition } from '../../../shared/entities/job-position.entity';
import {
  CacheService,
  CACHE_KEYS,
} from '../../../common/services/cache.service';
import {
  AuditActor,
  AuditPublisherService,
} from '../../../common/services/audit-publisher.service';

@Injectable()
export class JobPositionService extends BaseService<JobPosition> {
  private readonly CACHE_TTL = 60;

  private toAuditActor(actor?: Employee): AuditActor | undefined {
    if (!actor) return undefined;
    return { id: actor.id, email: actor.email, role: actor.role?.name ?? null };
  }

  constructor(
    @InjectRepository(JobPosition)
    private jobPositionRepository: Repository<JobPosition>,
    private cacheService: CacheService,
    private auditPublisherService: AuditPublisherService,
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

  async createWithCache(
    data: Partial<JobPosition>,
    actor?: Employee,
  ): Promise<JobPosition> {
    const result = await this.create(data);
    await this.cacheService.delByPrefix(CACHE_KEYS.JOB_POSITIONS);
    await this.auditPublisherService.publishEntityChange(
      'job-position',
      'created',
      result,
      result.id,
      this.toAuditActor(actor),
    );
    return result;
  }

  async updateWithCache(
    id: string,
    data: Partial<JobPosition>,
    actor?: Employee,
  ): Promise<JobPosition> {
    const result = await this.update(id, data);
    await this.cacheService.delByPrefix(CACHE_KEYS.JOB_POSITIONS);
    await this.cacheService.del(`${CACHE_KEYS.JOB_POSITION}:${id}`);
    await this.auditPublisherService.publishEntityChange(
      'job-position',
      'updated',
      result,
      result.id,
      this.toAuditActor(actor),
    );
    return result;
  }

  async deleteWithCache(id: string, actor?: Employee): Promise<void> {
    const existing = await this.findById(id);
    await this.delete(id);
    await this.cacheService.delByPrefix(CACHE_KEYS.JOB_POSITIONS);
    await this.cacheService.del(`${CACHE_KEYS.JOB_POSITION}:${id}`);
    await this.auditPublisherService.publishEntityChange(
      'job-position',
      'deleted',
      existing,
      id,
      this.toAuditActor(actor),
    );
  }
}
