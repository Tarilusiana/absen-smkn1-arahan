# 📖 Panduan Penggunaan Sistem Absensi SMKN 1 Arahan

Dokumen ini berisi panduan teknis untuk Siswa (Aplikasi Android) dan Guru/Wali Kelas (Dashboard Website).

---

## 📱 1. Panduan untuk Siswa (Aplikasi Android)

### A. Instalasi & Login
1.  Unduh dan instal file `app-debug.apk` yang diberikan oleh admin.
2.  Buka aplikasi dan masukkan **NISN** serta **Password** (Default: `123456`).
3.  Klik **Login**. Aplikasi akan mengingat akun Anda secara permanen selama tidak melakukan *Logout*.

### B. Prosedur Absensi
1.  **Izin Lokasi**: Pastikan GPS aktif dan berikan izin lokasi (`Allow`) saat diminta aplikasi.
2.  **Cek Jarak**: Pastikan status lokasi berwarna **Hijau (✅ Di Dalam Area Sekolah)**.
3.  **Akurasi GPS**: Jika jarak terlihat salah (misal: Anda di sekolah tapi tertulis 400m), klik tombol **🔄 Refresh** untuk menstabilkan sinyal.
4.  **Tekan Tombol**:
    *   Klik **⏹️ Absen Masuk** (Aktif pukul 06:00 - 09:00 WIB).
    *   Klik **⏹️ Absen Pulang** (Aktif pukul 14:30 - 17:00 WIB).
5.  **Hasil**: Jika berhasil, riwayat akan muncul di bagian bawah layar.

### C. Larangan & Keamanan
*   **DILARANG** menggunakan aplikasi *Fake GPS* atau *Mock Location*. Sistem akan mendeteksi dan memblokir akses absensi secara otomatis.
*   Satu akun hanya bisa digunakan di **satu perangkat**. Jika ganti HP, hubungi admin untuk *Reset Device*.

---

## 💻 2. Panduan untuk Guru / Wali Kelas (Website)

### A. Login & Profil
1.  Akses website melalui domain resmi sekolah.
2.  Masuk menggunakan **NIP** dan **Password**.
3.  Gunakan tombol **🔑 Sandi** untuk mengubah password default Anda demi keamanan.

### B. Menu Dashboard
*   **📊 Ringkasan Kehadiran**: Pantau siapa saja siswa kelas Anda yang sudah atau belum absen hari ini secara *real-time*.
*   **✍️ Input Absen Manual**: Digunakan khusus jika siswa berhalangan (HP rusak/tertinggal). Data yang Anda input akan ditandai sebagai *"Manual Override"*.
*   **📅 Laporan Bulanan (Matrix)**: 
    *   Melihat absensi dalam satu bulan penuh.
    *   **Export CSV**: Untuk mengolah data di Microsoft Excel.
    *   **Cetak Matrix**: Untuk mencetak laporan fisik atau simpan sebagai PDF.
*   **🔐 Reset Sandi Siswa**: Jika siswa lupa password, Anda bisa meresetnya kembali ke `123456` melalui menu ini.

---

## 🛠️ 3. Troubleshooting (Penyelesaian Masalah)

| Masalah | Solusi |
|---------|--------|
| **"Page Couldn't Load"** | Pastikan HP terhubung internet atau gunakan versi APK terbaru dari admin. |
| **Jarak Terlalu Jauh** | Pindah ke tempat terbuka (luar ruangan) agar GPS mendapat sinyal satelit, lalu klik **Refresh**. |
| **Tombol Tidak Bisa Diklik** | Cek apakah sekarang sudah masuk waktu absen (Masuk: 06-09, Pulang: 14.30-17). |
| **Gagal Absen (Sudah Absen)** | Anda hanya bisa melakukan absen masuk/pulang satu kali dalam satu hari. |

---
*Dibuat oleh Tim IT SMKN 1 Arahan — 2026*
