import type { Assignment, StatusKey, Submission } from './types';

const WIB = 7 * 3600 * 1000;

const dtf = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function fmt(iso: string): string {
  return dtf.format(new Date(iso)) + ' WIB';
}

export function span(ms: number): string {
  const d = Math.abs(ms);
  const m = Math.floor(d / 60000);
  if (m < 60) return Math.max(m, 1) + ' menit';
  const h = Math.floor(m / 60);
  if (h < 48) return h + ' jam';
  return Math.floor(h / 24) + ' hari';
}

export function deadlineLine(a: Assignment): string {
  const diff = new Date(a.deadline).getTime() - Date.now();
  return 'Tenggat ' + fmt(a.deadline) + ' · ' + (diff > 0 ? 'sisa ' + span(diff) : 'lewat ' + span(diff));
}

/** ISO -> nilai untuk <input type="datetime-local"> dalam jam WIB */
export function toWibInput(iso: string): string {
  return new Date(new Date(iso).getTime() + WIB).toISOString().slice(0, 16);
}

/** nilai <input type="datetime-local"> yang dimaksud sebagai jam WIB -> ISO */
export function fromWibInput(v: string): string | null {
  const t = Date.parse(v + ':00+07:00');
  return isNaN(t) ? null : new Date(t).toISOString();
}

export function defaultDeadlineInput(): string {
  const d = new Date(Date.now() + WIB + 7 * 864e5);
  d.setUTCHours(23, 59, 0, 0);
  return d.toISOString().slice(0, 16);
}

export function sizeLabel(b: number | null | undefined): string {
  if (!b) return '';
  return b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1).replace('.', ',') + ' MB';
}

export function num(n: number | string): string {
  return String(n).replace('.', ',');
}

export function isLate(a: Assignment, s: Submission | undefined | null): boolean {
  return !!s && new Date(s.submitted_at).getTime() > new Date(a.deadline).getTime();
}

export function statusOf(a: Assignment, s: Submission | undefined | null): { k: StatusKey; label: string } {
  if (s && s.score != null) return { k: 'graded', label: 'Dinilai' };
  if (s) return isLate(a, s) ? { k: 'late', label: 'Terlambat' } : { k: 'sent', label: 'Terkumpul' };
  if (Date.now() > new Date(a.deadline).getTime()) {
    return a.allow_late ? { k: 'openlate', label: 'Boleh terlambat' } : { k: 'closed', label: 'Ditutup' };
  }
  return { k: 'open', label: 'Belum dikumpulkan' };
}

export function safeUrl(u: string | null | undefined): string {
  return u && /^https?:\/\//i.test(u) ? u : '';
}

export function csvCell(v: unknown): string {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

/* ---------- tambahan untuk tampilan ---------- */
export const PALETTE = ['blue', 'pink', 'sun', 'mint', 'orange', 'lilac'] as const;

/** Warna tetap untuk satu tugas, diturunkan dari id-nya. */
export function colorOf(id: string): (typeof PALETTE)[number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function extOf(name: string | null | undefined): string {
  const m = /\.([A-Za-z0-9]+)$/.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

export function isImageName(name: string | null | undefined): boolean {
  return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extOf(name));
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function linkKind(url: string): string {
  const h = hostOf(url);
  if (h.includes('figma.com')) return 'Figma';
  if (h.includes('behance.net')) return 'Behance';
  if (h.includes('dribbble.com')) return 'Dribbble';
  if (h.includes('drive.google.com') || h.includes('docs.google.com')) return 'Google Drive';
  if (h.includes('github.com')) return 'GitHub';
  if (h.includes('youtube.com') || h.includes('youtu.be')) return 'YouTube';
  if (h.includes('canva.com')) return 'Canva';
  return 'Tautan';
}

export function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

/** Nama berkas aman untuk jalur penyimpanan. */
export function safeFileName(name: string): string {
  const ext = extOf(name);
  const base = name.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'berkas';
  return ext ? `${base}.${ext}` : base;
}

export const ACCEPT = '.png,.jpg,.jpeg,.webp,.gif,.pdf,.zip,.fig,.psd,.ai,.mp4,.mov,.pptx,.docx,.key';
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
