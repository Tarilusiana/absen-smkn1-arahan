'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('kelas');

  // Kelas State
  const [kelasList, setKelasList] = useState([]);
  const [newKelas, setNewKelas] = useState('');
  const [loadingKelas, setLoadingKelas] = useState(false);

  // Siswa State
  const [siswaList, setSiswaList] = useState([]);
  const [loadingSiswa, setLoadingSiswa] = useState(false);
  const [siswaForm, setSiswaForm] = useState({ nisn: '', nama: '', kelas: '' });
  const [siswaCSVFile, setSiswaCSVFile] = useState(null);
  const [importSiswaResult, setImportSiswaResult] = useState(null);

  // Guru State
  const [guruList, setGuruList] = useState([]);
  const [loadingGuru, setLoadingGuru] = useState(false);
  const [guruForm, setGuruForm] = useState({ nip: '', nama: '', kelas: '' });
  const [guruCSVFile, setGuruCSVFile] = useState(null);
  const [importGuruResult, setImportGuruResult] = useState(null);

  // Laporan State
  const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const [laporanData, setLaporanData] = useState([]);
  const [laporanMeta, setLaporanMeta] = useState(null);
  const [loadingLaporan, setLoadingLaporan] = useState(false);
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [filterKelas, setFilterKelas] = useState('');

  // Password State
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  // Device Management State
  const [deviceList, setDeviceList] = useState([]);
  const [loadingDevice, setLoadingDevice] = useState(false);

  // Auth check
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) { router.push('/'); return; }
    const u = JSON.parse(savedUser);
    if (u.role !== 'admin') { router.push('/'); return; }
    setUser(u);
  }, [router]);

  // === KELAS ===
  const fetchKelas = useCallback(async () => {
    setLoadingKelas(true);
    try {
      const res = await fetch('/api/admin/kelas');
      const data = await res.json();
      if (res.ok) setKelasList(data.data || []);
    } catch (e) { console.error(e); }
    setLoadingKelas(false);
  }, []);

  const addKelas = async () => {
    if (!newKelas.trim()) return;
    const res = await fetch('/api/admin/kelas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama_kelas: newKelas })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    setNewKelas('');
    fetchKelas();
  };

  const deleteKelas = async (id, nama) => {
    if (!confirm(`Hapus kelas "${nama}"?`)) return;
    await fetch('/api/admin/kelas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchKelas();
  };

  // === SISWA ===
  const fetchSiswa = useCallback(async () => {
    setLoadingSiswa(true);
    try {
      const res = await fetch('/api/admin/siswa');
      const data = await res.json();
      if (res.ok) setSiswaList(data.data || []);
    } catch (e) { console.error(e); }
    setLoadingSiswa(false);
  }, []);

  const addSiswa = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/siswa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siswaForm)
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    alert(data.message);
    setSiswaForm({ nisn: '', nama: '', kelas: '' });
    fetchSiswa();
  };

  const importSiswaCSV = async () => {
    if (!siswaCSVFile) return alert('Pilih file CSV terlebih dahulu');
    setImportSiswaResult(null);
    const text = await siswaCSVFile.text();
    const res = await fetch('/api/admin/siswa', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: text
    });
    const data = await res.json();
    setImportSiswaResult(data);
    setSiswaCSVFile(null);
    fetchSiswa();
  };

  const deleteSiswa = async (id, nama) => {
    if (!confirm(`Hapus siswa "${nama}"?`)) return;
    await fetch('/api/admin/siswa', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchSiswa();
  };

  // === GURU ===
  const fetchGuru = useCallback(async () => {
    setLoadingGuru(true);
    try {
      const res = await fetch('/api/admin/guru');
      const data = await res.json();
      if (res.ok) setGuruList(data.data || []);
    } catch (e) { console.error(e); }
    setLoadingGuru(false);
  }, []);

  const addGuru = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/guru', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guruForm)
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    alert(data.message);
    setGuruForm({ nip: '', nama: '', kelas: '' });
    fetchGuru();
  };

  const importGuruCSV = async () => {
    if (!guruCSVFile) return alert('Pilih file CSV terlebih dahulu');
    setImportGuruResult(null);
    const text = await guruCSVFile.text();
    const res = await fetch('/api/admin/guru', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: text
    });
    const data = await res.json();
    setImportGuruResult(data);
    setGuruCSVFile(null);
    fetchGuru();
  };

  const deleteGuru = async (id, nama) => {
    if (!confirm(`Hapus guru "${nama}"?`)) return;
    await fetch('/api/admin/guru', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchGuru();
  };

  // === LAPORAN ===
  const fetchLaporan = useCallback(async () => {
    if (!filterKelas) return;
    setLoadingLaporan(true);
    try {
      const res = await fetch(`/api/absensi/laporan?bulan=${filterBulan}&tahun=${filterTahun}&kelas=${encodeURIComponent(filterKelas)}`);
      const data = await res.json();
      if (res.ok) {
        setLaporanData(data.data || []);
        setLaporanMeta(data.meta || null);
      }
    } catch (e) { console.error(e); }
    setLoadingLaporan(false);
  }, [filterBulan, filterTahun, filterKelas]);

  const downloadCSV = () => {
    if (!laporanData || laporanData.length === 0 || !laporanMeta) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Laporan Kehadiran Harian\r\nBulan: ${NAMA_BULAN[filterBulan - 1]} ${filterTahun}\r\nKelas: ${filterKelas}\r\n\r\n`;
    let header = "Nama Siswa,NISN,";
    laporanMeta.activeDays.forEach(ad => { header += `Tgl ${ad.date},`; });
    header += "H.Aktif,Hadir,Telat,Alpha\r\n";
    csvContent += header;
    laporanData.forEach(student => {
      let row = `"${student.nama}","${student.nisn}",`;
      laporanMeta.activeDays.forEach(ad => { row += `${student.attendance[ad.date] || 'A'},`; });
      row += `${student.summary.hariAktif},${student.summary.hadir},${student.summary.telat},${student.summary.alpha}\r\n`;
      csvContent += row;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Laporan_${filterKelas}_${NAMA_BULAN[filterBulan - 1]}_${filterTahun}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch data on tab change
  useEffect(() => {
    if (activeTab === 'kelas') fetchKelas();
    if (activeTab === 'siswa') { fetchSiswa(); fetchKelas(); }
    if (activeTab === 'guru') { fetchGuru(); fetchKelas(); }
    if (activeTab === 'laporan') { fetchKelas(); if (filterKelas) fetchLaporan(); }
    if (activeTab === 'device') fetchDevices();
  }, [activeTab, fetchKelas, fetchSiswa, fetchGuru, fetchLaporan, filterKelas]);

  useEffect(() => {
    if (activeTab === 'laporan' && filterKelas) fetchLaporan();
  }, [filterBulan, filterTahun, filterKelas, activeTab, fetchLaporan]);

  const logout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const fetchDevices = async () => {
    setLoadingDevice(true);
    try {
      const res = await fetch('/api/admin/reset-device');
      const data = await res.json();
      if (res.ok) setDeviceList(data.data || []);
    } catch (e) { console.error(e); }
    setLoadingDevice(false);
  };

  const resetDevice = async (id, nama) => {
    if (!confirm(`Reset perangkat siswa "${nama}"? Siswa dapat login dari perangkat baru.`)) return;
    const res = await fetch('/api/admin/reset-device', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    alert(data.message);
    fetchDevices();
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

  const resetGuruPassword = async (id, nama) => {
    if (!confirm(`Reset password guru "${nama}" ke default (netura123)?`)) return;
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: id, targetRole: 'guru', resetBy: 'admin' })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    alert(data.message);
  };

  if (!user) return <div className="page-container flex items-center justify-center">Memuat...</div>;

  const tabBtnStyle = (tab) => ({
    padding: '1rem', textAlign: 'left', borderRadius: 'var(--radius-md)',
    background: activeTab === tab ? 'var(--primary-color)' : 'transparent',
    color: activeTab === tab ? 'white' : 'var(--text-primary)',
    fontWeight: activeTab === tab ? '600' : '500'
  });

  return (
    <div className="page-container" style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-4">
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: 'white' }}>
            ⚙️
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>Panel Administrator</h2>
            <p style={{ fontSize: '1rem', opacity: 0.8, margin: 0 }}>SMKN 1 Arahan</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowChangePwd(true)} style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: '500', fontSize: '0.85rem' }}>
            🔑 Sandi
          </button>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 'bold' }}>
            Keluar
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="md-grid">
        {/* Sidebar */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex flex-col gap-2">
            <button onClick={() => setActiveTab('kelas')} style={tabBtnStyle('kelas')}>
              🏫 Data Kelas
            </button>
            <button onClick={() => setActiveTab('siswa')} style={tabBtnStyle('siswa')}>
              👨‍🎓 Data Siswa
            </button>
            <button onClick={() => setActiveTab('guru')} style={tabBtnStyle('guru')}>
              👨‍🏫 Data Wali Kelas
            </button>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />
            <button onClick={() => setActiveTab('laporan')} style={tabBtnStyle('laporan')}>
              📅 Laporan Bulanan
            </button>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />
            <button onClick={() => setActiveTab('device')} style={tabBtnStyle('device')}>
              📱 Manajemen Perangkat
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>

          {/* ===== TAB KELAS ===== */}
          {activeTab === 'kelas' && (
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Manajemen Kelas</h3>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: X RPL 1"
                  value={newKelas}
                  onChange={e => setNewKelas(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addKelas()}
                />
                <button onClick={addKelas} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  + Tambah
                </button>
              </div>

              {loadingKelas ? (
                <p style={{ color: 'var(--text-secondary)' }}>Memuat...</p>
              ) : kelasList.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Belum ada data kelas.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {kelasList.map(k => (
                    <div key={k.id} className="flex justify-between items-center" style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontWeight: '600' }}>🏫 {k.nama_kelas}</span>
                      <button onClick={() => deleteKelas(k.id, k.nama_kelas)} style={{ background: '#fee2e2', color: '#991b1b', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: '600', fontSize: '0.8rem' }}>
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== TAB SISWA ===== */}
          {activeTab === 'siswa' && (
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Manajemen Data Siswa</h3>

              {/* Manual Input */}
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '1rem' }}>➕ Tambah Siswa Manual</h4>
                <form onSubmit={addSiswa} className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="w-full">
                      <label className="label">NISN</label>
                      <input type="text" className="input-field" placeholder="NISN Siswa" value={siswaForm.nisn} onChange={e => setSiswaForm({...siswaForm, nisn: e.target.value})} required />
                    </div>
                    <div className="w-full">
                      <label className="label">Nama Lengkap</label>
                      <input type="text" className="input-field" placeholder="Nama Siswa" value={siswaForm.nama} onChange={e => setSiswaForm({...siswaForm, nama: e.target.value})} required />
                    </div>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="w-full">
                      <label className="label">Kelas</label>
                      <select className="input-field" value={siswaForm.kelas} onChange={e => setSiswaForm({...siswaForm, kelas: e.target.value})} required>
                        <option value="">-- Pilih Kelas --</option>
                        {kelasList.map(k => <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Simpan</button>
                  </div>
                  <small style={{ color: 'var(--text-secondary)' }}>Password default siswa: <strong>123456</strong></small>
                </form>
              </div>

              {/* CSV Import */}
              <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px dashed #3b82f6' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>📤 Import Bulk via CSV</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Format CSV: <code style={{ background: '#e2e8f0', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>NISN, Nama Lengkap, Kelas</code> (1 baris per siswa). Baris pertama (header) akan otomatis dilewati jika terdeteksi.
                </p>
                <div className="flex gap-2 items-center">
                  <input type="file" accept=".csv,.txt" onChange={e => setSiswaCSVFile(e.target.files[0])} style={{ flex: 1 }} />
                  <button onClick={importSiswaCSV} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Upload & Import</button>
                </div>
                {importSiswaResult && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: importSiswaResult.skipped > 0 ? '#fef3c7' : '#d1fae5', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <strong>{importSiswaResult.message}</strong>
                    {importSiswaResult.errors?.length > 0 && (
                      <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                        {importSiswaResult.errors.map((err, i) => <li key={i} style={{ color: '#991b1b' }}>{err}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="flex justify-between items-center mb-4">
                <h4 style={{ fontWeight: '600' }}>Daftar Siswa Terdaftar</h4>
                <span className="badge badge-success">{siswaList.length} Siswa</span>
              </div>
              {loadingSiswa ? (
                <p style={{ color: 'var(--text-secondary)' }}>Memuat...</p>
              ) : siswaList.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Belum ada data siswa.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem' }}>NISN</th>
                        <th style={{ padding: '0.75rem' }}>Nama</th>
                        <th style={{ padding: '0.75rem' }}>Kelas</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siswaList.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{s.nomor_induk}</td>
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>{s.nama}</td>
                          <td style={{ padding: '0.75rem' }}><span className="badge badge-success">{s.kelas}</span></td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <button onClick={() => deleteSiswa(s.id, s.nama)} style={{ background: '#fee2e2', color: '#991b1b', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '600' }}>Hapus</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== TAB GURU ===== */}
          {activeTab === 'guru' && (
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Manajemen Data Wali Kelas</h3>

              {/* Manual Input */}
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '1rem' }}>➕ Tambah Wali Kelas Manual</h4>
                <form onSubmit={addGuru} className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="w-full">
                      <label className="label">NIP</label>
                      <input type="text" className="input-field" placeholder="NIP Guru" value={guruForm.nip} onChange={e => setGuruForm({...guruForm, nip: e.target.value})} required />
                    </div>
                    <div className="w-full">
                      <label className="label">Nama Lengkap</label>
                      <input type="text" className="input-field" placeholder="Nama Guru" value={guruForm.nama} onChange={e => setGuruForm({...guruForm, nama: e.target.value})} required />
                    </div>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="w-full">
                      <label className="label">Kelas Wali</label>
                      <select className="input-field" value={guruForm.kelas} onChange={e => setGuruForm({...guruForm, kelas: e.target.value})} required>
                        <option value="">-- Pilih Kelas --</option>
                        {kelasList.map(k => <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Simpan</button>
                  </div>
                  <small style={{ color: 'var(--text-secondary)' }}>Password default wali kelas: <strong>netura123</strong></small>
                </form>
              </div>

              {/* CSV Import */}
              <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px dashed #3b82f6' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>📤 Import Bulk via CSV</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Format CSV: <code style={{ background: '#e2e8f0', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>NIP, Nama Lengkap, Kelas Wali</code> (1 baris per guru). Baris pertama (header) akan otomatis dilewati jika terdeteksi.
                </p>
                <div className="flex gap-2 items-center">
                  <input type="file" accept=".csv,.txt" onChange={e => setGuruCSVFile(e.target.files[0])} style={{ flex: 1 }} />
                  <button onClick={importGuruCSV} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Upload & Import</button>
                </div>
                {importGuruResult && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: importGuruResult.skipped > 0 ? '#fef3c7' : '#d1fae5', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <strong>{importGuruResult.message}</strong>
                    {importGuruResult.errors?.length > 0 && (
                      <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                        {importGuruResult.errors.map((err, i) => <li key={i} style={{ color: '#991b1b' }}>{err}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="flex justify-between items-center mb-4">
                <h4 style={{ fontWeight: '600' }}>Daftar Wali Kelas Terdaftar</h4>
                <span className="badge badge-success">{guruList.length} Guru</span>
              </div>
              {loadingGuru ? (
                <p style={{ color: 'var(--text-secondary)' }}>Memuat...</p>
              ) : guruList.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Belum ada data guru.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem' }}>NIP</th>
                        <th style={{ padding: '0.75rem' }}>Nama</th>
                        <th style={{ padding: '0.75rem' }}>Kelas Wali</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guruList.map(g => (
                        <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{g.nomor_induk}</td>
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>{g.nama}</td>
                          <td style={{ padding: '0.75rem' }}><span className="badge badge-warning">{g.kelas}</span></td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => resetGuruPassword(g.id, g.nama)}
                                style={{ background: '#fef3c7', color: '#92400e', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '600', border: '1px solid #f59e0b' }}
                              >
                                🔄 Reset Sandi
                              </button>
                              <button onClick={() => deleteGuru(g.id, g.nama)} style={{ background: '#fee2e2', color: '#991b1b', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '600' }}>Hapus</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== TAB LAPORAN ===== */}
          {activeTab === 'laporan' && (
            <div>
              <div className="flex justify-between items-center mb-6 no-print">
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Laporan Bulanan Matrix</h3>
              </div>

              {/* Filters */}
              <div className="flex gap-2 items-center mb-6 no-print" style={{ flexWrap: 'wrap' }}>
                <select className="input-field" value={filterKelas} onChange={e => setFilterKelas(e.target.value)} style={{ padding: '0.5rem', width: 'auto', minWidth: '150px' }}>
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map(k => <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>)}
                </select>
                <select className="input-field" value={filterBulan} onChange={e => setFilterBulan(Number(e.target.value))} style={{ padding: '0.5rem', width: 'auto' }}>
                  {NAMA_BULAN.map((nama, i) => <option key={i+1} value={i+1}>{nama}</option>)}
                </select>
                <select className="input-field" value={filterTahun} onChange={e => setFilterTahun(Number(e.target.value))} style={{ padding: '0.5rem', width: 'auto' }}>
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
                <button onClick={downloadCSV} disabled={laporanData.length === 0} style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: laporanData.length === 0 ? 0.5 : 1 }}>
                  📊 Export CSV
                </button>
                <button onClick={() => window.print()} disabled={laporanData.length === 0} style={{ background: '#10b981', color: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: laporanData.length === 0 ? 0.5 : 1 }}>
                  🖨️ Cetak PDF
                </button>
              </div>

              {/* Print Header */}
              <div className="print-only text-center mb-4" style={{ display: 'none' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Laporan Kehadiran Harian</h2>
                <h3 style={{ fontSize: '1.2rem' }}>SMKN 1 Arahan</h3>
                <p>{NAMA_BULAN[filterBulan - 1]} {filterTahun} — Kelas: {filterKelas}</p>
              </div>

              {!filterKelas ? (
                <div className="text-center" style={{ padding: '3rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', color: '#94a3b8' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏫</span>
                  Pilih kelas terlebih dahulu untuk melihat laporan.
                </div>
              ) : loadingLaporan ? (
                <div className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Memuat data laporan...</div>
              ) : laporanData.length === 0 || !laporanMeta ? (
                <div className="text-center" style={{ padding: '2rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', color: '#94a3b8' }}>
                  Belum ada data absensi untuk kelas ini.
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
                            <span style={{ fontWeight: 'normal' }}>{['M','Sen','Sel','Rab','Kam','Jum','S'][ad.dayOfWeek]}</span>
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
                            let bgColor = 'transparent', color = 'inherit';
                            if (status === 'A') { bgColor = '#fee2e2'; color = '#991b1b'; }
                            else if (status === 'T') { bgColor = '#fef3c7'; color = '#b45309'; }
                            else if (status === 'H') { bgColor = '#ffffff'; }
                            return (
                              <td key={ad.date} style={{ padding: '0.25rem', border: '1px solid #cbd5e1', backgroundColor: bgColor, color, fontWeight: 'bold' }}>
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

          {/* ===== TAB DEVICE ===== */}
          {activeTab === 'device' && (
            <div>
              <div className="mb-6">
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>📱 Manajemen Perangkat Siswa</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Setiap siswa hanya dapat login dari <strong>1 perangkat</strong>. Reset jika siswa berganti HP atau ingin login dari perangkat baru.
                </p>
              </div>

              {loadingDevice ? (
                <p style={{ color: 'var(--text-secondary)' }}>Memuat data...</p>
              ) : deviceList.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Belum ada data siswa.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem' }}>NISN</th>
                        <th style={{ padding: '0.75rem' }}>Nama</th>
                        <th style={{ padding: '0.75rem' }}>Kelas</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status Perangkat</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceList.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{s.nomor_induk}</td>
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>{s.nama}</td>
                          <td style={{ padding: '0.75rem' }}><span className="badge badge-success">{s.kelas}</span></td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            {s.device_id ? (
                              <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '600' }}>
                                ✅ Terdaftar
                              </span>
                            ) : (
                              <span style={{ background: '#f1f5f9', color: '#94a3b8', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem' }}>
                                — Belum Login
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <button
                              onClick={() => resetDevice(s.id, s.nama)}
                              disabled={!s.device_id}
                              style={{ background: s.device_id ? '#fef3c7' : '#f1f5f9', color: s.device_id ? '#92400e' : '#94a3b8', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: '600', fontSize: '0.8rem', border: `1px solid ${s.device_id ? '#f59e0b' : '#e2e8f0'}`, cursor: s.device_id ? 'pointer' : 'not-allowed' }}
                            >
                              🔄 Reset Perangkat
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
            grid-template-columns: 260px 1fr !important;
          }
        }
      `}</style>

      {/* Change Password Modal */}
      {showChangePwd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'white' }}>
            <h3 style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '1.5rem' }}>🔑 Ubah Password Admin</h3>
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
