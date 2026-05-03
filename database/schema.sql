-- Skema Database: absen_geofence_db

CREATE DATABASE IF NOT EXISTS absen_geofence_db;
USE absen_geofence_db;

-- Tabel Kelas
CREATE TABLE IF NOT EXISTS kelas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_kelas VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Users (Siswa & Guru/Admin)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomor_induk VARCHAR(50) UNIQUE NOT NULL, -- NISN untuk siswa, NIP untuk guru
    nama VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('siswa', 'guru', 'admin') NOT NULL,
    kelas VARCHAR(50) DEFAULT NULL, -- Hanya untuk siswa atau wali kelas
    device_id VARCHAR(255) DEFAULT NULL, -- Untuk lock 1 device per siswa
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Log Absensi (Sesuai dengan PRD Revisi 2)
CREATE TABLE IF NOT EXISTS log_absensi (
    id_absen BIGINT AUTO_INCREMENT PRIMARY KEY,
    nisn VARCHAR(50) NOT NULL,
    waktu_absen DATETIME NOT NULL,
    tipe_absen ENUM('masuk', 'pulang') NOT NULL,
    status_kehadiran ENUM('tepat_waktu', 'terlambat') NOT NULL,
    is_manual BOOLEAN DEFAULT FALSE,
    input_by VARCHAR(100) DEFAULT NULL, -- Nama/NIP Wali Kelas jika is_manual = TRUE
    lokasi_tercatat_lat DECIMAL(10, 8) DEFAULT NULL,
    lokasi_tercatat_long DECIMAL(11, 8) DEFAULT NULL,
    FOREIGN KEY (nisn) REFERENCES users(nomor_induk) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Data Dummy Kelas
INSERT IGNORE INTO kelas (nama_kelas) VALUES
('X RPL 1'), ('X RPL 2'), ('XI RPL 1'), ('XI RPL 2'), ('XII RPL 1');

-- Akun Admin Default
INSERT IGNORE INTO users (nomor_induk, nama, password, role, kelas) VALUES
('admin', 'Administrator', 'admin123', 'admin', NULL);

-- Data Dummy untuk Testing
INSERT IGNORE INTO users (nomor_induk, nama, password, role, kelas) VALUES
('12345678', 'Andi Budi', '123456', 'siswa', 'XI RPL 1'),
('23456789', 'Siti Aminah', '123456', 'siswa', 'XI RPL 1'),
('198001012010011001', 'Bapak Sudirman, S.Kom', 'netura123', 'guru', 'XI RPL 1');
