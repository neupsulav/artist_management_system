-- Database Architecture for Artist Management System

-- Drop tables if they exist for clean setup
DROP TABLE IF EXISTS music;
DROP TABLE IF EXISTS artist;
DROP TABLE IF EXISTS "user";

-- 1. User Table
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(500) NOT NULL,
    phone VARCHAR(20),
    dob DATE,
    gender CHAR(1) CHECK (gender IN ('m', 'f', 'o')),
    address VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'artist_manager', 'artist')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Artist Table
CREATE TABLE artist (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dob DATE,
    gender CHAR(1) CHECK (gender IN ('m', 'f', 'o')),
    address VARCHAR(255),
    first_release_year INT,
    no_of_albums_released INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Music Table
CREATE TABLE music (
    id SERIAL PRIMARY KEY,
    artist_id INT NOT NULL REFERENCES artist(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    album_name VARCHAR(255),
    genre VARCHAR(20) CHECK (genre IN ('rnb', 'country', 'classic', 'rock', 'jazz')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
