import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../../shared/services/base.service';
import { Employee } from '../../../shared/entities/employee.entity';
import { Department } from '../../../shared/entities/department.entity';
import {
  CacheService,
  CACHE_KEYS,
} from '../../../common/services/cache.service';
import {
  AuditActor,
  AuditPublisherService,
} from '../../../common/services/audit-publisher.service';

type DepartmentResponse = Omit<Department, 'parentId'> & {
  parent: string | null;
};

type DepartmentMutationInput = Partial<Department> & {
  parent?: string | null;
};

@Injectable()
export class DepartmentService extends BaseService<Department> {
  private readonly CACHE_TTL = 60;

  private toAuditActor(actor?: Employee): AuditActor | undefined {
    if (!actor) return undefined;
    return { id: actor.id, email: actor.email, role: actor.role?.name ?? null };
  }

  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    private cacheService: CacheService,
    private auditPublisherService: AuditPublisherService,
  ) {
    super(departmentRepository);
  }

  private async resolveParentId(
    parent?: string | null,
  ): Promise<string | null> {
    if (parent === undefined) {
      return null;
    }

    if (parent === null || parent.trim() === '') {
      return null;
    }

    const parentDepartment = await this.departmentRepository.findOne({
      where: { name: parent },
    });

    if (!parentDepartment) {
      throw new NotFoundException(`Parent department '${parent}' not found`);
    }

    return parentDepartment.id;
  }

  private async buildMutationData(
    data: DepartmentMutationInput,
    currentDepartmentId?: string,
  ): Promise<Partial<Department>> {
    const { parent, ...rest } = data;
    const nextData: Partial<Department> = { ...rest };

    if (parent !== undefined) {
      const parentId = await this.resolveParentId(parent);

      if (parentId && parentId === currentDepartmentId) {
        throw new BadRequestException('Department cannot be its own parent');
      }

      nextData.parentId = parentId ?? null;
    }

    return nextData;
  }

  private async findAllWithParentName(): Promise<DepartmentResponse[]> {
    const departments = await this.departmentRepository
      .createQueryBuilder('department')
      .leftJoin(
        Department,
        'parent_department',
        'parent_department.id::text = department.parentId',
      )
      .select([
        'department.id AS id',
        'department.name AS name',
        'department.description AS description',
        'parent_department.name AS parent',
      ])
      .orderBy('department.createdAt', 'ASC')
      .getRawMany<DepartmentResponse>();

    return departments.map((department) => ({
      ...department,
      parent: department.parent ?? null,
    }));
  }

  private async findOneWithParentName(
    id: string,
  ): Promise<DepartmentResponse | null> {
    const department = await this.departmentRepository
      .createQueryBuilder('department')
      .leftJoin(
        Department,
        'parent_department',
        'parent_department.id::text = department.parentId',
      )
      .select([
        'department.id AS id',
        'department.name AS name',
        'department.description AS description',
        'parent_department.name AS parent',
      ])
      .where('department.id = :id', { id })
      .getRawOne<DepartmentResponse>();

    if (!department) {
      return null;
    }

    return {
      ...department,
      parent: department.parent ?? null,
    };
  }

  async findAllWithCache(): Promise<DepartmentResponse[]> {
    return this.cacheService.wrap(
      CACHE_KEYS.DEPARTMENTS,
      () => this.findAllWithParentName(),
      this.CACHE_TTL,
    );
  }

  async findOneWithCache(id: string): Promise<DepartmentResponse | null> {
    const cacheKey = `${CACHE_KEYS.DEPARTMENT}:${id}`;
    return this.cacheService.wrap(
      cacheKey,
      () => this.findOneWithParentName(id),
      this.CACHE_TTL,
    );
  }

  async createWithCache(
    data: DepartmentMutationInput,
    actor?: Employee,
  ): Promise<DepartmentResponse | null> {
    const nextData = await this.buildMutationData(data);
    const result = await this.create(nextData);
    await this.cacheService.delByPrefix(CACHE_KEYS.DEPARTMENTS);
    const department = await this.findOneWithParentName(result.id);
    await this.auditPublisherService.publishEntityChange(
      'department',
      'created',
      department,
      result.id,
      this.toAuditActor(actor),
    );
    return department;
  }

  async updateWithCache(
    id: string,
    data: DepartmentMutationInput,
    actor?: Employee,
  ): Promise<DepartmentResponse | null> {
    const nextData = await this.buildMutationData(data, id);
    await this.update(id, nextData);
    await this.cacheService.delByPrefix(CACHE_KEYS.DEPARTMENTS);
    await this.cacheService.del(`${CACHE_KEYS.DEPARTMENT}:${id}`);
    const department = await this.findOneWithParentName(id);
    await this.auditPublisherService.publishEntityChange(
      'department',
      'updated',
      department,
      id,
      this.toAuditActor(actor),
    );
    return department;
  }

  async deleteWithCache(id: string, actor?: Employee): Promise<void> {
    const existing = await this.findOneWithParentName(id);
    await this.delete(id);
    await this.cacheService.delByPrefix(CACHE_KEYS.DEPARTMENTS);
    await this.cacheService.del(`${CACHE_KEYS.DEPARTMENT}:${id}`);
    await this.auditPublisherService.publishEntityChange(
      'department',
      'deleted',
      existing,
      id,
      this.toAuditActor(actor),
    );
  }
}
