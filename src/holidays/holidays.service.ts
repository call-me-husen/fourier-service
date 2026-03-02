import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Holiday } from '../database/entities';
import { Repository } from 'typeorm';
import { CreateHolidayDto } from './dto/create.dto';
import { BulkHolidayDto } from './dto/bulk.dto';
import { UpdateHolidayDto } from './dto/update.dto';

@Injectable()
export class HolidaysService {
  constructor(
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
  ) {}

  async findAll(from: string, to: string) {
    if (!from && !to) {
      throw new BadRequestException('Not enough query parameters');
    }

    // Validate date format
    if (from && isNaN(Date.parse(from))) {
      throw new BadRequestException('Invalid date format');
    }

    if (to && isNaN(Date.parse(to))) {
      throw new BadRequestException('Invalid date format');
    }

    const query = this.holidayRepository.createQueryBuilder('holiday');

    if (from) {
      query.andWhere('holiday.date >= :from', { from });
    }

    if (to) {
      query.andWhere('holiday.date <= :to', { to });
    }

    return await query.getMany();
  }

  async create(data: CreateHolidayDto) {
    const existingHoliday = await this.holidayRepository.findOne({
      where: { date: data.date },
    });

    if (existingHoliday) {
      throw new BadRequestException('Holiday with this date already exists');
    }

    const holiday = this.holidayRepository.create(data);
    return await this.holidayRepository.save(holiday);
  }

  async insertMany(data: BulkHolidayDto) {
    // Check if there is any existing holiday with the same date
    const existingHolidays = await this.holidayRepository.find({
      where: data.dates.map((date) => ({ date })),
    });

    if (existingHolidays.length > 0) {
      const existingDates = existingHolidays
        .map((holiday) => holiday.date.toISOString().split('T')[0])
        .join(', ');
      throw new BadRequestException(
        `Holidays with the following dates already exist: ${existingDates}`,
      );
    }

    const holidays = data.dates.map((date) =>
      this.holidayRepository.create({
        name: data.name,
        description: data.description,
        date,
      }),
    );

    return await this.holidayRepository.save(holidays);
  }

  async update(id: Date, data: UpdateHolidayDto) {
    const holiday = await this.holidayRepository.findOne({
      where: { date: id },
    });

    if (!holiday) {
      throw new BadRequestException('Holiday not found');
    }

    holiday.name = data.name;
    holiday.description = data.description || null;

    return await this.holidayRepository.save(holiday);
  }

  async delete(id: Date) {
    const holiday = await this.holidayRepository.findOne({
      where: { date: id },
    });

    if (!holiday) {
      throw new BadRequestException('Holiday not found');
    }

    await this.holidayRepository.remove(holiday);
    return { message: 'Holiday deleted successfully' };
  }
}
