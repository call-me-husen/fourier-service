import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from '../../../shared/entities/contact.entity';
import { Employee } from '../../../shared/entities/employee.entity';
import { Repository } from 'typeorm';
import { BaseService } from '../../../shared/services/base.service';
import { EmployeeQueryDto } from './dto/query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { NotificationGateway } from '../../../common/gateways/notification.gateway';
import {
  CacheService,
  CACHE_KEYS,
} from '../../../common/services/cache.service';

@Injectable()
export class EmployeeService extends BaseService<Employee> {
  private readonly CACHE_TTL = 60;

  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    private notificationGateway: NotificationGateway,
    private cacheService: CacheService,
  ) {
    super(employeeRepository);
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return this.findOne({ where: { email } });
  }

  async findAllWithSearch(query: EmployeeQueryDto): Promise<Employee[]> {
    const cacheKey = `${CACHE_KEYS.EMPLOYEES}:${JSON.stringify(query)}`;

    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const qb = this.employeeRepository
          .createQueryBuilder('employee')
          .leftJoinAndSelect('employee.role', 'role')
          .leftJoinAndSelect('employee.department', 'department')
          .leftJoinAndSelect('employee.jobPosition', 'jobPosition');

        if (query.name) {
          qb.andWhere(
            '(employee.firstName ILIKE :name OR employee.lastName ILIKE :name)',
            { name: `%${query.name}%` },
          );
        }
        if (query.email) {
          qb.andWhere('employee.email ILIKE :email', {
            email: `%${query.email}%`,
          });
        }
        if (query.employeeCode) {
          qb.andWhere('employee.employeeCode ILIKE :code', {
            code: `%${query.employeeCode}%`,
          });
        }

        return qb.getMany();
      },
      this.CACHE_TTL,
    );
  }

  async findOneWithCache(id: string): Promise<Employee | null> {
    const cacheKey = `${CACHE_KEYS.EMPLOYEE}:${id}`;

    return this.cacheService.wrap(
      cacheKey,
      async () => {
        return this.findOne({
          where: { id },
          relations: ['role', 'department', 'jobPosition', 'contact'],
        });
      },
      this.CACHE_TTL,
    );
  }

  async updateWithNotification(
    id: string,
    data: Partial<Employee>,
  ): Promise<Employee> {
    const employee = await this.findById(id);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const changedFields: string[] = [];
    for (const key of Object.keys(data)) {
      if (key !== 'password' && data[key as keyof Employee] !== undefined) {
        const oldValue = employee[key as keyof Employee];
        const newValue = data[key as keyof Employee];
        if (oldValue !== newValue) {
          changedFields.push(key);
        }
      }
    }

    await this.update(id, data);

    // Invalidate cache on update
    await this.cacheService.del(`${CACHE_KEYS.EMPLOYEE}:${id}`);
    await this.cacheService.delByPrefix(CACHE_KEYS.EMPLOYEES);

    if (changedFields.length > 0) {
      const employeeName = `${employee.firstName} ${employee.lastName}`.trim();
      this.notificationGateway.notifyProfileUpdate(
        employee.id,
        employeeName,
        changedFields,
      );
    }

    const updated = await this.findOne({
      where: { id },
      relations: ['role', 'department', 'jobPosition', 'contact'],
    });

    if (!updated) {
      throw new Error('Employee not found after update');
    }

    return updated;
  }

  async updateProfileWithNotification(
    id: string,
    data: UpdateProfileDto,
  ): Promise<Employee> {
    const employee = await this.findOne({
      where: { id },
      relations: ['role', 'department', 'jobPosition', 'contact'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const changedFields: string[] = [];

    if (data.surename !== undefined && data.surename !== employee.surename) {
      changedFields.push('surename');
      await this.employeeRepository.update(id, { surename: data.surename });
    }

    const currentContact = employee.contact ?? null;
    const nextContact = {
      phone: data.phone,
      address: data.address,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
    };

    const hasContactPayload = Object.values(nextContact).some(
      (value) => value !== undefined,
    );

    if (hasContactPayload) {
      const contactPayload: Partial<Contact> = {
        phone: data.phone ?? currentContact?.phone ?? null,
        address: data.address ?? currentContact?.address ?? null,
        emergencyContact:
          data.emergencyContact ?? currentContact?.emergencyContact ?? null,
        emergencyPhone:
          data.emergencyPhone ?? currentContact?.emergencyPhone ?? null,
      };

      if (data.phone !== undefined && data.phone !== currentContact?.phone) {
        changedFields.push('phone');
      }
      if (
        data.address !== undefined &&
        data.address !== currentContact?.address
      ) {
        changedFields.push('address');
      }
      if (
        data.emergencyContact !== undefined &&
        data.emergencyContact !== currentContact?.emergencyContact
      ) {
        changedFields.push('emergencyContact');
      }
      if (
        data.emergencyPhone !== undefined &&
        data.emergencyPhone !== currentContact?.emergencyPhone
      ) {
        changedFields.push('emergencyPhone');
      }

      if (currentContact) {
        await this.contactRepository.update(currentContact.id, contactPayload);
      } else {
        const contact = this.contactRepository.create({
          ...contactPayload,
          employee: { id } as Employee,
        });
        await this.contactRepository.save(contact);
      }
    }

    await this.cacheService.del(`${CACHE_KEYS.EMPLOYEE}:${id}`);
    await this.cacheService.delByPrefix(CACHE_KEYS.EMPLOYEES);

    if (changedFields.length > 0) {
      const employeeName = `${employee.firstName} ${employee.lastName}`.trim();
      this.notificationGateway.notifyProfileUpdate(
        id,
        employeeName,
        changedFields,
      );
    }

    const updated = await this.findOne({
      where: { id },
      relations: ['role', 'department', 'jobPosition', 'contact'],
    });

    if (!updated) {
      throw new NotFoundException('Employee not found after update');
    }

    return updated;
  }
}
