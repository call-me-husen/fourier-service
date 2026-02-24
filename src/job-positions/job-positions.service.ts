import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateJobPositionDto } from './dto/create-job-position.dto';
import { UpdateJobPositionDto } from './dto/update-job-position.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { JobPosition } from '../database/entities';
import { Repository } from 'typeorm';

@Injectable()
export class JobPositionsService {
  constructor(
    @InjectRepository(JobPosition)
    private readonly jobPositionRepository: Repository<JobPosition>,
  ) {}

  async create(createJobPositionDto: CreateJobPositionDto) {
    const jobPosition = this.jobPositionRepository.create(createJobPositionDto);
    await this.jobPositionRepository.save(jobPosition);
    return jobPosition;
  }

  async queryAll(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 10, search } = query;

    const skip = (page - 1) * limit;

    const qb = this.jobPositionRepository.createQueryBuilder('jobPosition');

    if (search) {
      qb.where('jobPosition.name ILIKE :search', { search: `%${search}%` });
    }

    return await qb.skip(skip).take(limit).getManyAndCount();
  }

  async findOne(id: string) {
    const jobPosition = await this.jobPositionRepository.findOne({
      where: { id },
    });

    if (!jobPosition) {
      throw new NotFoundException();
    }

    return jobPosition;
  }

  async update(id: string, updateJobPositionDto: UpdateJobPositionDto) {
    const jobPosition = await this.jobPositionRepository.preload({
      id,
      ...updateJobPositionDto,
    });

    if (!jobPosition) {
      throw new NotFoundException();
    }

    return this.jobPositionRepository.save(jobPosition);
  }

  async remove(id: string) {
    const jobPosition = await this.jobPositionRepository.findOne({
      where: { id },
    });

    if (!jobPosition) {
      throw new NotFoundException();
    }

    // Don't delete the job position when it has employees
    if (jobPosition.employees && jobPosition.employees.length > 0) {
      throw new BadRequestException(
        'Cannot delete job position with assigned employees',
      );
    }

    await this.jobPositionRepository.remove(jobPosition);

    return { message: `Job position ${jobPosition.name} deleted successfully` };
  }
}
