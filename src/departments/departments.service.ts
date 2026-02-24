import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from '../database/entities';
import { Repository } from 'typeorm';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const department = this.departmentRepository.create(createDepartmentDto);
    await this.departmentRepository.save(department);
    return department;
  }

  async queryAll(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 10, search } = query;

    const skip = (page - 1) * limit;

    const qb = this.departmentRepository.createQueryBuilder('department');

    if (search) {
      qb.where('department.name ILIKE :search', { search: `%${search}%` });
    }

    return await qb.skip(skip).take(limit).getManyAndCount();
  }

  async findOne(id: string) {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException();
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException();
    }

    Object.assign(department, updateDepartmentDto);

    return await this.departmentRepository.save(department);
  }

  async remove(id: string) {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException();
    }

    // Don't delete the department if it has employees
    if (department.employees && department.employees.length > 0) {
      throw new BadRequestException(
        'Cannot delete department with assigned employees',
      );
    }

    await this.departmentRepository.remove(department);
    return { message: `Department ${department.name} removed successfully` };
  }
}
