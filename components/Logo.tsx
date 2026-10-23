import Link from 'next/link';

export function LogoMark() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect x="3" y="13" width="27" height="24" rx="6" fill="#FF4FA3" stroke="#111" strokeWidth="2.5" />
      <circle cx="27" cy="14" r="10" fill="#FFD400" stroke="#111" strokeWidth="2.5" />
      <path d="M10 26h13" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ href = '/', tagline = true }: { href?: string; tagline?: boolean }) {
  return (
    <Link href={href} className="logo" aria-label="Kotak Tugas, ke beranda">
      <LogoMark />
      <span>
        Kotak Tugas
        {tagline && <small>Setor · Kritik · Nilai</small>}
      </span>
    </Link>
  );
}
