'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { defaultDeadlineInput, fromWibInput, toWibInput } from '@/lib/format';
import type { Assignment } from '@/lib/types';

export default function AssignmentForm({ id }: { id?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(!id);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState(defaultDeadlineInput());
  const [max, setMax] = useState('100');
  const [late, setLate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    supabase()
      .from('assignments')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        const a = data as Assignment | null;
        if (a) {
          setTitle(a.title);
          setCourse(a.course ?? '');
          setDesc(a.description ?? '');
          setDeadline(toWibInput(a.deadline));
          setMax(String(a.max_score));
          setLate(a.allow_late);
        } else setError('Tugas tidak ditemukan.');
        setLoaded(true);
      });
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const iso = fromWibInput(deadline);
    const m = Number(max.replace(',', '.'));
    if (!title.trim()) return setError('Isi judul tugas.');
    if (!iso) return setError('Pilih tenggat pengumpulan.');
    if (!(m > 0)) return setError('Nilai maksimal harus lebih dari 0.');
    setBusy(true);
    const body = { title: title.trim(), course: course.trim() || null, description: desc.trim() || null, deadline: iso, max_score: m, allow_late: late };
    const res = id
      ? await supabase().from('assignments').update(body).eq('id', id).select('id').single()
      : await supabase().from('assignments').insert({ ...body, created_by: user?.id }).select('id').single();
    setBusy(false);
    if (res.error || !res.data) {
      setError('Tugas gagal disimpan. Pastikan akunmu berperan dosen.');
      return;
    }
    router.replace(`/tugas/${(res.data as { id: string }).id}`);
  }

  if (!loaded) return <p className="muted mono">Memuat…</p>;

  return (
    <>
      <div className="crumb">
        <Link href={id ? `/tugas/${id}` : '/dashboard'} className="btn btn-sm">
          ← Kembali
        </Link>
      </div>
      <h1 className="page-title">
        {id ? (
          <>Ubah <mark>tugas.</mark></>
        ) : (
          <>Tugas <mark>baru.</mark></>
        )}
      </h1>
      <form className="card card-pad" style={{ marginTop: 28, maxWidth: 760 }} onSubmit={submit}>
        {error && <div className="notice err" role="alert">{error}</div>}
        <div className="field">
          <label htmlFor="title">Judul tugas</label>
          <input id="title" type="text" maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Poster Tipografi Ekspresif" />
        </div>
        <div className="field">
          <label htmlFor="course">Mata kuliah (opsional)</label>
          <input id="course" type="text" maxLength={80} value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Contoh: Desain Komunikasi Visual 2" />
        </div>
        <div className="field">
          <label htmlFor="desc">Brief pengerjaan</label>
          <textarea id="desc" rows={6} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Apa yang harus dibuat, ukuran dan format berkas, kriteria penilaian" />
        </div>
        <div className="cols">
          <div className="field">
            <label htmlFor="deadline">Tenggat (WIB)</label>
            <input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="max">Nilai maksimal</label>
            <input id="max" type="text" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} />
          </div>
        </div>
        <label className="check" style={{ marginBottom: 24 }}>
          <input type="checkbox" checked={late} onChange={(e) => setLate(e.target.checked)} />
          <span>Terima pengumpulan setelah tenggat. Karya yang masuk ditandai terlambat.</span>
        </label>
        <button type="submit" className="btn btn-blue" disabled={busy}>
          {busy ? 'Menyimpan…' : 'Simpan tugas'}
        </button>
      </form>
    </>
  );
}
