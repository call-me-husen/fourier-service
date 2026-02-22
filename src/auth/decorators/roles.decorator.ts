import { SetMetadata } from '@nestjs/common';
import { AccountRole } from '../../database/entities/employee.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AccountRole[]) => SetMetadata(ROLES_KEY, roles);
