'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FilePreview from './FilePreview';
import { Sticker, whenLine } from './AssignmentCard';
import { colorOf, csvCell, fmt, initials, isLate, linkKind, num, safeUrl, sizeLabel, PALETTE } from '@/lib/format';
import type { Assignment, Profile, Submission } from '@/lib/types';

type Filter = 'semua' | 'dinilai' | 'belum' | 'terlambat' | 'tidak';

interface Entry {
  p: Profile;
  s: Submission | null;
}

function GradeBox({ a, s, onSaved }: { a: Assignment; s: Submission; onSaved: (n: Submission) => void }) {
  const [score, setScore] = useState(s.score != null ? String(s.score) : '');
  const [fb, setFb] = useState(s.feedback ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);

  async function save() {
    setMsg(null);
    const raw = score.trim().replace(',', '.');
    const n = raw === '' ? null : Number(raw);
    if (n != null && (isNaN(n) || n < 0 || n > a.max_score)) {
      setMsg({ t: 'err', m: `Nilai harus antara 0 dan ${num(a.max_score)}.` });
      return;
    }
    if (n == null && !fb.trim()) {
      setMsg({ t: 'err', m: 'Isi nilai atau umpan balik dulu.' });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase()
      .from('submissions')
      .update({ score: n, feedback: fb.trim() || null })
      .eq('id', s.id)
      .select('*')
      .single();
    setBusy(false);
    if (error || !data) {
      setMsg({ t: 'err', m: 'Gagal menyimpan nilai. Coba lagi.' });
      return;
    }
    onSaved(data as Submission);
    setMsg({ t: 'ok', m: 'Tersimpan.' });
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="grade-row">
        <input type="text" inputMode="decimal" aria-label="Nilai" placeholder={`/ ${num(a.max_score)}`} value={score} onChange={(e) => setScore(e.target.value)} />
        <textarea aria-label="Umpan balik" rows={2} placeholder="Umpan balik untuk mahasiswa" value={fb} onChange={(e) => setFb(e.target.value)} />
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="mono" style={{ fontSize: 12.5, color: msg?.t === 'err' ? '#c4161c' : 'var(--mute)' }} role="status">
          {msg ? msg.m : s.graded_at ? `Dinilai ${fmt(s.graded_at)}` : 'Belum dinilai'}
        </span>
        <button type="button" className="btn btn-sm btn-sun" onClick={save} disabled={busy}>
          {busy ? 'Menyimpan…' : s.graded_at ? 'Perbarui' : 'Simpan nilai'}
        </button>
      </div>
    </div>
  );
}

export default function LecturerAssignment({ id }: { id: string }) {
  const router = useRouter();
  const [a, setA] = useState<Assignment | null | undefined>(undefined);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>('semua');
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const sb = supabase();
    const [ar, sr, pr] = await Promise.all([
      sb.from('assignments').select('*').eq('id', id).maybeSingle(),
      sb.from('submissions').select('*').eq('assignment_id', id),
      sb.from('profiles').select('id, full_name, nim, role').eq('role', 'mahasiswa').order('full_name'),
    ]);
    if (ar.error || sr.error || pr.error) setError('Sebagian data tidak bisa dimuat. Muat ulang halaman.');
    setA((ar.data as Assignment | null) ?? null);
    const subs = new Map<string, Submission>();
    ((sr.data as Submission[]) ?? []).forEach((x) => subs.set(x.student_id, x));
    const list: Entry[] = ((pr.data as Profile[]) ?? []).map((p) => ({ p, s: subs.get(p.id) ?? null }));
    setEntries(list);

    const paths = list.map((e) => e.s?.file_path).filter((x): x is string => !!x);
    if (paths.length) {
      const signed = await sb.storage.from('submissions').createSignedUrls(paths, 3600);
      const m: Record<string, string> = {};
      (signed.data ?? []).forEach((x) => {
        if (x.path && x.signedUrl) m[x.path] = x.signedUrl;
      });
      setUrls(m);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const sent = entries.filter((e) => e.s);
    const graded = sent.filter((e) => e.s!.score != null);
    const late = a ? sent.filter((e) => isLate(a, e.s)) : [];
    const avg = graded.length ? graded.reduce((t, e) => t + Number(e.s!.score), 0) / graded.length : null;
    return { sent: sent.length, graded: graded.length, late: late.length, avg };
  }, [entries, a]);

  if (a === undefined) return <p className="muted mono">Memuat tugas…</p>;
  if (a === null) {
    return (
      <div className="empty" style={{ marginTop: 32 }}>
        <h3>Tugas tidak ditemukan</h3>
        <p>Tugas ini mungkin sudah dihapus.</p>
        <Link href="/dashboard" className="btn">
          ← Semua tugas
        </Link>
      </div>
    );
  }
  const asg = a;

  const shown = entries.filter((e) => {
    if (filter === 'tidak') return !e.s;
    if (!e.s) return false;
    if (filter === 'dinilai') return e.s.score != null;
    if (filter === 'belum') return e.s.score == null;
    if (filter === 'terlambat') return isLate(asg, e.s);
    return true;
  });
  const sentList = shown.filter((e) => e.s);
  const missing = entries.filter((e) => !e.s);

  function exportCsv() {
    const rows = [['Nama', 'NIM', 'Status', 'Dikumpulkan', 'Nilai', 'Umpan balik']];
    entries.forEach(({ p, s }) =>
      rows.push([
        p.full_name,
        p.nim ?? '',
        s ? (isLate(asg, s) ? 'Terlambat' : 'Terkumpul') : 'Belum',
        s ? fmt(s.submitted_at) : '',
        s && s.score != null ? String(s.score) : '',
        s?.feedback ?? '',
      ])
    );
    const csv = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    const slug = asg.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tugas';
    link.href = url;
    link.download = `nilai-${slug}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function remove() {
    const { error: err } = await supabase().from('assignments').delete().eq('id', asg.id);
    if (err) {
      setError('Tugas gagal dihapus. Coba lagi.');
      setConfirmDel(false);
      return;
    }
    router.replace('/dashboard');
  }

  function patch(n: Submission) {
    setEntries((list) => list.map((e) => (e.s && e.s.id === n.id ? { ...e, s: n } : e)));
  }

  const tabs: { k: Filter; label: string; n: number }[] = [
    { k: 'semua', label: 'Semua karya', n: stats.sent },
    { k: 'belum', label: 'Perlu dinilai', n: stats.sent - stats.graded },
    { k: 'dinilai', label: 'Sudah dinilai', n: stats.graded },
    { k: 'terlambat', label: 'Terlambat', n: stats.late },
    { k: 'tidak', label: 'Belum setor', n: missing.length },
  ];

  return (
    <>
      <div className="crumb">
        <Link href="/dashboard" className="btn btn-sm">
          ← Semua tugas
        </Link>
      </div>
      {error && <div className="notice err" style={{ marginTop: 20 }}>{error}</div>}

      <div className={`poster-head c-${colorOf(asg.id)}`} style={{ marginTop: 22 }}>
        <span className="tag">{asg.course || 'Tugas'}</span>
        <h1>{asg.title}</h1>
        <p className="mono" style={{ marginTop: 16, position: 'relative', zIndex: 1, fontSize: 14 }}>
          Tenggat {fmt(asg.deadline)} · {whenLine(asg)} · nilai maks {num(asg.max_score)} · {asg.allow_late ? 'terlambat diterima' : 'tutup setelah tenggat'}
        </p>
        <div className="row" style={{ marginTop: 20, position: 'relative', zIndex: 1 }}>
          <Link href={`/tugas/${asg.id}/ubah`} className="btn btn-sm">
            Ubah tugas
          </Link>
          <button type="button" className="btn btn-sm" onClick={exportCsv}>
            Unduh nilai (CSV)
          </button>
          {confirmDel ? (
            <>
              <button type="button" className="btn btn-sm btn-danger" onClick={remove}>
                Ya, hapus beserta semua karya
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setConfirmDel(false)}>
                Batal
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-sm btn-danger" onClick={() => setConfirmDel(true)}>
              Hapus
            </button>
          )}
        </div>
      </div>

      {asg.description && (
        <div className="card card-pad" style={{ marginTop: 28 }}>
          <p className="label" style={{ marginBottom: 10 }}>Brief</p>
          <p className="brief">{asg.description}</p>
        </div>
      )}

      <dl className="stats">
        <div className="stat hot">
          <dt>Terkumpul</dt>
          <dd>
            {stats.sent}/{entries.length}
          </dd>
        </div>
        <div className="stat">
          <dt>Perlu dinilai</dt>
          <dd>{stats.sent - stats.graded}</dd>
        </div>
        <div className="stat">
          <dt>Terlambat</dt>
          <dd>{stats.late}</dd>
        </div>
        <div className="stat">
          <dt>Rata-rata</dt>
          <dd>{stats.avg == null ? '—' : num(stats.avg.toFixed(1))}</dd>
        </div>
      </dl>

      <div className="tabs" role="tablist" aria-label="Saring karya">
        {tabs.map((t) => (
          <button key={t.k} type="button" role="tab" aria-selected={filter === t.k} className={`tab${filter === t.k ? ' on' : ''}`} onClick={() => setFilter(t.k)}>
            {t.label}
            <span>{t.n}</span>
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="empty" style={{ marginTop: 24 }}>
          <div className="empty-art" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <h3>Belum ada mahasiswa terdaftar</h3>
          <p>Bagikan alamat situs ini ke kelas. Mahasiswa daftar sendiri, lalu karyanya muncul di galeri ini.</p>
        </div>
      ) : filter === 'tidak' ? (
        missing.length ? (
          <ul className="pending-list">
            {missing.map((e) => (
              <li key={e.p.id}>
                {e.p.full_name} <span className="mono muted">{e.p.nim}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty" style={{ marginTop: 24 }}><h3>Semua sudah menyetor</h3></div>
        )
      ) : sentList.length === 0 ? (
        <div className="empty" style={{ marginTop: 24 }}>
          <h3>Tidak ada karya di sini</h3>
          <p>Belum ada karya yang cocok dengan penyaring ini.</p>
        </div>
      ) : (
        <div className="gallery">
          {sentList.map(({ p, s }, i) => {
            const sub = s as Submission;
            const late = isLate(asg, sub);
            const url = sub.file_path ? urls[sub.file_path] : undefined;
            const link = safeUrl(sub.link_url);
            return (
              <article key={sub.id} className={`scard c-${PALETTE[i % PALETTE.length]}`}>
                <a
                  className="scard-prev"
                  href={url || link || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Buka karya ${p.full_name}`}
                >
                  <FilePreview fileName={sub.file_name} url={url} link={link || null} />
                  <span className="btn btn-sm open">Buka ↗</span>
                </a>
                <div className="scard-body">
                  <div className="scard-who">
                    <div className="row" style={{ flexWrap: 'nowrap', minWidth: 0 }}>
                      <span className="avatar">{initials(p.full_name)}</span>
                      <div style={{ minWidth: 0 }}>
                        <p className="scard-name">{p.full_name}</p>
                        <p className="scard-nim">{p.nim}</p>
                      </div>
                    </div>
                    <Sticker k={sub.score != null ? 'graded' : late ? 'late' : 'sent'} label={sub.score != null ? 'Dinilai' : late ? 'Terlambat' : 'Terkumpul'} />
                  </div>
                  <p className="mono" style={{ fontSize: 12.5 }}>
                    {fmt(sub.submitted_at)}
                    {late ? ' · lewat tenggat' : ''}
                  </p>
                  {sub.file_name && (
                    <p style={{ fontSize: 14, overflowWrap: 'anywhere' }}>
                      {url ? <a href={url} target="_blank" rel="noopener noreferrer">{sub.file_name}</a> : sub.file_name}{' '}
                      <span className="muted">{sizeLabel(sub.file_size)}</span>
                    </p>
                  )}
                  {link && (
                    <p style={{ fontSize: 14, overflowWrap: 'anywhere' }}>
                      <a href={link} target="_blank" rel="noopener noreferrer">{linkKind(link)} ↗</a>
                    </p>
                  )}
                  {sub.note && <p className="scard-note">{sub.note}</p>}
                  <GradeBox key={sub.id + (sub.graded_at ?? '')} a={asg} s={sub} onSaved={patch} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
