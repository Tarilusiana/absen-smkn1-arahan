'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Mock Data untuk dropdown agar sesuai dengan database dummy
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const MOCK_STUDENTS = [
  { id: '12345678', name: 'Andi Budi', nisn: '12345678' },
  { id: '23456789', name: 'Siti Aminah', nisn: '23456789' },
];

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); 
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Form State for Manual Input
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedType, setSelectedType] = useState('Masuk');
  
  const [maxDate, setMaxDate] = useState('');
  const [minDate, setMinDate] = useState('');

  // Report State
  const [laporanData, setLaporanData] = useState([]);
  const [laporanMeta, setLaporanMeta] = useState(null);
  const [loadingLaporan, setLoadingLaporan] = useState(false);
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());

  // Password Management State
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [siswaDaftarList, setSiswaDaftarList] = useState([]);
  const [loadingDaftar, setLoadingDaftar] = useState(false);

  const fetchAttendance = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const res = await fetch('/api/absensi/guru');
      const data = await res.json();
      if (res.ok) {
        setAttendanceData(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingOverview(false);
  }, []);

  const fetchLaporan = useCallback(async () => {
    setLoadingLaporan(true);
    try {
      const res = await fetch(`/api/absensi/laporan?bulan=${filterBulan}&tahun=${filterTahun}`);
      const data = await res.json();
      if (res.ok) {
        setLaporanData(data.data || []);
        setLaporanMeta(data.meta || null);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingLaporan(false);
  }, [filterBulan, filterTahun]);

  useEffect(() => {
    if (activeTab === 'laporan') {
      fetchLaporan();
    }
  }, [activeTab, filterBulan, filterTahun, fetchLaporan]);

  const downloadCSV = () => {
    if (!laporanData || laporanData.length === 0 || !laporanMeta) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Title Info
    csvContent += `Laporan Kehadiran Harian\r\nBulan: ${NAMA_BULAN[filterBulan - 1]} ${filterTahun}\r\nKelas: ${user?.kelas || 'Semua Kelas'}\r\n\r\n`;

    // Header Row
    let header = "Nama Siswa,NISN,";
    laporanMeta.activeDays.forEach(ad => {
      header += `Tgl ${ad.date},`;
    });
    header += "H.Aktif,Hadir,Telat,Alpha\r\n";
    csvContent += header;

    // Data Rows
    laporanData.forEach(student => {
      let row = `"${student.nama}","${student.nisn}",`;
      laporanMeta.activeDays.forEach(ad => {
        row += `${student.attendance[ad.date] || 'A'},`;
      });
      row += `${student.summary.hariAktif},${student.summary.hadir},${student.summary.telat},${student.summary.alpha}\r\n`;
      csvContent += row;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Absensi_${NAMA_BULAN[filterBulan - 1]}_${filterTahun}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // Check Auth
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/');
      return;
    }
    const u = JSON.parse(savedUser);
    if(u.role === 'siswa') {
      router.push('/siswa');
      return;
    }
    setUser(u);

    // Setup Dates
    const today = new Date();
    const minDay = new Date();
    minDay.setDate(today.getDate() - 10);
    
    setMaxDate(today.toISOString().split('T')[0]);
    setMinDate(minDay.toISOString().split('T')[0]);
    setSelectedDate(today.toISOString().split('T')[0]);
    
    const nowTime = today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setSelectedTime(nowTime.replace('.', ':')); 

    fetchAttendance();
  }, [fetchAttendance, router]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedDate || !selectedTime || !user) {
      alert('Mohon lengkapi semua data');
      return;
    }

    setLoadingSubmit(true);
    try {
      const res = await fetch('/api/absensi/guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nisn: selectedStudent,
          date: selectedDate,
          time: selectedTime,
          type: selectedType,
          inputBy: user.nama
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menyimpan data');
      } else {
        alert('Data absensi manual berhasil disimpan!');
        setSelectedStudent('');
        setActiveTab('overview');
        fetchAttendance(); // Refresh table
      }
    } catch (err) {
      alert('Kesalahan koneksi ke server');
    }
    setLoadingSubmit(false);
  };

  const logout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.new !== pwdForm.confirm) { alert('Password baru tidak cocok!'); return; }
    if (pwdForm.new.length < 6) { alert('Password baru minimal 6 karakter!'); return; }
    setPwdLoading(true);
    const res = await fetch('/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomor_induk: user.nomor_induk, oldPassword: pwdForm.old, newPassword: pwdForm.new })
    });
    const data = await res.json();
    setPwdLoading(false);
    if (!res.ok) { alert(data.error); return; }
    alert('Password berhasil diubah!');
    setPwdForm({ old: '', new: '', confirm: '' });
    setShowChangePwd(false);
  };

  const fetchSiswaDaftar = async () => {
    if (!user) return;
    setLoadingDaftar(true);
    try {
      const res = await fetch('/api/admin/siswa');
      const data = await res.json();
      if (res.ok) {
        // Filter only students in the same class
        const filtered = (data.data || []).filter(s => s.kelas === user.kelas);
        setSiswaDaftarList(filtered);
      }
    } catch (e) { console.error(e); }
    setLoadingDaftar(false);
  };

  const resetSiswaPassword = async (id, nama) => {
    if (!confirm(`Reset password siswa "${nama}" ke default (123456)?`)) return;
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: id, targetRole: 'siswa', resetBy: 'guru' })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    alert(data.message);
  };

  if (!user) return <div className="page-container flex items-center justify-center">Memuat...</div>;

  return (
    <div className="page-container" style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Profile */}
      <div className="flex justify-between items-center mb-6 no-print" style={{ padding: '1.5rem', background: 'var(--primary-color)', color: 'white', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' }}>
        <div className="flex items-center gap-4">
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', textTransform: 'uppercase' }}>
            {user.nama.substring(0, 2)}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>{user.nama}</h2>
            <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0 }}>{user.kelas ? `Wali Kelas ${user.kelas}` : 'Admin'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowChangePwd(true)} style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: '500', fontSize: '0.85rem' }}>
            🔑 Sandi
          </button>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 'bold' }}>
            Keluar
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="md-grid">
        
        {/* Sidebar / Tabs */}
        <div className="glass-panel no-print" style={{ padding: '1.5rem' }}>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => { setActiveTab('overview'); fetchAttendance(); }}
              style={{ 
                padding: '1rem', textAlign: 'left', borderRadius: 'var(--radius-md)',
                background: activeTab === 'overview' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'overview' ? 'white' : 'var(--text-primary)',
                fontWeight: activeTab === 'overview' ? '600' : '500'
              }}
            >
              📊 Ringkasan Kehadiran
            </button>
            <button 
              onClick={() => setActiveTab('manual')}
              style={{ 
                padding: '1rem', textAlign: 'left', borderRadius: 'var(--radius-md)',
                background: activeTab === 'manual' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'manual' ? 'white' : 'var(--text-primary)',
                fontWeight: activeTab === 'manual' ? '600' : '500'
              }}
            >
              ✍️ Input Absen Manual (Titip)
            </button>
            <button 
              onClick={() => setActiveTab('laporan')}
              style={{ 
                padding: '1rem', textAlign: 'left', borderRadius: 'var(--radius-md)',
                background: activeTab === 'laporan' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'laporan' ? 'white' : 'var(--text-primary)',
                fontWeight: activeTab === 'laporan' ? '600' : '500'
              }}
            >
              📅 Laporan Bulanan (Matrix)
            </button>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)', margin: '0.5rem 0' }} />
            <button 
              onClick={() => { setActiveTab('reset-pw'); fetchSiswaDaftar(); }}
              style={{ 
                padding: '1rem', textAlign: 'left', borderRadius: 'var(--radius-md)',
                background: activeTab === 'reset-pw' ? '#ef4444' : 'transparent',
                color: activeTab === 'reset-pw' ? 'white' : 'var(--text-primary)',
                fontWeight: activeTab === 'reset-pw' ? '600' : '500'
              }}
            >
              🔐 Reset Sandi Siswa
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
          
          {activeTab === 'overview' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Data Absensi Hari Ini</h3>
                <div className="flex gap-2 items-center">
                  <button 
                    onClick={() => window.print()} 
                    className="no-print"
                    style={{ background: '#10b981', color: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span>🖨️</span> Cetak PDF
                  </button>
                  <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: 'bold' }}>
                    Total: {attendanceData.length} Data
                  </div>
                </div>
              </div>

              {loadingOverview ? (
                <div className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Memuat data...</div>
              ) : attendanceData.length === 0 ? (
                <div className="text-center" style={{ padding: '2rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', color: '#94a3b8' }}>
                  Belum ada data absensi hari ini.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '1rem' }}>Nama Siswa</th>
                        <th style={{ padding: '1rem' }}>Waktu</th>
                        <th style={{ padding: '1rem' }}>Tipe</th>
                        <th style={{ padding: '1rem' }}>Status Input</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((log) => {
                        const dateObj = new Date(log.waktu_absen);
                        const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <tr key={log.id_absen} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '1rem', fontWeight: '500' }}>{log.nama}</td>
                            <td style={{ padding: '1rem', fontWeight: '600' }}>{timeStr}</td>
                            <td style={{ padding: '1rem' }}>
                              <span className={`badge ${log.tipe_absen === 'masuk' ? 'badge-success' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                                {log.tipe_absen}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {log.is_manual ? (
                                <span className="badge badge-danger" title={`Diinput oleh ${log.input_by}`}>
                                  ⚙️ Manual Override
                                </span>
                              ) : (
                                <span className="badge badge-success">
                                  📱 Aplikasi Siswa
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div>
              <div className="mb-6">
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Input Kehadiran Manual</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Fitur ini digunakan jika siswa tidak membawa HP atau HP rusak. 
                  Anda hanya dapat memasukkan data maksimal 10 hari ke belakang.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="flex flex-col gap-5" style={{ maxWidth: '600px' }}>
                <div>
                  <label className="label">Pilih Siswa</label>
                  <select 
                    className="input-field" 
                    value={selectedStudent} 
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {MOCK_STUDENTS.map(student => (
                      <option key={student.id} value={student.nisn}>
                        {student.nisn} - {student.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="w-full">
                    <label className="label">Tanggal Absen</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={selectedDate}
                      min={minDate}
                      max={maxDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                    />
                    <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                      Batas mundur: {minDate}
                    </small>
                  </div>
                  
                  <div className="w-full">
                    <label className="label">Waktu/Jam</label>
                    <input 
                      type="time" 
                      className="input-field" 
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Tipe Kehadiran</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedType('Masuk')}
                      className="w-full"
                      style={{
                        padding: '0.75rem', borderRadius: 'var(--radius-md)',
                        border: `2px solid ${selectedType === 'Masuk' ? 'var(--success-color)' : '#e5e7eb'}`,
                        backgroundColor: selectedType === 'Masuk' ? 'var(--success-bg)' : 'transparent',
                        color: selectedType === 'Masuk' ? 'var(--success-text)' : 'var(--text-secondary)',
                        fontWeight: '600'
                      }}
                    >
                      Masuk
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedType('Pulang')}
                      className="w-full"
                      style={{
                        padding: '0.75rem', borderRadius: 'var(--radius-md)',
                        border: `2px solid ${selectedType === 'Pulang' ? 'var(--warning-color)' : '#e5e7eb'}`,
                        backgroundColor: selectedType === 'Pulang' ? '#fef3c7' : 'transparent',
                        color: selectedType === 'Pulang' ? '#b45309' : 'var(--text-secondary)',
                        fontWeight: '600'
                      }}
                    >
                      Pulang
                    </button>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--danger-color)', marginTop: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <strong>Peringatan:</strong> Data yang diinput melalui form ini akan ditandai secara khusus di dalam sistem sebagai <strong>"Manual Override"</strong> dan tercatat nama Anda sebagai penginput.
                  </p>
                </div>

                <button type="submit" className="btn-primary mt-2" disabled={loadingSubmit}>
                  {loadingSubmit ? 'Menyimpan...' : 'Simpan Data Kehadiran'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'laporan' && (
            <div>
              <div className="flex justify-between items-center mb-6 no-print">
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Laporan Bulanan Matrix</h3>
                <div className="flex gap-2 items-center">
                  <select className="input-field" value={filterBulan} onChange={e => setFilterBulan(Number(e.target.value))} style={{ padding: '0.5rem', width: 'auto' }}>
                    {NAMA_BULAN.map((nama, i) => (
                      <option key={i+1} value={i+1}>{nama}</option>
                    ))}
                  </select>
                  <select className="input-field" value={filterTahun} onChange={e => setFilterTahun(e.target.value)} style={{ padding: '0.5rem', width: 'auto' }}>
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                  <button 
                    onClick={downloadCSV} 
                    style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span>📊</span> Export CSV
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    style={{ background: '#10b981', color: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span>🖨️</span> Cetak Matrix
                  </button>
                </div>
              </div>

              {/* Laporan Print Header - Hidden unless printing */}
              <div className="print-only text-center mb-4" style={{ display: 'none' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Laporan Kehadiran Harian</h2>
                <h3 style={{ fontSize: '1.2rem' }}>SMKN 1 Arahan</h3>
                <p>{NAMA_BULAN[filterBulan - 1]} {filterTahun} — Kelas: {user?.kelas || 'Semua Kelas'}</p>
              </div>

              {loadingLaporan ? (
                <div className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Memuat data laporan matrix...</div>
              ) : laporanData.length === 0 || !laporanMeta ? (
                <div className="text-center" style={{ padding: '2rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', color: '#94a3b8' }}>
                  Belum ada data laporan.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="matrix-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#e2e8f0' }}>
                        <th rowSpan="2" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'left', minWidth: '200px' }}>Nama (NISN)</th>
                        <th colSpan={laporanMeta.activeDays.length} style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Tanggal / Hari</th>
                        <th rowSpan="2" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', width: '50px' }}>H.Aktif</th>
                        <th rowSpan="2" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', width: '50px' }}>Hadir</th>
                        <th rowSpan="2" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', width: '50px' }}>Telat</th>
                        <th rowSpan="2" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', width: '50px' }}>Alpha</th>
                      </tr>
                      <tr style={{ backgroundColor: '#f8fafc', fontSize: '0.75rem', color: '#64748b' }}>
                        {laporanMeta.activeDays.map(ad => (
                          <th key={ad.date} style={{ padding: '0.25rem', border: '1px solid #cbd5e1', minWidth: '30px' }}>
                            {ad.date}<br/>
                            <span style={{ fontWeight: 'normal' }}>
                              {['M', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'S'][ad.dayOfWeek]}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {laporanData.map(student => (
                        <tr key={student.id}>
                          <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'left', fontWeight: '500' }}>
                            {student.nama.toUpperCase()} <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>({student.nisn})</span>
                          </td>
                          
                          {laporanMeta.activeDays.map(ad => {
                            const status = student.attendance[ad.date];
                            let bgColor = 'transparent';
                            let color = 'inherit';
                            let fw = 'bold';
                            
                            if (status === 'A') {
                              bgColor = '#fee2e2'; // Light red
                              color = '#991b1b';
                            } else if (status === 'T') {
                              bgColor = '#fef3c7'; // Light yellow
                              color = '#b45309';
                            } else if (status === 'H') {
                              bgColor = '#ffffff';
                            }

                            return (
                              <td key={ad.date} style={{ padding: '0.25rem', border: '1px solid #cbd5e1', backgroundColor: bgColor, color, fontWeight: fw }}>
                                {status || 'A'}
                              </td>
                            );
                          })}
                          
                          <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{student.summary.hariAktif}</td>
                          <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{student.summary.hadir}</td>
                          <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{student.summary.telat}</td>
                          <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{student.summary.alpha}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== TAB RESET PASSWORD SISWA ===== */}
          {activeTab === 'reset-pw' && (
            <div>
              <div className="mb-6">
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>🔐 Reset Sandi Siswa</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Gunakan fitur ini jika siswa lupa password. Password akan direset ke default: <strong>123456</strong>
                </p>
              </div>

              {loadingDaftar ? (
                <p style={{ color: 'var(--text-secondary)' }}>Memuat daftar siswa...</p>
              ) : siswaDaftarList.length === 0 ? (
                <div className="text-center" style={{ padding: '2rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', color: '#94a3b8' }}>
                  Tidak ada siswa di kelas {user?.kelas}.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem' }}>NISN</th>
                        <th style={{ padding: '0.75rem' }}>Nama Siswa</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siswaDaftarList.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{s.nomor_induk}</td>
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>{s.nama}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <button
                              onClick={() => resetSiswaPassword(s.id, s.nama)}
                              style={{ background: '#fef3c7', color: '#92400e', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: '600', fontSize: '0.8rem', border: '1px solid #f59e0b' }}
                            >
                              🔄 Reset ke 123456
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      
      <style jsx>{`
        @media (min-width: 768px) {
          .md-grid {
            grid-template-columns: 300px 1fr !important;
          }
        }
      `}</style>

      {/* Change Password Modal */}
      {showChangePwd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'white' }}>
            <h3 style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '1.5rem' }}>🔑 Ubah Password Saya</h3>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <label className="label">Password Lama</label>
                <input type="password" className="input-field" placeholder="Masukkan password lama" value={pwdForm.old} onChange={e => setPwdForm({...pwdForm, old: e.target.value})} required />
              </div>
              <div>
                <label className="label">Password Baru</label>
                <input type="password" className="input-field" placeholder="Minimal 6 karakter" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} required />
              </div>
              <div>
                <label className="label">Konfirmasi Password Baru</label>
                <input type="password" className="input-field" placeholder="Ulangi password baru" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} required />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowChangePwd(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', background: '#f1f5f9', color: 'var(--text-secondary)', fontWeight: '600' }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={pwdLoading}>{pwdLoading ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
