import { NextResponse } from 'next/server';
import db from '@/lib/db';

// POST - Ubah password sendiri
export async function POST(request) {
  try {
    const { nomor_induk, oldPassword, newPassword } = await request.json();

    if (!nomor_induk || !oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    // Verify old password
    const [rows] = await db.query(
      'SELECT id FROM users WHERE nomor_induk = ? AND password = ?',
      [nomor_induk, oldPassword]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Password lama tidak sesuai' }, { status: 401 });
    }

    // Update password
    await db.query(
      'UPDATE users SET password = ? WHERE nomor_induk = ?',
      [newPassword, nomor_induk]
    );

    return NextResponse.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Change Password Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
