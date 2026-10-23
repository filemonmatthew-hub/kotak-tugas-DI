'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import SubmitPanel from './SubmitPanel';
import FilePreview from './FilePreview';
import { Sticker, whenLine } from './AssignmentCard';
import { colorOf, fmt, isLate, num, safeUrl, sizeLabel, statusOf } from '@/lib/format';
import type { Assignment, Submission } from '@/lib/types';

export default function StudentAssignment({ id }: { id: string }) {
  const { user } = useAuth();
  const [a, setA] = useState<Assignment | null | undefined>(undefined);
  const [sub, setSub] = useState<Submission | null>(null);
  const [url, setUrl] = useState('');
  const [flash, setFlash] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const sb = supabase();
    const [ar, sr] = await Promise.all([
      sb.from('assignments').select('*').eq('id', id).maybeSingle(),
      sb.from('submissions').select('*').eq('assignment_id', id).eq('student_id', user.id).maybeSingle(),
    ]);
    setA((ar.data as Assignment | null) ?? null);
    const s = (sr.data as Submission | null) ?? null;
    setSub(s);
    if (s?.file_path) {
      const signed = await sb.storage.from('submissions').createSignedUrl(s.file_path, 3600);
      setUrl(signed.data?.signedUrl ?? '');
    } else setUrl('');
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user || a === undefined) return <p className="muted mono">Memuat tugas…</p>;
  if (a === null) {
    return (
      <div className="empty" style={{ marginTop: 32 }}>
        <h3>Tugas tidak ditemukan</h3>
        <p>Tugas ini mungkin sudah dihapus oleh dosen.</p>
        <Link href="/dashboard" className="btn">
          ← Semua tugas
        </Link>
      </div>
    );
  }

  const st = statusOf(a, sub);
  const late = isLate(a, sub);
  const graded = !!sub && sub.score != null;
  const open = Date.now() <= new Date(a.deadline).getTime() || a.allow_late;

  return (
    <>
      <div className="crumb">
        <Link href="/dashboard" className="btn btn-sm">
          ← Semua tugas
        </Link>
      </div>
      {flash && <div className="notice ok" role="status" style={{ marginTop: 20 }}>{flash}</div>}

      <div className="split">
        <div className="stack">
          <div className={`poster-head c-${colorOf(a.id)}`}>
            <span className="tag">{a.course || 'Tugas'}</span>
            <h1>{a.title}</h1>
          </div>
          {a.description && (
            <div className="card card-pad">
              <p className="label" style={{ marginBottom: 10 }}>Brief dari dosen</p>
              <p className="brief">{a.description}</p>
            </div>
          )}
          <dl className="card card-pad meta-list">
            <div>
              <dt>Tenggat</dt>
              <dd>
                {fmt(a.deadline)}
                <br />
                <span className="muted" style={{ fontWeight: 500 }}>{whenLine(a)}</span>
              </dd>
            </div>
            <div>
              <dt>Nilai maksimal</dt>
              <dd>{num(a.max_score)}</dd>
            </div>
            <div>
              <dt>Setelah tenggat</dt>
              <dd>{a.allow_late ? 'Masih diterima, ditandai terlambat' : 'Pengumpulan ditutup'}</dd>
            </div>
            <div>
              <dt>Statusmu</dt>
              <dd>
                <Sticker k={st.k} label={st.label} />
              </dd>
            </div>
          </dl>
        </div>

        <div className="stack">
          {graded && sub && (
            <div className="grade-card">
              <p className="label" style={{ marginBottom: 8 }}>Nilaimu</p>
              <p className="big">
                {num(sub.score as number)} <span>/ {num(a.max_score)}</span>
              </p>
              {sub.feedback && <blockquote>{sub.feedback}</blockquote>}
            </div>
          )}

          {sub && (
            <div className="card">
              <div style={{ aspectRatio: '16 / 10', borderBottom: '2px solid var(--ink)', overflow: 'hidden', background: 'var(--line)' }}>
                <FilePreview fileName={sub.file_name} url={url} link={safeUrl(sub.link_url) || null} />
              </div>
              <div className="card-pad stack" style={{ gap: 10 }}>
                <span className={`stamp${late ? ' late' : ''}`} style={{ alignSelf: 'flex-start' }}>
                  Diterima {fmt(sub.submitted_at)}
                  {late ? ' · terlambat' : ''}
                </span>
                {sub.file_name && (
                  <p>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer"><b>{sub.file_name}</b></a>
                    ) : (
                      <b>{sub.file_name}</b>
                    )}{' '}
                    <span className="muted">{sizeLabel(sub.file_size)}</span>
                  </p>
                )}
                {safeUrl(sub.link_url) && (
                  <p style={{ overflowWrap: 'anywhere' }}>
                    <a href={sub.link_url as string} target="_blank" rel="noopener noreferrer">{sub.link_url}</a>
                  </p>
                )}
                {sub.note && <p className="scard-note">{sub.note}</p>}
              </div>
            </div>
          )}

          {graded ? (
            <p className="muted">Tugas sudah dinilai, jadi pengumpulan dikunci.</p>
          ) : open ? (
            <SubmitPanel
              key={sub?.id ?? 'baru'}
              assignment={a}
              submission={sub}
              userId={user.id}
              onDone={() => {
                setFlash('Tugas diterima. Kamu masih bisa mengumpulkan ulang selama belum dinilai.');
                load();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <div className="notice err">Pengumpulan ditutup sejak {fmt(a.deadline)}.</div>
          )}
        </div>
      </div>
    </>
  );
}
