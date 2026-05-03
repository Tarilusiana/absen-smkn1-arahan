'use client';

export default function BlockedPage() {
  return (
    <div className="page-container flex items-center justify-center">
      <div className="glass-panel animate-fade-in text-center" style={{ maxWidth: '420px', width: '90%', padding: '2.5rem' }}>
        <img
          src="/logo-smkn1arahan.png"
          alt="Logo SMKN 1 Arahan"
          style={{
            width: '80px', height: '80px', objectFit: 'contain',
            margin: '0 auto 1.5rem', display: 'block',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}
        />

        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem', fontSize: '2.5rem'
        }}>
          📱
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Gunakan Aplikasi Resmi
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          Sistem absensi siswa <strong>SMKN 1 Arahan</strong> hanya dapat diakses melalui
          aplikasi Android resmi. Silakan download dan install aplikasi terlebih dahulu.
        </p>

        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)', padding: '1rem',
          marginBottom: '1.5rem', textAlign: 'left'
        }}>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
            📋 Cara Install:
          </p>
          <ol style={{ paddingLeft: '1.25rem', color: '#1e3a5f', fontSize: '0.85rem', lineHeight: '1.8' }}>
            <li>Dapatkan file APK dari Wali Kelas atau Admin</li>
            <li>Buka file APK di HP Android Anda</li>
            <li>Izinkan instalasi dari sumber tidak dikenal jika diminta</li>
            <li>Login menggunakan NISN dan Password</li>
          </ol>
        </div>

        <div style={{
          background: '#fef3c7', border: '1px solid #fcd34d',
          borderRadius: 'var(--radius-md)', padding: '0.75rem',
          fontSize: '0.8rem', color: '#92400e'
        }}>
          <strong>⚠️ Untuk Guru & Admin:</strong> Silakan gunakan halaman login di{' '}
          <a href="/" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '600' }}>
            halaman utama
          </a>{' '}
          dan pilih &quot;Login sebagai Wali Kelas & Admin&quot;.
        </div>
      </div>
    </div>
  );
}
