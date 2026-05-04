# 🚀 Panduan Deployment VPS — Sistem Absensi SMKN 1 Arahan

## Prasyarat VPS

| Komponen | Versi Minimum |
|----------|---------------|
| OS | Ubuntu 22.04+ / Debian 12+ |
| Node.js | v20 LTS atau v22+ |
| MySQL/MariaDB | 8.0+ / 10.6+ |
| Nginx | latest |
| PM2 | latest |
| Certbot | latest (untuk SSL) |

> ⚠️ **PENTING:** GPS/Geolocation API di browser mobile **WAJIB HTTPS**.
> Tanpa SSL, fitur absensi geofence TIDAK AKAN BERFUNGSI di aplikasi Android.

---

## Langkah 1: Install Dependencies di VPS

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi
node -v   # v22.x.x
npm -v    # 10.x.x

# Install MySQL/MariaDB
sudo apt install -y mariadb-server
sudo mysql_secure_installation

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

---

## Langkah 2: Setup Database

```bash
# Login ke MySQL
sudo mysql -u root -p
```

```sql
-- Buat database & user
CREATE DATABASE absen_geofence_db;
CREATE USER 'absen_user'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_KUAT';
GRANT ALL PRIVILEGES ON absen_geofence_db.* TO 'absen_user'@'localhost';
FLUSH PRIVILEGES;
USE absen_geofence_db;

-- Keluar dari MySQL
exit;
```

---

## Langkah 3: Upload Project ke VPS

### Via Git
```bash
cd /var/www
sudo git clone https://github.com/Tarilusiana/absen-smkn1-arahan.git absen_siswa
cd absen_siswa
```

### Setup permissions
```bash
sudo chown -R $USER:$USER /var/www/absen_siswa
cd /var/www/absen_siswa
```

---

## Langkah 4: Import Schema Database

Setelah repository di-clone, jalankan perintah berikut untuk meng-import schema:

```bash
cd /var/www/absen_siswa
mysql -u absen_user -p absen_geofence_db < database/schema.sql
```
*(Masukkan password database yang baru Anda buat saat diminta. File ini sudah termasuk data dummy: 5 kelas, akun admin, 2 siswa, dan 1 guru untuk testing.)*

---

## Langkah 5: Konfigurasi Environment

```bash
cd /var/www/absen_siswa

# Buat file environment production
cat > .env.local << 'EOF'
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=absen_user
DB_PASSWORD=GANTI_PASSWORD_KUAT
DB_NAME=absen_geofence_db
EOF

# Pastikan permission aman
chmod 600 .env.local
```

---

## Langkah 6: Install & Build

```bash
cd /var/www/absen_siswa

# Install dependencies (production only)
npm ci --production

# Build production
npm run build
```

> Pastikan output menunjukkan `✓ Compiled successfully` dan `ƒ Proxy (Middleware)`.

---

## Langkah 7: Jalankan dengan PM2

```bash
# Jalankan aplikasi
pm2 start npm --name "absen-smkn1" -- start

# Cek status
pm2 status
pm2 logs absen-smkn1

# Auto-start saat server reboot
pm2 save
pm2 startup
# (ikuti instruksi yang muncul)
```

### Perintah PM2 Berguna
```bash
pm2 restart absen-smkn1    # Restart aplikasi
pm2 stop absen-smkn1       # Stop aplikasi
pm2 delete absen-smkn1     # Hapus dari PM2
pm2 logs absen-smkn1       # Lihat log
pm2 monit                  # Monitor realtime
```

---

## Langkah 8: Setup Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/absen-smkn1
```

Isi file:

```nginx
server {
    listen 80;
    server_name absen.smkn1arahan.sch.id;   # Ganti dengan domain Anda

    # Redirect HTTP ke HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name absen.smkn1arahan.sch.id;   # Ganti dengan domain Anda

    # SSL (akan dikelola oleh Certbot)
    ssl_certificate /etc/letsencrypt/live/absen.smkn1arahan.sch.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/absen.smkn1arahan.sch.id/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy ke Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Aktifkan site
sudo ln -s /etc/nginx/sites-available/absen-smkn1 /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Langkah 9: Setup SSL (WAJIB untuk GPS)

### Jika sudah punya domain:
```bash
# Generate SSL gratis via Let's Encrypt
sudo certbot --nginx -d absen.smkn1arahan.sch.id

# Test auto-renew
sudo certbot renew --dry-run
```

### Jika belum punya domain (pakai IP saja):
Gunakan self-signed certificate untuk testing:
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/absen-selfsigned.key \
  -out /etc/ssl/certs/absen-selfsigned.crt
```
Lalu ubah path SSL di config Nginx ke file di atas.

> ⚠️ Self-signed certificate akan menampilkan warning di browser/app.
> Untuk produksi, gunakan domain + Let's Encrypt.

---

## Langkah 10: Set Timezone Server

```bash
# Set ke WIB (WAJIB — validasi jam absensi bergantung pada ini)
sudo timedatectl set-timezone Asia/Jakarta

# Verifikasi
timedatectl
date
```

---

## Langkah 11: Update Aplikasi Android

Setelah server berjalan, ubah `BASE_URL` di aplikasi Android:

**File:** `android/app/src/main/kotlin/id/sch/smkn1arahan/absensi/MainActivity.kt`

```kotlin
companion object {
    private const val BASE_URL = "https://absen.smkn1arahan.sch.id"  // ← domain VPS
    private const val APP_TOKEN = "SMKN1ARAHAN-ABSENSI-2026"
}
```

Rebuild APK:
```bash
cd android
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/opt/android-studio/jbr
./gradlew assembleDebug
```

APK hasil build: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Langkah 12: Import Data Sekolah

Setelah deploy, login sebagai admin dan:
1. Tambahkan data **Kelas** (X RPL 1, XI RPL 1, dll)
2. Import data **Siswa** via CSV (format: `NISN, Nama, Kelas`)
3. Import data **Wali Kelas** via CSV (format: `NIP, Nama, Kelas Wali`)
4. Distribusikan APK ke siswa

---

## Checklist Final

- [ ] Database MySQL berjalan & schema ter-import
- [ ] `.env.local` dikonfigurasi dengan benar
- [ ] `npm run build` sukses
- [ ] PM2 menjalankan aplikasi (`pm2 status`)
- [ ] Nginx reverse proxy aktif
- [ ] SSL/HTTPS terpasang (cek `https://domain-anda`)
- [ ] Timezone server = `Asia/Jakarta`
- [ ] `BASE_URL` di Android app sudah mengarah ke domain VPS
- [ ] APK sudah di-rebuild dan siap distribusi
- [ ] Login admin berfungsi dari browser
- [ ] Login siswa berfungsi dari aplikasi Android
- [ ] GPS & absensi geofence berfungsi

---

## Troubleshooting

### Aplikasi tidak bisa diakses
```bash
pm2 logs absen-smkn1     # Cek error log
sudo systemctl status nginx  # Cek Nginx
sudo ufw status           # Cek firewall (pastikan port 80, 443 terbuka)
```

### GPS tidak berfungsi di Android
- Pastikan server menggunakan HTTPS (bukan HTTP)
- Pastikan izin lokasi diberikan di HP siswa
- Cek apakah GPS HP aktif

### Database connection error
```bash
sudo systemctl status mariadb   # Cek MariaDB
mysql -u absen_user -p           # Test login DB manual
```

### Rebuild setelah update kode
```bash
cd /var/www/absen_siswa
git pull                    # Jika pakai git
npm run build               # Rebuild
pm2 restart absen-smkn1     # Restart app
```
