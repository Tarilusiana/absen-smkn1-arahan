import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const { username, password, role, deviceId } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Role mapping
    let query, params;
    if (role === 'siswa') {
      query = `SELECT id, nomor_induk, nama, role, kelas, device_id FROM users WHERE nomor_induk = ? AND password = ? AND role = 'siswa' LIMIT 1`;
      params = [username, password];
    } else {
      query = `SELECT id, nomor_induk, nama, role, kelas, device_id FROM users WHERE nomor_induk = ? AND password = ? AND (role = 'guru' OR role = 'admin') LIMIT 1`;
      params = [username, password];
    }

    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'NISN/NIP atau Password salah' }, { status: 401 });
    }

    const user = rows[0];

    // === DEVICE LOCK: Hanya berlaku untuk siswa ===
    if (user.role === 'siswa' && deviceId) {
      if (user.device_id === null) {
        // Belum ada device terdaftar — daftarkan sekarang
        await db.query('UPDATE users SET device_id = ? WHERE id = ?', [deviceId, user.id]);
      } else if (user.device_id !== deviceId) {
        // Device berbeda — tolak login
        return NextResponse.json({
          error: 'Akun ini sudah terdaftar di perangkat lain. Hubungi Admin atau Wali Kelas untuk reset perangkat.'
        }, { status: 403 });
      }
    }

    return NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        nomor_induk: user.nomor_induk,
        nama: user.nama,
        role: user.role,
        kelas: user.kelas
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}
