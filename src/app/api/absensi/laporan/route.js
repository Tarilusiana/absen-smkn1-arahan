import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get('bulan') || (new Date().getMonth() + 1);
    const tahun = searchParams.get('tahun') || new Date().getFullYear();
    const kelas = searchParams.get('kelas');

    let userQuery = `SELECT id, nomor_induk as nisn, nama, kelas FROM users WHERE role = 'siswa'`;
    let userParams = [];
    if (kelas) {
      userQuery += ` AND kelas = ?`;
      userParams.push(kelas);
    }
    userQuery += ` ORDER BY nama ASC`;
    
    const [students] = await db.query(userQuery, userParams);

    if (students.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const nisnList = students.map(s => s.nisn);
    
    // Get attendance for these students in the specific month
    // We only care about "masuk" for daily attendance status
    const logQuery = `
      SELECT nisn, DATE(waktu_absen) as tgl, status_kehadiran
      FROM log_absensi
      WHERE MONTH(waktu_absen) = ? AND YEAR(waktu_absen) = ? AND tipe_absen = 'masuk'
    `;
    const [logs] = await db.query(logQuery, [bulan, tahun]);

    // Group logs by NISN and Date
    const logMap = {};
    logs.forEach(log => {
      if (!logMap[log.nisn]) logMap[log.nisn] = {};
      
      // format date to 'YYYY-MM-DD' taking timezone into account carefully
      const d = new Date(log.tgl);
      // to avoid timezone shifts, we use local string
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      logMap[log.nisn][dateStr] = log.status_kehadiran; // 'tepat_waktu' or 'terlambat'
    });

    // Generate active days (Mon-Fri) for the month
    const daysInMonth = new Date(tahun, bulan, 0).getDate();
    const activeDays = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(tahun, bulan - 1, day);
      const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        activeDays.push({
          date: day,
          fullDate: `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          dayOfWeek: dayOfWeek // 1 to 5
        });
      }
    }

    const totalActiveDays = activeDays.length;

    // Build the final report matrix
    const reportData = students.map(student => {
      const attendanceRecord = {};
      let hadir = 0;
      let telat = 0;
      let alpha = 0;

      activeDays.forEach(ad => {
        const status = logMap[student.nisn]?.[ad.fullDate];
        if (status === 'tepat_waktu') {
          attendanceRecord[ad.date] = 'H';
          hadir++;
        } else if (status === 'terlambat') {
          attendanceRecord[ad.date] = 'T';
          telat++;
        } else {
          attendanceRecord[ad.date] = 'A';
          alpha++;
        }
      });

      return {
        ...student,
        attendance: attendanceRecord,
        summary: {
          hariAktif: totalActiveDays,
          hadir,
          telat,
          alpha
        }
      };
    });

    return NextResponse.json({ 
      data: reportData, 
      meta: {
        bulan, 
        tahun, 
        activeDays 
      }
    });

  } catch (error) {
    console.error('Fetch Laporan Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}
