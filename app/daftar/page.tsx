'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import AuthLayout from '@/components/AuthLayout';

function pesan(m: string): string {
  if (/already registered|already been registered/i.test(m)) return 'Email ini sudah terdaftar. Silakan masuk.';
  if (/password/i.test(m)) return 'Kata sandi minimal 6 karakter.';
  if (/rate limit/i.test(m)) return 'Terlalu banyak percobaan. Tunggu beberapa menit.';
  return 'Pendaftaran gagal. Periksa isian lalu coba lagi.';
}

export default function DaftarPage() {
  const router = useRouter();
  const { user, loading, reloadProfile } = useAuth();
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!nama.trim() || !nim.trim()) {
      setError('Isi nama lengkap dan NIM.');
      return;
    }
    setBusy(true);
    const { data, error: err } = await supabase().auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: nama.trim(), nim: nim.trim() } },
    });
    if (err) {
      setBusy(false);
      setError(pesan(err.message));
      return;
    }
    if (data.session) {
      await reloadProfile();
      router.replace('/dashboard');
    } else {
      setBusy(false);
      setSent(true);
    }
  }

  return (
    <AuthLayout
      color="pink"
      headline={
        <>
          Bikin akun, <span className="hl">setor karya.</span>
        </>
      }
      sub="Cukup nama, NIM, dan email kampus atau pribadi. Dosen akan melihat nama dan NIM ini di daftar pengumpulan."
    >
      <h2>Daftar</h2>
      <p className="muted" style={{ marginBottom: 26 }}>
        Akun baru otomatis berperan sebagai mahasiswa.
      </p>
      {error && <div className="notice err" role="alert">{error}</div>}
      {sent ? (
        <div className="notice ok" role="status">
          Akun dibuat. Kami mengirim email konfirmasi ke {email}. Buka emailnya, lalu <Link href="/login">masuk</Link>.
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="cols">
            <div className="field">
              <label htmlFor="nama">Nama lengkap</label>
              <input id="nama" type="text" autoComplete="name" maxLength={80} required value={nama} onChange={(e) => setNama(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="nim">NIM</label>
              <input id="nim" type="text" inputMode="numeric" maxLength={30} required value={nim} onChange={(e) => setNim(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Kata sandi</label>
            <input id="password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
            <small>Minimal 6 karakter.</small>
          </div>
          <button type="submit" className="btn btn-ink btn-block" disabled={busy}>
            {busy ? 'Membuat akun…' : 'Buat akun'}
          </button>
        </form>
      )}
      <p className="alt">
        Sudah punya akun? <Link href="/login">Masuk</Link>
      </p>
    </AuthLayout>
  );
}
