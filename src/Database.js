/**
 * Database connection and operations for Hurdle
 * Handles MySQL database interactions for game statistics and user data
 */

let mysql2;
let connection = null;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

if (!isBrowser) {
  try {
    mysql2 = require('mysql2/promise');
  } catch (error) {
    console.warn('MySQL2 not available in this environment');
  }
}

class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection
   */
  async connect() {
    if (isBrowser || !mysql2) {
      console.log('Database operations not available in browser environment');
      return false;
    }

    try {
      // Load environment variables from .env files if available
      if (typeof require !== 'undefined') {
        try {
          require('dotenv').config({ path: '.env.local' });
        } catch (e) {
          // dotenv not available, continue with process.env
        }
      }

      const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'hurdle_user',
        password: process.env.DB_PASSWORD || 'hurdle_password',
        database: process.env.DB_NAME || 'hurdle',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000
      };

      console.log(`Connecting to MySQL at ${config.host}:${config.port}/${config.database}`);
      
      this.connection = await mysql2.createConnection(config);
      this.isConnected = true;
      
      // Test the connection
      await this.connection.execute('SELECT 1');
      
      // Initialize database schema
      await this.initializeSchema();
      
      console.log('Database connected and initialized successfully');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Initialize database schema
   */
  async initializeSchema() {
    if (!this.connection) return;

    try {
      // Create games table for storing game results
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS games (
          id INT AUTO_INCREMENT PRIMARY KEY,
          target_word VARCHAR(5) NOT NULL,
          guesses JSON,
          attempts_used INT NOT NULL,
          won BOOLEAN NOT NULL,
          duration_seconds INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_created_at (created_at),
          INDEX idx_won (won),
          INDEX idx_target_word (target_word)
        )
      `);

      // Create statistics table for aggregated stats
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS statistics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          total_games INT DEFAULT 0,
          games_won INT DEFAULT 0,
          current_streak INT DEFAULT 0,
          max_streak INT DEFAULT 0,
          guess_distribution JSON,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Initialize statistics if empty
      const [rows] = await this.connection.execute('SELECT COUNT(*) as count FROM statistics');
      if (rows[0].count === 0) {
        await this.connection.execute(`
          INSERT INTO statistics (guess_distribution) 
          VALUES ('{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0}')
        `);
      }

      console.log('Database schema initialized');
    } catch (error) {
      console.error('Schema initialization failed:', error.message);
    }
  }

  /**
   * Save a completed game
   */
  async saveGame(gameData) {
    if (!this.connection || isBrowser) return null;

    try {
      const { targetWord, guesses, attemptsUsed, won, durationSeconds } = gameData;
      
      const [result] = await this.connection.execute(`
        INSERT INTO games (target_word, guesses, attempts_used, won, duration_seconds)
        VALUES (?, ?, ?, ?, ?)
      `, [
        targetWord,
        JSON.stringify(guesses),
        attemptsUsed,
        won,
        durationSeconds || null
      ]);

      // Update statistics
      await this.updateStatistics(won, attemptsUsed);

      return result.insertId;
    } catch (error) {
      console.error('Failed to save game:', error.message);
      return null;
    }
  }

  /**
   * Update game statistics
   */
  async updateStatistics(won, attemptsUsed) {
    if (!this.connection || isBrowser) return;

    try {
      // Get current statistics
      const [rows] = await this.connection.execute('SELECT * FROM statistics ORDER BY id DESC LIMIT 1');
      const stats = rows[0];

      const totalGames = stats.total_games + 1;
      const gamesWon = stats.games_won + (won ? 1 : 0);
      const currentStreak = won ? stats.current_streak + 1 : 0;
      const maxStreak = Math.max(stats.max_streak, currentStreak);

      // Update guess distribution
      const guessDistribution = JSON.parse(stats.guess_distribution);
      if (won && attemptsUsed <= 6) {
        guessDistribution[attemptsUsed.toString()] = (guessDistribution[attemptsUsed.toString()] || 0) + 1;
      }

      await this.connection.execute(`
        UPDATE statistics 
        SET total_games = ?, games_won = ?, current_streak = ?, max_streak = ?, guess_distribution = ?
        WHERE id = ?
      `, [
        totalGames,
        gamesWon,
        currentStreak,
        maxStreak,
        JSON.stringify(guessDistribution),
        stats.id
      ]);

    } catch (error) {
      console.error('Failed to update statistics:', error.message);
    }
  }

  /**
   * Get game statistics
   */
  async getStatistics() {
    if (!this.connection || isBrowser) {
      // Return default stats for browser environment
      return {
        totalGames: 0,
        gamesWon: 0,
        winPercentage: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 }
      };
    }

    try {
      const [rows] = await this.connection.execute('SELECT * FROM statistics ORDER BY id DESC LIMIT 1');
      const stats = rows[0];

      return {
        totalGames: stats.total_games,
        gamesWon: stats.games_won,
        winPercentage: stats.total_games > 0 ? Math.round((stats.games_won / stats.total_games) * 100) : 0,
        currentStreak: stats.current_streak,
        maxStreak: stats.max_streak,
        guessDistribution: JSON.parse(stats.guess_distribution)
      };
    } catch (error) {
      console.error('Failed to get statistics:', error.message);
      return null;
    }
  }

  /**
   * Get recent games
   */
  async getRecentGames(limit = 10) {
    if (!this.connection || isBrowser) return [];

    try {
      const [rows] = await this.connection.execute(`
        SELECT target_word, attempts_used, won, created_at
        FROM games 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [limit]);

      return rows;
    } catch (error) {
      console.error('Failed to get recent games:', error.message);
      return [];
    }
  }

  /**
   * Close database connection
   */
  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      this.isConnected = false;
      console.log('Database disconnected');
    }
  }
}

// Export for both CommonJS and ES modules
const database = new Database();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = database;
} else if (typeof window !== 'undefined') {
  window.Database = database;
}