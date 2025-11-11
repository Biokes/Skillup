import { Repository, DeepPartial, FindManyOptions, FindOneOptions } from "typeorm";
import { ChainSkillsException } from "../../exceptions/index.js";

export default abstract class BaseRepository<T> {
  protected readonly repository: Repository<T>;

  constructor(repo: Repository<T>) {
    this.repository = repo;
  }

  async create(data: DeepPartial<T>): Promise<T> {
    try {
      const entity = this.repository.create(data);
      return await this.repository.save(entity);
    } catch (error) {
      throw new ChainSkillsException(`Error creating entity: ${(error as Error).message}, at baseRepository.ts:create`);
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      return await this.repository.findOne({ where: { id } as any });
    } catch (error) {
      throw new ChainSkillsException( `Error finding entity by ID: ${(error as Error).message}, at baseRepository.ts:findById`);
    }
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    try {
      return await this.repository.findOne(options);
    } catch (error) {
      throw new ChainSkillsException(`Error finding one entity: ${(error as Error).message}, at baseRepository.ts:findOne`);
    }
  }

  async find(options: FindManyOptions<T> = {}): Promise<T[]> {
    try {
      return await this.repository.find(options);
    } catch (error) {
      throw new ChainSkillsException(`Error finding entities: ${(error as Error).message}, at baseRepository.ts:find`);
    }
  }

  abstract update(id: string, data: DeepPartial<T>): Promise<T | null>;

  async delete(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      throw new ChainSkillsException(`Error deleting entity: ${(error as Error).message}, at baseRepository.ts:delete`);
    }
  }

  async count(): Promise<number> {
    try {
      return await this.repository.count();
    } catch (error) {
      throw new ChainSkillsException( `Error counting entities: ${(error as Error).message}, at baseRepository.ts:count`);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const entity = await this.repository.findOne({ where: { id } as any });
      return !!entity;
    } catch (error) {
      throw new ChainSkillsException(`Error checking existence: ${(error as Error).message}, at baseRepository.ts:exists`);
    }
  }
}
