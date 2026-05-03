import { NextResponse } from 'next/server';
import db from '@/lib/db';

const DEFAULT_SISWA = '123456';
const DEFAULT_GURU = 'netura123';

// POST - Reset password ke default
export async function POST(request) {
  try {
    const { targetId, targetRole, resetBy } = await request.json();

    if (!targetId || !targetRole || !resetBy) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Guru hanya boleh reset siswa
    if (resetBy === 'guru' && targetRole !== 'siswa') {
      return NextResponse.json({ error: 'Wali Kelas hanya dapat mereset password siswa' }, { status: 403 });
    }

    // Admin boleh reset guru (dan siswa)
    if (resetBy === 'admin' && !['siswa', 'guru'].includes(targetRole)) {
      return NextResponse.json({ error: 'Target role tidak valid' }, { status: 400 });
    }

    const defaultPwd = targetRole === 'siswa' ? DEFAULT_SISWA : DEFAULT_GURU;

    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE id = ? AND role = ?',
      [defaultPwd, targetId, targetRole]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: `Password berhasil direset ke default (${defaultPwd})` 
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
