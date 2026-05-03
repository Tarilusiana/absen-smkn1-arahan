import { NextResponse } from 'next/server';
import db from '@/lib/db';
import {
  SCHOOL_LAT, SCHOOL_LNG, RADIUS_METER,
  JAM_MASUK_MULAI, JAM_MASUK_NORMAL, JAM_MASUK_AKHIR,
  JAM_PULANG_MULAI, JAM_PULANG_AKHIR
} from '@/config/geofence';

const SCHOOL_COORDS = { lat: SCHOOL_LAT, lng: SCHOOL_LNG };

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Konversi jam (misal 7.5 = 07:30) ke format "HH:MM"
function jamToStr(jam) {
  const h = Math.floor(jam);
  const m = Math.round((jam - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function POST(request) {
  try {
    const { nisn, type, lat, lng } = await request.json();

    if (!nisn || !type || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    if (type !== 'masuk' && type !== 'pulang') {
      return NextResponse.json({ error: 'Tipe absen tidak valid' }, { status: 400 });
    }

    // === BACKEND GEOFENCE VALIDATION ===
    const distance = getDistance(SCHOOL_COORDS.lat, SCHOOL_COORDS.lng, lat, lng);
    if (distance > RADIUS_METER) {
      return NextResponse.json({
        error: `Anda berada di luar radius (${Math.round(distance)}m). Maksimal ${RADIUS_METER}m dari titik sekolah.`
      }, { status: 403 });
    }

    // === VALIDASI JAM ABSENSI ===
    const now = new Date();
    // Gunakan waktu lokal Indonesia (WIB = UTC+7)
    const jamSekarang = now.getHours() + now.getMinutes() / 60;

    let status_kehadiran;

    if (type === 'masuk') {
      if (jamSekarang < JAM_MASUK_MULAI) {
        return NextResponse.json({
          error: `Absen masuk belum dibuka. Mulai pukul ${jamToStr(JAM_MASUK_MULAI)} WIB.`
        }, { status: 403 });
      }
      if (jamSekarang > JAM_MASUK_AKHIR) {
        return NextResponse.json({
          error: `Waktu absen masuk telah berakhir pada pukul ${jamToStr(JAM_MASUK_AKHIR)} WIB.`
        }, { status: 403 });
      }
      // Tepat waktu jika sebelum JAM_MASUK_NORMAL, terlambat jika sesudahnya
      status_kehadiran = jamSekarang <= JAM_MASUK_NORMAL ? 'tepat_waktu' : 'terlambat';
    } else {
      // type === 'pulang'
      if (jamSekarang < JAM_PULANG_MULAI) {
        return NextResponse.json({
          error: `Absen pulang belum dibuka. Mulai pukul ${jamToStr(JAM_PULANG_MULAI)} WIB.`
        }, { status: 403 });
      }
      if (jamSekarang > JAM_PULANG_AKHIR) {
        return NextResponse.json({
          error: `Waktu absen pulang telah berakhir pada pukul ${jamToStr(JAM_PULANG_AKHIR)} WIB.`
        }, { status: 403 });
      }
      status_kehadiran = 'tepat_waktu';
    }

    // === INSERT KE DATABASE ===
    const query = `
      INSERT INTO log_absensi (
        nisn, waktu_absen, tipe_absen, status_kehadiran,
        is_manual, lokasi_tercatat_lat, lokasi_tercatat_long
      ) VALUES (?, NOW(), ?, ?, FALSE, ?, ?)
    `;

    const [result] = await db.query(query, [nisn, type, status_kehadiran, lat, lng]);

    return NextResponse.json({
      message: `Berhasil absen ${type}`,
      data: {
        id: result.insertId,
        status: status_kehadiran,
        waktu: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Absen Siswa Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}
