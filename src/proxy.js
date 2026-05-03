import { NextResponse } from 'next/server';

// Token yang sama harus di-set di aplikasi Android client
const APP_TOKEN = 'SMKN1ARAHAN-ABSENSI-2026';

// Next.js 16: middleware diganti jadi proxy
export function proxy(request) {
  const appToken = request.cookies.get('app_token')?.value;

  // Jika token cocok, lanjutkan
  if (appToken === APP_TOKEN) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Untuk API absensi siswa → return 403 JSON
  if (pathname.startsWith('/api/absensi/siswa')) {
    return Response.json(
      { error: 'Akses hanya melalui aplikasi resmi SMKN 1 Arahan. Silakan download aplikasi Android.' },
      { status: 403 }
    );
  }

  // Untuk halaman siswa → tampilkan halaman blocked
  return NextResponse.rewrite(new URL('/blocked', request.url));
}

// Hanya match path siswa — guru/admin tetap bisa akses dari browser
export const config = {
  matcher: ['/siswa', '/api/absensi/siswa'],
};
