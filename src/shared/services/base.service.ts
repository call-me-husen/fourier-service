import {
  DeepPartial,
  FindOneOptions,
  ObjectLiteral,
  Repository,
} from 'typeorm';

export class BaseService<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<T | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.repository.findOneBy({ id } as any);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const entity = await this.findById(id as any);
    if (!entity) {
      throw new Error('Entity not found');
    }
    await this.repository.update(id, data);
    return this.findById(id) as Promise<T>;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }
}
