import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET - Ambil semua kelas
export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM kelas ORDER BY nama_kelas ASC');
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Fetch Kelas Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST - Tambah kelas baru
export async function POST(request) {
  try {
    const { nama_kelas } = await request.json();
    
    if (!nama_kelas || nama_kelas.trim() === '') {
      return NextResponse.json({ error: 'Nama kelas wajib diisi' }, { status: 400 });
    }

    await db.query('INSERT INTO kelas (nama_kelas) VALUES (?)', [nama_kelas.trim()]);
    return NextResponse.json({ message: 'Kelas berhasil ditambahkan' }, { status: 201 });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Nama kelas sudah ada' }, { status: 409 });
    }
    console.error('Create Kelas Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE - Hapus kelas
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID kelas wajib' }, { status: 400 });
    }
    await db.query('DELETE FROM kelas WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('Delete Kelas Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
