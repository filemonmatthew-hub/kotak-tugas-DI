'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import AssignmentCard from './AssignmentCard';
import { num, statusOf } from '@/lib/format';
import type { Assignment, Submission } from '@/lib/types';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Assignment[] | null>(null);
  const [subs, setSubs] = useState<Record<string, Submission>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const sb = supabase();
      const [a, s] = await Promise.all([
        sb.from('assignments').select('*').order('deadline', { ascending: true }),
        sb.from('submissions').select('*').eq('student_id', user.id),
      ]);
      if (!alive) return;
      if (a.error || s.error) {
        setError('Data tugas tidak bisa dimuat. Muat ulang halaman.');
        setItems([]);
        return;
      }
      const map: Record<string, Submission> = {};
      (s.data as Submission[]).forEach((x) => (map[x.assignment_id] = x));
      setSubs(map);
      setItems(a.data as Assignment[]);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const first = (profile?.full_name ?? '').split(' ')[0] || 'kamu';

  if (items === null) return <p className="muted mono">Memuat tugas…</p>;

  const rows = items.map((a) => ({ a, s: subs[a.id], st: statusOf(a, subs[a.id]) }));
  const pending = rows.filter((r) => r.st.k === 'open' || r.st.k === 'openlate');
  const rest = rows.filter((r) => !(r.st.k === 'open' || r.st.k === 'openlate')).reverse();
  const graded = rows.filter((r) => r.s && r.s.score != null);
  const avg = graded.length ? graded.reduce((t, r) => t + Number(r.s!.score), 0) / graded.length : null;

  return (
    <>
      {error && <div className="notice err">{error}</div>}
      <h1 className="page-title">
        Halo, <mark>{first}.</mark>
      </h1>
      <p className="lead">
        {pending.length
          ? `${pending.length} tugas menunggu kamu setor.`
          : rows.length
            ? 'Semua tugas yang terbuka sudah beres.'
            : 'Belum ada tugas dari dosen.'}
      </p>

      {rows.length > 0 && (
        <dl className="stats">
          <div className="stat hot">
            <dt>Perlu disetor</dt>
            <dd>{pending.length}</dd>
          </div>
          <div className="stat">
            <dt>Sudah disetor</dt>
            <dd>{rows.filter((r) => r.s).length}</dd>
          </div>
          <div className="stat">
            <dt>Sudah dinilai</dt>
            <dd>{graded.length}</dd>
          </div>
          <div className="stat">
            <dt>Rata-rata nilai</dt>
            <dd>{avg == null ? '—' : num(avg.toFixed(1))}</dd>
          </div>
        </dl>
      )}

      {rows.length === 0 && (
        <div className="empty" style={{ marginTop: 40 }}>
          <div className="empty-art" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <h3>Belum ada tugas</h3>
          <p>Begitu dosen membuat tugas, kartunya muncul di sini lengkap dengan tenggatnya.</p>
        </div>
      )}

      {pending.length > 0 && (
        <>
          <div className="sec-head">
            <h2>Perlu disetor</h2>
            <span className="count">{pending.length} tugas</span>
          </div>
          <div className="grid">
            {pending.map((r) => (
              <AssignmentCard key={r.a.id} a={r.a} status={r.st} />
            ))}
          </div>
        </>
      )}

      {rest.length > 0 && (
        <>
          <div className="sec-head">
            <h2>Riwayat</h2>
            <span className="count">{rest.length} tugas</span>
          </div>
          <div className="grid">
            {rest.map((r) => (
              <AssignmentCard key={r.a.id} a={r.a} status={r.st} score={r.s?.score ?? null} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
