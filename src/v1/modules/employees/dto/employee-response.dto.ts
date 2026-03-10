import { ApiProperty } from '@nestjs/swagger';
import { Contact } from '../../../../shared/entities/contact.entity';
import { Department } from '../../../../shared/entities/department.entity';
import { Employee } from '../../../../shared/entities/employee.entity';
import { JobPosition } from '../../../../shared/entities/job-position.entity';
import { Role } from '../../../../shared/entities/role.entity';

class RoleSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  static fromEntity(role: Role | null | undefined): RoleSummaryDto | null {
    if (!role) {
      return null;
    }

    return {
      id: role.id,
      name: role.name,
    };
  }
}

class DepartmentSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  parentId: string | null;

  static fromEntity(
    department: Department | null | undefined,
  ): DepartmentSummaryDto | null {
    if (!department) {
      return null;
    }

    return {
      id: department.id,
      name: department.name,
      description: department.description ?? null,
      parentId: department.parentId ?? null,
    };
  }
}

class JobPositionSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  static fromEntity(
    jobPosition: JobPosition | null | undefined,
  ): JobPositionSummaryDto | null {
    if (!jobPosition) {
      return null;
    }

    return {
      id: jobPosition.id,
      name: jobPosition.name,
      description: jobPosition.description ?? null,
    };
  }
}

class ContactResponseDto {
  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty({ nullable: true })
  address: string | null;

  @ApiProperty({ nullable: true })
  emergencyContact: string | null;

  @ApiProperty({ nullable: true })
  emergencyPhone: string | null;

  static fromEntity(
    contact: Contact | null | undefined,
  ): ContactResponseDto | null {
    if (!contact) {
      return null;
    }

    return {
      phone: contact.phone ?? null,
      address: contact.address ?? null,
      emergencyContact: contact.emergencyContact ?? null,
      emergencyPhone: contact.emergencyPhone ?? null,
    };
  }
}

export class EmployeeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeCode: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty({ nullable: true })
  lastName: string | null;

  @ApiProperty({ nullable: true })
  photo: string | null;

  @ApiProperty({ nullable: true })
  dateOfBirth: Date | null;

  @ApiProperty({ nullable: true })
  surename: string | null;

  @ApiProperty({ type: () => RoleSummaryDto, nullable: true })
  role: RoleSummaryDto | null;

  @ApiProperty({ type: () => DepartmentSummaryDto, nullable: true })
  department: DepartmentSummaryDto | null;

  @ApiProperty({ type: () => JobPositionSummaryDto, nullable: true })
  jobPosition: JobPositionSummaryDto | null;

  @ApiProperty({ type: () => ContactResponseDto, nullable: true })
  contact: ContactResponseDto | null;

  static fromEntity(
    employee: Employee | null | undefined,
  ): EmployeeResponseDto | null {
    if (!employee) {
      return null;
    }

    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName ?? null,
      photo: employee.photo ?? null,
      dateOfBirth: employee.dateOfBirth ?? null,
      surename: employee.surename ?? null,
      role: RoleSummaryDto.fromEntity(employee.role),
      department: DepartmentSummaryDto.fromEntity(employee.department),
      jobPosition: JobPositionSummaryDto.fromEntity(employee.jobPosition),
      contact: ContactResponseDto.fromEntity(employee.contact),
    };
  }

  static fromEntities(employees: Employee[]): EmployeeResponseDto[] {
    return employees.map(
      (employee) => EmployeeResponseDto.fromEntity(employee)!,
    );
  }
}
