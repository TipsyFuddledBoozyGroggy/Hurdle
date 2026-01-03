-- Hurdle Database Initialization Script
-- This script sets up the initial database schema

USE hurdle;

-- Create games table for storing game results
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
);

-- Create statistics table for aggregated stats
CREATE TABLE IF NOT EXISTS statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_games INT DEFAULT 0,
    games_won INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    max_streak INT DEFAULT 0,
    guess_distribution JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Initialize statistics with default values
INSERT INTO statistics (guess_distribution) 
VALUES ('{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0}')
ON DUPLICATE KEY UPDATE id = id;

-- Create words table for storing valid words (optional optimization)
CREATE TABLE IF NOT EXISTS words (
    id INT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(5) NOT NULL UNIQUE,
    is_common BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_word (word),
    INDEX idx_common (is_common)
);

-- Create user sessions table (for future multi-user support)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_last_activity (last_activity)
);