'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import AuthLayout from '@/components/AuthLayout';

function pesan(m: string): string {
  if (/invalid login/i.test(m)) return 'Email atau kata sandi salah.';
  if (/not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Cek kotak masukmu lalu coba lagi.';
  return 'Tidak bisa masuk sekarang. Coba lagi sebentar.';
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, reloadProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setBusy(false);
      setError(pesan(err.message));
      return;
    }
    await reloadProfile();
    router.replace('/dashboard');
  }

  return (
    <AuthLayout
      color="blue"
      headline={
        <>
          Selamat datang <span className="hl">kembali.</span>
        </>
      }
      sub="Masuk untuk melihat tugas, mengumpulkan karya, atau memeriksa pengumpulan kelasmu."
    >
      <h2>Masuk</h2>
      <p className="muted" style={{ marginBottom: 26 }}>
        Pakai email dan kata sandi akunmu.
      </p>
      {error && <div className="notice err" role="alert">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Kata sandi</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-ink btn-block" disabled={busy}>
          {busy ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>
      <p className="alt">
        Belum punya akun? <Link href="/daftar">Daftar di sini</Link>
      </p>
    </AuthLayout>
  );
}
