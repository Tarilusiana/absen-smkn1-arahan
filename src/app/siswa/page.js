'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SCHOOL_LAT, SCHOOL_LNG, RADIUS_METER } from '@/config/geofence';

const SCHOOL_COORDS = { lat: SCHOOL_LAT, lng: SCHOOL_LNG };

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [loading, setLoading] = useState(false);

  // Change Password State
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  // GPS State
  const [gpsStatus, setGpsStatus] = useState('loading'); // 'loading' | 'granted' | 'denied' | 'unavailable'
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    // Check Auth
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(savedUser));

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  // Start GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }

    setGpsStatus('loading');

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setGpsAccuracy(Math.round(accuracy));
        setGpsStatus('granted');
      },
      (error) => {
        console.error('GPS Error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('denied');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsStatus('unavailable');
        } else {
          setGpsStatus('denied');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );
    setWatchId(id);

    return () => {
      navigator.geolocation.clearWatch(id);
    };
  }, []);

  // Calculate distance whenever location changes
  useEffect(() => {
    if (!currentLocation) return;
    const dist = getDistanceFromLatLonInMeters(
      SCHOOL_COORDS.lat, SCHOOL_COORDS.lng,
      currentLocation.lat, currentLocation.lng
    );
    setDistance(Math.round(dist));
    setIsWithinRadius(dist <= RADIUS_METER);
  }, [currentLocation]);

  const handleAttendance = async (type) => {
    if (!isWithinRadius || !user || !currentLocation) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/absensi/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nisn: user.nomor_induk,
          type: type,
          lat: currentLocation.lat,
          lng: currentLocation.lng
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Gagal absen');
        setLoading(false);
        return;
      }

      const now = new Date();
      const newLog = {
        id: data.data?.id || Date.now(),
        time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: type,
        status: data.data?.status === 'terlambat' ? 'Terlambat' : 'Tepat Waktu'
      };
      
      setAttendanceLog([newLog, ...attendanceLog]);
      alert(`Berhasil Absen ${type === 'masuk' ? 'Masuk' : 'Pulang'}!`);
    } catch (err) {
      alert('Terjadi kesalahan koneksi server');
    }
    
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('user');
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    router.push('/');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.new !== pwdForm.confirm) {
      alert('Password baru tidak cocok!'); return;
    }
    if (pwdForm.new.length < 6) {
      alert('Password baru minimal 6 karakter!'); return;
    }
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

  if (!user) return <div className="page-container flex items-center justify-center">Memuat...</div>;

  const canAttend = gpsStatus === 'granted' && isWithinRadius && !loading;

  return (
    <div className="page-container" style={{ padding: '1rem', maxWidth: '480px', margin: '0 auto', background: '#fff' }}>
      {/* Header Profile */}
      <div className="flex justify-between items-center mb-6" style={{ padding: '1rem', background: 'var(--primary-color)', color: 'white', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' }}>
        <div className="flex items-center gap-4">
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'white', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', textTransform: 'uppercase' }}>
            {user.nama.substring(0, 2)}
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>{user.nama}</h2>
            <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: 0 }}>{user.kelas} • {user.nomor_induk}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowChangePwd(true)} style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'white', fontSize: '0.8rem' }}>
            🔑 Sandi
          </button>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'white' }}>
            Keluar
          </button>
        </div>
      </div>

      {/* GPS Status Card */}
      <div className="animate-fade-in mb-6" style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        border: `2px solid ${gpsStatus === 'granted' ? (isWithinRadius ? '#10b981' : '#f59e0b') : '#ef4444'}`,
        background: gpsStatus === 'granted' ? (isWithinRadius ? '#ecfdf5' : '#fffbeb') : '#fef2f2'
      }}>
        {gpsStatus === 'loading' && (
          <div className="flex items-center gap-4">
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <div>
              <p style={{ fontWeight: '600', margin: 0 }}>Mendeteksi Lokasi...</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Mohon izinkan akses GPS di perangkat Anda</p>
            </div>
          </div>
        )}

        {gpsStatus === 'denied' && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span style={{ fontSize: '2rem' }}>🚫</span>
              <div>
                <p style={{ fontWeight: '700', margin: 0, color: '#991b1b' }}>Akses Lokasi Ditolak</p>
                <p style={{ fontSize: '0.8rem', color: '#991b1b', margin: 0 }}>Anda harus mengizinkan akses lokasi untuk bisa absen.</p>
              </div>
            </div>
            <div style={{ background: '#fff', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>Cara mengaktifkan:</strong> Buka Pengaturan Browser → Izin Situs → Lokasi → Izinkan untuk situs ini, lalu muat ulang halaman.
            </div>
            <button onClick={() => window.location.reload()} className="btn-primary w-full mt-4" style={{ fontSize: '0.9rem' }}>
              🔄 Muat Ulang Halaman
            </button>
          </div>
        )}

        {gpsStatus === 'unavailable' && (
          <div className="flex items-center gap-4">
            <span style={{ fontSize: '2rem' }}>📵</span>
            <div>
              <p style={{ fontWeight: '700', margin: 0, color: '#991b1b' }}>GPS Tidak Tersedia</p>
              <p style={{ fontSize: '0.8rem', color: '#991b1b', margin: 0 }}>Perangkat Anda tidak mendukung GPS atau fitur lokasi dinonaktifkan.</p>
            </div>
          </div>
        )}

        {gpsStatus === 'granted' && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span style={{ fontSize: '2rem' }}>{isWithinRadius ? '✅' : '⚠️'}</span>
              <div>
                <p style={{ fontWeight: '700', margin: 0, color: isWithinRadius ? '#065f46' : '#92400e' }}>
                  {isWithinRadius ? 'Di Dalam Area Sekolah' : 'Di Luar Area Sekolah'}
                </p>
                <p style={{ fontSize: '0.8rem', color: isWithinRadius ? '#047857' : '#b45309', margin: 0 }}>
                  Jarak: <strong>{distance}m</strong> dari titik absen {gpsAccuracy && `• Akurasi: ±${gpsAccuracy}m`}
                </p>
              </div>
            </div>
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: isWithinRadius ? '#10b981' : '#f59e0b',
              boxShadow: `0 0 8px ${isWithinRadius ? '#10b981' : '#f59e0b'}`,
              animation: 'pulse 2s infinite'
            }} />
          </div>
        )}
      </div>

      {/* Main Action Area */}
      <div className="glass-panel text-center mb-6 animate-fade-in" style={{ padding: '2rem 1rem' }}>
        <h3 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {currentTime || '00:00:00'}
        </h3>
        
        <div className="flex gap-4" style={{ marginTop: '1.5rem' }}>
          <button 
            className="btn-success w-full" 
            onClick={() => handleAttendance('masuk')}
            disabled={!canAttend}
            style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: !canAttend ? 0.5 : 1 }}
          >
            <span style={{ fontSize: '1.5rem' }}>📥</span>
            <span>{loading ? '...' : 'Absen Masuk'}</span>
          </button>
          <button 
            className="btn-primary w-full" 
            onClick={() => handleAttendance('pulang')}
            disabled={!canAttend}
            style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', backgroundColor: canAttend ? '#f59e0b' : '#9ca3af', opacity: !canAttend ? 0.5 : 1 }}
          >
            <span style={{ fontSize: '1.5rem' }}>📤</span>
            <span>{loading ? '...' : 'Absen Pulang'}</span>
          </button>
        </div>
        {gpsStatus === 'granted' && !isWithinRadius && (
          <p style={{ color: 'var(--danger-text)', fontSize: '0.8rem', marginTop: '1rem', fontWeight: '500' }}>
            Anda berada <strong>{distance}m</strong> dari titik absen. Maksimal 100m.
          </p>
        )}
        {gpsStatus !== 'granted' && (
          <p style={{ color: 'var(--danger-text)', fontSize: '0.8rem', marginTop: '1rem', fontWeight: '500' }}>
            Aktifkan GPS terlebih dahulu untuk bisa melakukan absensi.
          </p>
        )}
      </div>

      {/* History Area */}
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Riwayat Sesi Ini</h4>
        {attendanceLog.length === 0 ? (
          <div className="text-center" style={{ padding: '2rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', color: '#94a3b8' }}>
            Belum ada data absensi baru
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {attendanceLog.map(log => (
              <div key={log.id} className="flex justify-between items-center" style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${log.type === 'masuk' ? 'var(--success-color)' : 'var(--warning-color)'}` }}>
                <div>
                  <p style={{ fontWeight: '600', textTransform: 'capitalize', margin: 0 }}>Absen {log.type}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{log.status}</p>
                </div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                  {log.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Change Password Modal */}
      {showChangePwd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '2rem', background: 'white' }}>
            <h3 style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '1.5rem' }}>🔑 Ubah Password</h3>
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
