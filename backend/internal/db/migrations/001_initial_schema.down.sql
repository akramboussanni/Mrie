-- Down migration to reverse the initial schema
-- This will drop all tables and indexes created in the up migration

-- Drop app settings table and its index
DROP INDEX IF EXISTS idx_app_settings_key;
DROP TABLE IF EXISTS app_settings;

-- Drop lockouts table and its indexes
DROP INDEX IF EXISTS idx_lockouts_locked_until;
DROP INDEX IF EXISTS idx_lockouts_ip;
DROP INDEX IF EXISTS idx_lockouts_user;
DROP TABLE IF EXISTS lockouts;

-- Drop failed_logins table and its indexes
DROP INDEX IF EXISTS idx_failed_logins_attempted_at;
DROP INDEX IF EXISTS idx_failed_logins_ip;
DROP INDEX IF EXISTS idx_failed_logins_user;
DROP TABLE IF EXISTS failed_logins;

-- Drop JWT blacklist table
DROP TABLE IF EXISTS jwt_blacklist;

-- Drop users table
DROP TABLE IF EXISTS users; 