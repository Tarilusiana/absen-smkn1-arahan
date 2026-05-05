// ============================================================
//  KONFIGURASI GEOFENCE - SMKN 1 ARAHAN
//  Edit file ini untuk mengubah lokasi, radius, dan jam absensi
// ============================================================

// --- LOKASI ---
// Koordinat titik pusat sekolah (latitude, longitude)
// Cara mendapatkan: buka Google Maps → klik kanan lokasi sekolah → salin angka
export const SCHOOL_LAT = -6.357994305092576;
export const SCHOOL_LNG = 108.27082969095186;

// Radius maksimal absensi dalam meter
export const RADIUS_METER = 100;

// Nama sekolah (untuk tampilan)
export const SCHOOL_NAME = 'SMKN 1 Arahan';

// --- JAM ABSENSI ---
// Format jam dalam 24 jam (angka desimal). Contoh: 7.5 = 07:30, 14.5 = 14:30

// Absen MASUK
export const JAM_MASUK_MULAI  = 6.0;   // 06:00 → mulai bisa absen masuk
export const JAM_MASUK_NORMAL = 7.5;   // 07:30 → batas tepat waktu
export const JAM_MASUK_AKHIR  = 9.0;   // 09:00 → batas terlambat (setelah ini tidak bisa absen masuk)

// Absen PULANG
export const JAM_PULANG_MULAI = 14.5;  // 14:30 → mulai bisa absen pulang
export const JAM_PULANG_AKHIR = 17.0;  // 17:00 → batas akhir absen pulang
