import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET - Ambil semua siswa beserta status device
export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT id, nomor_induk, nama, kelas, device_id FROM users WHERE role = 'siswa' ORDER BY kelas ASC, nama ASC"
    );
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Fetch Device Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE - Reset device_id siswa
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID siswa wajib' }, { status: 400 });
    }

    const [result] = await db.query(
      "UPDATE users SET device_id = NULL WHERE id = ? AND role = 'siswa'",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Perangkat berhasil direset. Siswa dapat login dari perangkat baru.' });
  } catch (error) {
    console.error('Reset Device Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
