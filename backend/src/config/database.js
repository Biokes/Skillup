const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chain-skill-games';

    try {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      this.connection = mongoose.connection;

      console.log('✓ Connected to MongoDB');
      console.log(`  Database: ${mongoose.connection.name}`);

      this.setupEventHandlers();
    } catch (error) {
      console.error('✗ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  setupEventHandlers() {
    this.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    this.connection.on('error', (error) => {
      console.error('MongoDB error:', error);
    });

    this.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed');
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new Database();
