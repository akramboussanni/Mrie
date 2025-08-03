-- Initial schema migration - combines all previous migrations
-- This migration creates the complete database schema in one go

-- Create users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    user_role TEXT NOT NULL,
    email_confirmed BOOLEAN NOT NULL DEFAULT false,
    email_confirm_token VARCHAR(64) NOT NULL DEFAULT '',
    email_confirm_issuedat BIGINT NOT NULL DEFAULT 0,
    password_reset_token VARCHAR(64) NOT NULL DEFAULT '',
    password_reset_issuedat BIGINT NOT NULL DEFAULT 0,
    jwt_session_id BIGINT
);

-- Create JWT blacklist table
CREATE TABLE jwt_blacklist (
    jti VARCHAR(255) PRIMARY KEY,
    user_id BIGINT,
    expires_at BIGINT NOT NULL
);

-- Create failed logins table
CREATE TABLE failed_logins (
    id BIGINT PRIMARY KEY,
    user_id INT NULL,
    ip_address VARCHAR(45) NOT NULL,
    attempted_at BIGINT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes for failed_logins table
CREATE INDEX idx_failed_logins_user ON failed_logins(user_id);
CREATE INDEX idx_failed_logins_ip ON failed_logins(ip_address);
CREATE INDEX idx_failed_logins_attempted_at ON failed_logins(attempted_at);

-- Create lockouts table
CREATE TABLE lockouts (
    id BIGINT PRIMARY KEY,
    user_id INT NULL,
    ip_address VARCHAR(45) NULL,
    locked_until BIGINT NOT NULL,
    reason VARCHAR(255) NULL,
    active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes for lockouts table
CREATE INDEX idx_lockouts_user ON lockouts(user_id);
CREATE INDEX idx_lockouts_ip ON lockouts(ip_address);
CREATE INDEX idx_lockouts_locked_until ON lockouts(locked_until);

-- Create app settings table
CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on setting_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);

-- Insert some default settings
INSERT INTO app_settings (setting_key, setting_value) VALUES 
    ('default_masjid', '')
ON CONFLICT (setting_key) DO NOTHING; 