import { Model, Document, FilterQuery, UpdateQuery, Types } from 'mongoose';
import { FindOptions } from '../models/types.js';

export class BaseRepository<T extends Document> { 
    protected readonly model: Model<T>;
    constructor(gameType: Model<T>) {
        this.model = gameType
    }

    async create(data: Partial<T>): Promise<T> {
        try {
        const document = new this.model(data);
        return await document.save();
        } catch (error) {
        throw new Error(`Error creating document: ${(error as Error).message}, at baseRepostory.ts:14`);
        }
    }
    
    async findById(id: string | Types.ObjectId): Promise<T | null> {
        try {
        return await this.model.findById(id).lean<T>();
        } catch (error) {
        throw new Error(`Error finding document by ID: ${(error as Error).message} \n  at baseRepostory.ts:22`);
        }
    }

    async findOne(query: FilterQuery<T>): Promise<T | null> {
        try {
        return await this.model.findOne(query).lean<T>();
        } catch (error) {
        throw new Error(`Error finding document: ${(error as Error).message}, \n  at baseRepostory.ts:30`);
        }
    }

    async find(query: FilterQuery<T> = {}, options: FindOptions = {}): Promise<T[]> {
        try {
            const { sort, limit, skip, select,
                // populate
            } = options;
        let queryBuilder = this.model.find(query);
        if (sort) queryBuilder = queryBuilder.sort(sort);
        if (limit) queryBuilder = queryBuilder.limit(limit);
        if (skip) queryBuilder = queryBuilder.skip(skip);
        if (select) queryBuilder = queryBuilder.select(select);
        // if (populate) queryBuilder = queryBuilder.populate(populate);

        return await queryBuilder.lean<T[]>();
        } catch (error) {
        throw new Error(`Error finding documents: ${(error as Error).message},\n  at baseRepostory.ts:48`);
        }
    }

    async update(query: FilterQuery<T>, updateData: UpdateQuery<T>): Promise<T | null> {
        try {
        return await this.model.findOneAndUpdate(
            query,
            updateData,
            { new: true, runValidators: true }
        ).lean<T>();
        } catch (error) {
        throw new Error(`Error updating document: ${(error as Error).message},\n  at baseRepostory.ts:60`);
        }
    }

    async updateById(id: string | Types.ObjectId, updateData: UpdateQuery<T>): Promise<T | null> {
        try {
        return await this.model.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).lean<T>();
        } catch (error) {
        throw new Error(`Error updating document by ID: ${(error as Error).message},\n  at baseRepostory.ts:72`);
        }
    }

    async delete(query: FilterQuery<T>): Promise<{ deletedCount?: number }> {
        try {
        return await this.model.deleteOne(query);
        } catch (error) {
        throw new Error(`Error deleting document: ${(error as Error).message},\n  at baseRepostory.ts:80`);
        }
    }

    async deleteById(id: string | Types.ObjectId): Promise<T | null> {
        try {
        return await this.model.findByIdAndDelete(id);
        } catch (error) {
        throw new Error(`Error deleting document by ID: ${(error as Error).message},\n  at baseRepostory.ts:88`);
        }
    }

    async count(query: FilterQuery<T> = {}): Promise<number> {
        try {
        return await this.model.countDocuments(query);
        } catch (error) {
        throw new Error(`Error counting documents: ${(error as Error).message},\n  at baseRepostory.ts:96`);
        }
    }

    async exists(query: FilterQuery<T>): Promise<boolean> {
        try {
        const result = await this.model.exists(query);
        return result !== null;
        } catch (error) {
        throw new Error(`Error checking existence: ${(error as Error).message},\n  at baseRepostory.ts:105`);
        }
    }

}