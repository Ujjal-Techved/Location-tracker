-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(150) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Laptops table
CREATE TABLE IF NOT EXISTS laptops (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(255),
    username VARCHAR(255),
    os VARCHAR(100),
    status VARCHAR(255),
    created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Locations table (separate, since one laptop can have multiple locations)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    laptop_id INT NOT NULL REFERENCES laptops(id) ON DELETE CASCADE,
    ip VARCHAR(64),
    city VARCHAR(128),
    region VARCHAR(128),
    country VARCHAR(128),
    isp VARCHAR(128),
    os VARCHAR(128),
    cpu_percent REAL,
    memory_percent REAL,
    disk_percent REAL,
    battery VARCHAR(128),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    tracked_at TIMESTAMP DEFAULT NOW()
);