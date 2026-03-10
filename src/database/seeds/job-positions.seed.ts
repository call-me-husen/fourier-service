import { JobPosition } from '../../shared/entities/job-position.entity';
import { AppDataSource } from '../data-source';

export async function seedJobPositions() {
  const repo = AppDataSource.getRepository(JobPosition);

  const positions = [
    { name: 'Staff' },
    { name: 'Senior Staff' },
    { name: 'Lead' },
    { name: 'Manager' },
    { name: 'Director' },
    { name: 'VP' },
    { name: 'C-Level' },
  ];

  for (const p of positions) {
    const exists = await repo.findOne({
      where: { name: p.name },
    });

    if (!exists) {
      await repo.save(p);
    }
  }

  console.log('✔ job positions seeded');
}
