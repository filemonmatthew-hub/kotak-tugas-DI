'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import AssignmentCard from './AssignmentCard';
import type { Assignment } from '@/lib/types';

interface Counts {
  sent: number;
  graded: number;
}

function Bar({ students, sent, graded }: { students: number; sent: number; graded: number }) {
  if (students <= 0) return null;
  const n = Math.min(students, 24);
  const g = Math.round((graded / students) * n);
  const s = Math.max(Math.round((sent / students) * n) - g, 0);
  return (
    <div className="progress" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={i < g ? 'graded' : i < g + s ? 'sent' : ''} />
      ))}
    </div>
  );
}

export default function LecturerDashboard() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Assignment[] | null>(null);
  const [counts, setCounts] = useState<Record<string, Counts>>({});
  const [students, setStudents] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const sb = supabase();
      const [a, s, p] = await Promise.all([
        sb.from('assignments').select('*').order('deadline', { ascending: false }),
        sb.from('submissions').select('assignment_id, score'),
        sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'mahasiswa'),
      ]);
      if (!alive) return;
      if (a.error || s.error) {
        setError('Data tugas tidak bisa dimuat. Muat ulang halaman.');
        setItems([]);
        return;
      }
      const map: Record<string, Counts> = {};
      (s.data as { assignment_id: string; score: number | null }[]).forEach((x) => {
        const c = (map[x.assignment_id] ??= { sent: 0, graded: 0 });
        c.sent += 1;
        if (x.score != null) c.graded += 1;
      });
      setCounts(map);
      setStudents(p.count ?? 0);
      setItems(a.data as Assignment[]);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const first = (profile?.full_name ?? '').split(' ')[0] || 'Dosen';

  if (items === null) return <p className="muted mono">Memuat tugas…</p>;

  const toGrade = Object.values(counts).reduce((t, c) => t + (c.sent - c.graded), 0);
  const active = items.filter((a) => new Date(a.deadline).getTime() > Date.now()).length;

  return (
    <>
      {error && <div className="notice err">{error}</div>}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">
            Halo, <mark>{first}.</mark>
          </h1>
          <p className="lead">
            {toGrade ? `${toGrade} karya menunggu penilaianmu.` : items.length ? 'Tidak ada karya yang menunggu dinilai.' : 'Buat tugas pertamamu untuk mulai.'}
          </p>
        </div>
        <Link href="/tugas/baru" className="btn btn-blue">
          + Buat tugas
        </Link>
      </div>

      <dl className="stats">
        <div className={`stat ${toGrade ? 'hot' : ''}`}>
          <dt>Menunggu dinilai</dt>
          <dd>{toGrade}</dd>
        </div>
        <div className="stat">
          <dt>Tugas aktif</dt>
          <dd>{active}</dd>
        </div>
        <div className="stat">
          <dt>Semua tugas</dt>
          <dd>{items.length}</dd>
        </div>
        <div className="stat">
          <dt>Mahasiswa terdaftar</dt>
          <dd>{students}</dd>
        </div>
      </dl>

      <div className="sec-head">
        <h2>Tugas kelas</h2>
        <span className="count">{items.length} tugas</span>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-art" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <h3>Belum ada tugas</h3>
          <p>Buat tugas dengan brief, tenggat, dan nilai maksimal. Mahasiswa yang sudah mendaftar langsung bisa melihatnya.</p>
          <Link href="/tugas/baru" className="btn btn-blue">
            + Buat tugas pertama
          </Link>
        </div>
      ) : (
        <div className="grid">
          {items.map((a) => {
            const c = counts[a.id] ?? { sent: 0, graded: 0 };
            const need = c.sent - c.graded;
            return (
              <AssignmentCard
                key={a.id}
                a={a}
                status={
                  need > 0
                    ? { k: 'late', label: `${need} perlu dinilai` }
                    : c.sent > 0
                      ? { k: 'graded', label: 'Semua dinilai' }
                      : { k: 'open', label: 'Belum ada karya' }
                }
                extra={
                  <div className="stack" style={{ gap: 8 }}>
                    <Bar students={students} sent={c.sent} graded={c.graded} />
                    <span className="mono" style={{ fontSize: 12.5 }}>
                      {c.sent} dari {students} mahasiswa menyetor
                    </span>
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </>
  );
}
