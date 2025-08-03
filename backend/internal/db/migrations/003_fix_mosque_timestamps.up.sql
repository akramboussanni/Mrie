-- Fix any existing NULL timestamps in mosques table
UPDATE mosques SET created_at = 1733097600, updated_at = 1733097600 WHERE created_at IS NULL OR updated_at IS NULL; 