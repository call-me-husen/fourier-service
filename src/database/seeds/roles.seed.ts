import { Role } from '../../shared/entities/role.entity';
import { AppDataSource } from '../data-source';

export async function seedRoles() {
  const repo = AppDataSource.getRepository(Role);

  const roles = [{ name: 'ADMIN' }, { name: 'EMPLOYEE' }];

  for (const role of roles) {
    const exists = await repo.findOne({
      where: { name: role.name },
    });

    if (!exists) {
      await repo.save(role);
    }
  }

  console.log('✔ roles seeded');
}
