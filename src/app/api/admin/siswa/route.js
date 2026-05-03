import { NextResponse } from 'next/server';
import db from '@/lib/db';

const DEFAULT_PASSWORD = '123456';

// GET - Ambil semua siswa
export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT id, nomor_induk, nama, kelas, created_at FROM users WHERE role = 'siswa' ORDER BY kelas ASC, nama ASC"
    );
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Fetch Siswa Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST - Tambah siswa (manual / bulk)
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Bulk CSV Upload
    if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      const csvText = await request.text();
      const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // Skip header if present
      let startIdx = 0;
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('nisn') || firstLine.includes('nama') || firstLine.includes('no')) {
        startIdx = 1;
      }

      let inserted = 0;
      let skipped = 0;
      const errors = [];

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        // Expected format: NISN, Nama, Kelas
        if (cols.length < 3) {
          errors.push(`Baris ${i + 1}: Format tidak valid (butuh 3 kolom: NISN, Nama, Kelas)`);
          skipped++;
          continue;
        }

        const [nisn, nama, kelas] = cols;
        if (!nisn || !nama || !kelas) {
          errors.push(`Baris ${i + 1}: Data tidak lengkap`);
          skipped++;
          continue;
        }

        try {
          await db.query(
            'INSERT INTO users (nomor_induk, nama, password, role, kelas) VALUES (?, ?, ?, ?, ?)',
            [nisn, nama, DEFAULT_PASSWORD, 'siswa', kelas]
          );
          inserted++;
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            errors.push(`Baris ${i + 1}: NISN ${nisn} sudah terdaftar`);
            skipped++;
          } else {
            errors.push(`Baris ${i + 1}: Error database`);
            skipped++;
          }
        }
      }

      return NextResponse.json({
        message: `Berhasil import ${inserted} siswa, ${skipped} dilewati.`,
        inserted,
        skipped,
        errors
      }, { status: 201 });
    }

    // Manual Single Insert (JSON)
    const { nisn, nama, kelas } = await request.json();

    if (!nisn || !nama || !kelas) {
      return NextResponse.json({ error: 'NISN, Nama, dan Kelas wajib diisi' }, { status: 400 });
    }

    await db.query(
      'INSERT INTO users (nomor_induk, nama, password, role, kelas) VALUES (?, ?, ?, ?, ?)',
      [nisn.trim(), nama.trim(), DEFAULT_PASSWORD, 'siswa', kelas.trim()]
    );

    return NextResponse.json({ message: `Siswa ${nama} berhasil ditambahkan dengan password default: ${DEFAULT_PASSWORD}` }, { status: 201 });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'NISN sudah terdaftar di sistem' }, { status: 409 });
    }
    console.error('Create Siswa Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE - Hapus siswa
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID siswa wajib' }, { status: 400 });
    }
    await db.query('DELETE FROM users WHERE id = ? AND role = ?', [id, 'siswa']);
    return NextResponse.json({ message: 'Siswa berhasil dihapus' });
  } catch (error) {
    console.error('Delete Siswa Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
