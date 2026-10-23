'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import Logo from './Logo';

/** Pembungkus halaman yang butuh login. Mengarahkan ke /login bila belum masuk. */
export default function Shell({ children }: { children: (role: 'dosen' | 'mahasiswa') => React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="wrap">
        <header className="top">
          <Logo href="/" />
        </header>
        <p className="muted mono">Memuat…</p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header className="top">
        <Logo href="/dashboard" />
        <div className="who">
          {profile && <span className="role-tag">{profile.role === 'dosen' ? 'Dosen' : 'Mahasiswa'}</span>}
          <span className="who-name">{profile?.full_name ?? user.email}</span>
          <button type="button" className="btn btn-sm" onClick={() => signOut().then(() => router.replace('/'))}>
            Keluar
          </button>
        </div>
      </header>
      {profile ? (
        children(profile.role)
      ) : (
        <div className="notice err">
          Profilmu belum terbentuk. Keluar lalu masuk lagi. Kalau tetap begini, hubungi pengelola situs.
        </div>
      )}
    </div>
  );
}
