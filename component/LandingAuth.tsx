'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';

export function NavActions() {
  const { user, loading } = useAuth();
  if (loading) return <span className="row" style={{ minHeight: 46 }} />;
  return user ? (
    <Link href="/dashboard" className="btn btn-ink btn-sm">
      Buka dashboard
    </Link>
  ) : (
    <span className="row">
      <Link href="/login" className="btn btn-sm">
        Masuk
      </Link>
      <Link href="/daftar" className="btn btn-ink btn-sm">
        Daftar
      </Link>
    </span>
  );
}

export function HeroActions({ tone = 'ink' }: { tone?: 'ink' | 'sun' }) {
  const { user } = useAuth();
  const main = tone === 'sun' ? 'btn btn-sun' : 'btn btn-ink';
  return user ? (
    <div className="cta-row">
      <Link href="/dashboard" className={main}>
        Buka dashboard →
      </Link>
    </div>
  ) : (
    <div className="cta-row">
      <Link href="/daftar" className={main}>
        {tone === 'sun' ? 'Buat akun' : 'Daftar sekarang'} →
      </Link>
      {tone === 'ink' && (
        <Link href="/login" className="btn">
          Sudah punya akun
        </Link>
      )}
    </div>
  );
}
