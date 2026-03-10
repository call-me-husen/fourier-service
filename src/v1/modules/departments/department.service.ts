import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../../shared/services/base.service';
import { Department } from '../../../shared/entities/department.entity';
import {
  CacheService,
  CACHE_KEYS,
} from '../../../common/services/cache.service';

type DepartmentResponse = Omit<Department, 'parentId'> & {
  parent: string | null;
};

type DepartmentMutationInput = Partial<Department> & {
  parent?: string | null;
};

@Injectable()
export class DepartmentService extends BaseService<Department> {
  private readonly CACHE_TTL = 60;

  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    private cacheService: CacheService,
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
  ): Promise<DepartmentResponse | null> {
    const nextData = await this.buildMutationData(data);
    const result = await this.create(nextData);
    await this.cacheService.delByPrefix(CACHE_KEYS.DEPARTMENTS);
    return this.findOneWithParentName(result.id);
  }

  async updateWithCache(
    id: string,
    data: DepartmentMutationInput,
  ): Promise<DepartmentResponse | null> {
    const nextData = await this.buildMutationData(data, id);
    await this.update(id, nextData);
    await this.cacheService.delByPrefix(CACHE_KEYS.DEPARTMENTS);
    await this.cacheService.del(`${CACHE_KEYS.DEPARTMENT}:${id}`);
    return this.findOneWithParentName(id);
  }

  async deleteWithCache(id: string): Promise<void> {
    await this.delete(id);
    await this.cacheService.delByPrefix(CACHE_KEYS.DEPARTMENTS);
    await this.cacheService.del(`${CACHE_KEYS.DEPARTMENT}:${id}`);
  }
}
