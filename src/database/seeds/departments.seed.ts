import { Department } from '../../shared/entities/department.entity';
import { AppDataSource } from '../data-source';

type DepartmentType = {
  name: string;
  subDepartments?: DepartmentType[];
};

export async function seedDepartments() {
  const repo = AppDataSource.getRepository(Department);

  const departments: Array<DepartmentType> = [
    {
      name: 'Human Resources',
      subDepartments: [{ name: 'Recruitment' }, { name: 'Employee Relations' }],
    },
    {
      name: 'Technology',
      subDepartments: [
        { name: 'Data' },
        { name: 'Product' },
        { name: 'Engineering' },
        { name: 'IT Support' },
      ],
    },
    {
      name: 'Marketing',
      subDepartments: [
        { name: 'Digital Marketing' },
        { name: 'Content & Branding' },
      ],
    },
    {
      name: 'Finance',
      subDepartments: [
        { name: 'Accounting' },
        { name: 'Financial Planning & Analysis' },
        { name: 'Payroll' },
      ],
    },
  ];

  for (const d of departments) {
    const exists = await repo.findOne({
      where: { name: d.name },
    });

    if (!exists) {
      const parent = await repo.save({ name: d.name });

      if (d.subDepartments) {
        for (const sub of d.subDepartments) {
          const subExists = await repo.findOne({
            where: { name: sub.name },
          });

          if (!subExists) {
            await repo.save({ name: sub.name, parentId: parent.id });
          }
        }
      }
    }
  }

  console.log('✔ departments seeded');
}
