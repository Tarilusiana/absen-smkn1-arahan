import { NextResponse } from 'next/server';
import db from '@/lib/db';

const DEFAULT_PASSWORD = 'netura123';

// GET - Ambil semua guru/wali kelas
export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT id, nomor_induk, nama, kelas, created_at FROM users WHERE role = 'guru' ORDER BY nama ASC"
    );
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Fetch Guru Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST - Tambah guru (manual / bulk)
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
      if (firstLine.includes('nip') || firstLine.includes('nama') || firstLine.includes('no')) {
        startIdx = 1;
      }

      let inserted = 0;
      let skipped = 0;
      const errors = [];

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        // Expected format: NIP, Nama, Kelas Wali
        if (cols.length < 3) {
          errors.push(`Baris ${i + 1}: Format tidak valid (butuh 3 kolom: NIP, Nama, Kelas Wali)`);
          skipped++;
          continue;
        }

        const [nip, nama, kelas] = cols;
        if (!nip || !nama || !kelas) {
          errors.push(`Baris ${i + 1}: Data tidak lengkap`);
          skipped++;
          continue;
        }

        try {
          await db.query(
            'INSERT INTO users (nomor_induk, nama, password, role, kelas) VALUES (?, ?, ?, ?, ?)',
            [nip, nama, DEFAULT_PASSWORD, 'guru', kelas]
          );
          inserted++;
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            errors.push(`Baris ${i + 1}: NIP ${nip} sudah terdaftar`);
            skipped++;
          } else {
            errors.push(`Baris ${i + 1}: Error database`);
            skipped++;
          }
        }
      }

      return NextResponse.json({
        message: `Berhasil import ${inserted} guru, ${skipped} dilewati.`,
        inserted,
        skipped,
        errors
      }, { status: 201 });
    }

    // Manual Single Insert (JSON)
    const { nip, nama, kelas } = await request.json();

    if (!nip || !nama || !kelas) {
      return NextResponse.json({ error: 'NIP, Nama, dan Kelas Wali wajib diisi' }, { status: 400 });
    }

    await db.query(
      'INSERT INTO users (nomor_induk, nama, password, role, kelas) VALUES (?, ?, ?, ?, ?)',
      [nip.trim(), nama.trim(), DEFAULT_PASSWORD, 'guru', kelas.trim()]
    );

    return NextResponse.json({ message: `Guru ${nama} berhasil ditambahkan dengan password default: ${DEFAULT_PASSWORD}` }, { status: 201 });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'NIP sudah terdaftar di sistem' }, { status: 409 });
    }
    console.error('Create Guru Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE - Hapus guru
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID guru wajib' }, { status: 400 });
    }
    await db.query('DELETE FROM users WHERE id = ? AND role = ?', [id, 'guru']);
    return NextResponse.json({ message: 'Data guru berhasil dihapus' });
  } catch (error) {
    console.error('Delete Guru Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
