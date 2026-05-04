'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('siswa'); // Default always siswa
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.role === 'siswa') {
          router.push('/siswa');
        } else if (user.role === 'admin') {
          router.push('/admin');
        } else if (user.role === 'guru') {
          router.push('/guru');
        } else {
          setIsChecking(false);
        }
      } catch (e) {
        console.error('Error parsing saved user:', e);
        localStorage.removeItem('user');
        setIsChecking(false);
      }
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const username = e.target.username.value;
    const password = e.target.password.value;

    // Generate / retrieve persistent device ID
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('device_id', deviceId);
    }
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role, deviceId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.error || 'Login gagal');
        setLoading(false);
        return;
      }
      
      // Save to localStorage for MVP persistence
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.user.role === 'siswa') {
        router.push('/siswa');
      } else if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/guru');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server');
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div style={{ 
            width: '40px', height: '40px', 
            border: '4px solid var(--primary-color)', 
            borderTopColor: 'transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>Memeriksa sesi...</p>
          <style jsx>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex items-center justify-center">
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '400px', width: '90%', padding: '2.5rem' }}>
        <div className="text-center mb-6">
          <img 
            src="/logo-smkn1arahan.png" 
            alt="Logo SMKN 1 Arahan" 
            style={{ 
              width: '80px', height: '80px', objectFit: 'contain',
              margin: '0 auto 1rem', display: 'block',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }} 
          />
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            {role === 'siswa' ? 'Absensi Siswa' : 'Portal Guru & Admin'}
          </h1>
          <p className="label">SMKN 1 Arahan</p>
        </div>

        {errorMsg && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="username">
              {role === 'siswa' ? 'NISN' : 'NIP / Username'}
            </label>
            <input 
              id="username" 
              name="username"
              type="text" 
              className="input-field" 
              placeholder={role === 'siswa' ? 'Masukkan NISN Anda' : 'Masukkan NIP'} 
              required 
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password"
              type="password" 
              className="input-field" 
              placeholder="Masukkan Password" 
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk Sistem'}
          </button>
          
          <div className="text-center mt-2">
            {role === 'siswa' ? (
              <button 
                type="button" 
                onClick={() => setRole('guru')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: '500', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Login sebagai <span style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Wali Kelas & Admin</span>
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => setRole('siswa')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: '500', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Kembali ke <span style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Login Siswa</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
