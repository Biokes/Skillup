
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw new Error(`Error creating document: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await this.model.findById(id).lean();
    } catch (error) {
      throw new Error(`Error finding document by ID: ${error.message}`);
    }
  }

  async findOne(query) {
    try {
      return await this.model.findOne(query).lean();
    } catch (error) {
      throw new Error(`Error finding document: ${error.message}`);
    }
  }

  async find(query = {}, options = {}) {
    try {
      const { sort, limit, skip, select } = options;
      let queryBuilder = this.model.find(query);

      if (sort) queryBuilder = queryBuilder.sort(sort);
      if (limit) queryBuilder = queryBuilder.limit(limit);
      if (skip) queryBuilder = queryBuilder.skip(skip);
      if (select) queryBuilder = queryBuilder.select(select);

      return await queryBuilder.lean();
    } catch (error) {
      throw new Error(`Error finding documents: ${error.message}`);
    }
  }

  async update(query, updateData) {
    try {
      return await this.model.findOneAndUpdate(
        query,
        updateData,
        { new: true, runValidators: true }
      ).lean();
    } catch (error) {
      throw new Error(`Error updating document: ${error.message}`);
    }
  }

  async updateById(id, updateData) {
    try {
      return await this.model.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).lean();
    } catch (error) {
      throw new Error(`Error updating document by ID: ${error.message}`);
    }
  }

  async delete(query) {
    try {
      return await this.model.deleteOne(query);
    } catch (error) {
      throw new Error(`Error deleting document: ${error.message}`);
    }
  }

  async deleteById(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error deleting document by ID: ${error.message}`);
    }
  }

  async count(query = {}) {
    try {
      return await this.model.countDocuments(query);
    } catch (error) {
      throw new Error(`Error counting documents: ${error.message}`);
    }
  }

  async exists(query) {
    try {
      return await this.model.exists(query);
    } catch (error) {
      throw new Error(`Error checking existence: ${error.message}`);
    }
  }
}

module.exports = BaseRepository;
