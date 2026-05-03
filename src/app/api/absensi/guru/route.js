import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: Fetch recent attendance for the class overview
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const query = `
      SELECT l.id_absen, l.nisn, l.waktu_absen, l.tipe_absen, l.status_kehadiran, 
             l.is_manual, l.input_by, u.nama 
      FROM log_absensi l
      JOIN users u ON l.nisn = u.nomor_induk
      WHERE DATE(l.waktu_absen) = ?
      ORDER BY l.waktu_absen DESC
    `;
    
    const [rows] = await db.query(query, [date]);
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Fetch Guru Absensi Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}

// POST: Handle Manual Override (Titip Absen)
export async function POST(request) {
  try {
    const { nisn, date, time, type, inputBy } = await request.json();

    if (!nisn || !date || !time || !type || !inputBy) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Validation: 10-days backdate limit
    const inputDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(today - inputDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (inputDate > today) {
      return NextResponse.json({ error: 'Tidak dapat memasukkan tanggal di masa depan' }, { status: 400 });
    }

    if (diffDays > 10) {
      return NextResponse.json({ error: 'Tanggal melebihi batas maksimal 10 hari ke belakang' }, { status: 400 });
    }

    const datetimeStr = `${date} ${time}:00`;
    
    // Insert into DB as manual
    const query = `
      INSERT INTO log_absensi (
        nisn, waktu_absen, tipe_absen, status_kehadiran, 
        is_manual, input_by
      ) VALUES (?, ?, ?, 'tepat_waktu', TRUE, ?)
    `;

    const [result] = await db.query(query, [nisn, datetimeStr, type.toLowerCase(), inputBy]);

    return NextResponse.json({
      message: 'Data absensi manual berhasil disimpan',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Manual Input Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}
