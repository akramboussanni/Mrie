CREATE TABLE IF NOT EXISTS mosques (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    timezone VARCHAR(255),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- Insert default mosques with timestamps
INSERT INTO mosques (id, name, country, city, timezone, created_at, updated_at) VALUES
('mosquee-de-paris', 'Grande Mosquée de Paris', 'France', 'Paris', 'Europe/Paris', 1733097600, 1733097600),
('grande-mosquee-de-lyon', 'Grande Mosquée de Lyon', 'France', 'Lyon', 'Europe/Paris', 1733097600, 1733097600),
('mosquee-al-salam', 'Mosquée Al-Salam', 'France', 'Paris', 'Europe/Paris', 1733097600, 1733097600),
('masjid-al-noor', 'Masjid Al-Noor', 'France', 'Paris', 'Europe/Paris', 1733097600, 1733097600),
('masjid-al-rahma', 'Masjid Al-Rahma', 'France', 'Lyon', 'Europe/Paris', 1733097600, 1733097600); 