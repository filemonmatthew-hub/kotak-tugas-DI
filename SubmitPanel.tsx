'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Assignment, Submission } from '@/lib/types';
import { ACCEPT, MAX_FILE_BYTES, extOf, safeFileName, safeUrl, sizeLabel } from '@/lib/format';

function readable(err: unknown): string {
  const m = ((err as { message?: string })?.message ?? '').toString();
  if (/row-level security|violates/i.test(m)) return 'Pengumpulan ditutup atau akunmu tidak punya izin untuk tugas ini.';
  if (/exceeded the maximum|too large|payload/i.test(m)) return 'Berkas melebihi batas ukuran 20 MB.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Koneksi terputus. Periksa internetmu lalu coba lagi.';
  return m || 'Gagal menyimpan. Coba lagi.';
}

export default function SubmitPanel({
  assignment,
  submission,
  userId,
  onDone,
}: {
  assignment: Assignment;
  submission: Submission | null;
  userId: string;
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [link, setLink] = useState(submission?.link_url ?? '');
  const [note, setNote] = useState(submission?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);

  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const u = URL.createObjectURL(file);
      setPreview(u);
      return () => URL.revokeObjectURL(u);
    }
    setPreview('');
    return undefined;
  }, [file]);

  function pick(f: File | null | undefined) {
    if (!f) return;
    const ext = extOf(f.name);
    if (!ACCEPT.split(',').includes('.' + ext)) {
      setError(`Format .${ext || '?'} belum didukung. Pakai gambar, PDF, ZIP, FIG, MP4, atau tempel tautan.`);
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError('Berkas lebih dari 20 MB. Kecilkan ukurannya, atau unggah ke Drive dan tempel tautannya.');
      return;
    }
    setError('');
    setFile(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const l = link.trim();
    if (l && !safeUrl(l)) {
      setError('Tautan harus diawali http:// atau https://.');
      return;
    }
    if (!file && !submission?.file_path && !l) {
      setError('Pilih berkas atau tempel tautan dulu.');
      return;
    }
    setBusy(true);
    try {
      const sb = supabase();
      const patch: Record<string, unknown> = { link_url: l || null, note: note.trim() || null };
      if (file) {
        const path = `${assignment.id}/${userId}/${Date.now()}-${safeFileName(file.name)}`;
        const up = await sb.storage.from('submissions').upload(path, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });
        if (up.error) throw up.error;
        patch.file_path = path;
        patch.file_name = file.name;
        patch.file_size = file.size;
      }
      if (submission) {
        const { error: err } = await sb.from('submissions').update(patch).eq('id', submission.id);
        if (err) throw err;
      } else {
        const { error: err } = await sb.from('submissions').insert({ assignment_id: assignment.id, student_id: userId, ...patch });
        if (err) throw err;
      }
      setFile(null);
      onDone();
    } catch (err) {
      setError(readable(err));
    } finally {
      setBusy(false);
    }
  }

  const late = Date.now() > new Date(assignment.deadline).getTime();

  return (
    <form className="card card-pad" onSubmit={submit}>
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6 }}>{submission ? 'Kumpulkan ulang' : 'Setor karyamu'}</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        {submission ? 'Karya baru menggantikan yang lama selama belum dinilai.' : 'Unggah berkas, tempel tautan, atau dua-duanya.'}
      </p>
      {late && <div className="notice err">Tenggat sudah lewat. Pengumpulanmu akan ditandai terlambat.</div>}
      {error && <div className="notice err" role="alert">{error}</div>}

      <label
        className={`drop${file ? ' has' : ''}${over ? ' over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          pick(e.dataTransfer.files?.[0]);
        }}
      >
        <input className="sr" type="file" accept={ACCEPT} onChange={(e) => pick(e.target.files?.[0])} />
        {file ? (
          <>
            <div className="drop-prev">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Pratinjau berkas yang dipilih" />
              ) : (
                <div className="file-tile c-lilac">
                  <b>{extOf(file.name) || 'file'}</b>
                </div>
              )}
            </div>
            <div className="drop-info">
              <span className="drop-s">{file.name}</span>
              <span className="drop-h">{sizeLabel(file.size)} · klik untuk mengganti</span>
            </div>
          </>
        ) : (
          <>
            <span className="drop-t">Pilih berkas atau seret ke sini</span>
            <span className="drop-h">Gambar, PDF, ZIP, FIG, PSD, AI, MP4, PPTX · maks 20 MB</span>
            {submission?.file_name && <span className="drop-s">Saat ini: {submission.file_name}</span>}
          </>
        )}
      </label>

      <div className="field">
        <label htmlFor="link">Tautan karya (opsional)</label>
        <input id="link" type="url" inputMode="url" placeholder="https://www.figma.com/…" value={link} onChange={(e) => setLink(e.target.value)} />
        <small>Figma, Behance, Dribbble, Google Drive, atau tautan lain. Pastikan aksesnya terbuka untuk dosen.</small>
      </div>
      <div className="field">
        <label htmlFor="note">Catatan untuk dosen (opsional)</label>
        <textarea id="note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Konsep, kendala, atau hal yang ingin dikritik" />
      </div>
      <button type="submit" className="btn btn-blue btn-block" disabled={busy}>
        {busy ? 'Mengunggah…' : submission ? 'Kumpulkan ulang' : 'Setor sekarang'}
      </button>
    </form>
  );
}
