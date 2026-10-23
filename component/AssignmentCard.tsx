import Link from 'next/link';
import type { Assignment, StatusKey } from '@/lib/types';
import { colorOf, fmt, num, span } from '@/lib/format';

export function Sticker({ k, label }: { k: StatusKey | 'none'; label: string }) {
  return <span className={`sticker ${k}`}>{label}</span>;
}

export function whenLine(a: Assignment): string {
  const diff = new Date(a.deadline).getTime() - Date.now();
  return diff > 0 ? `sisa ${span(diff)}` : `lewat ${span(diff)}`;
}

export default function AssignmentCard({
  a,
  status,
  score,
  extra,
}: {
  a: Assignment;
  status: { k: StatusKey | 'none'; label: string };
  score?: number | null;
  extra?: React.ReactNode;
}) {
  return (
    <Link href={`/tugas/${a.id}`} className={`acard c-${colorOf(a.id)}`}>
      <div className="acard-top">
        <span className="acard-course">{a.course || 'Tugas'}</span>
        <h3>{a.title}</h3>
      </div>
      <div className="acard-body">
        <p className="acard-meta">
          <b>Tenggat</b> {fmt(a.deadline)}
          <br />
          {whenLine(a)}
        </p>
        {extra}
        <div className="acard-foot">
          <Sticker k={status.k} label={status.label} />
          {score != null && (
            <span className="score-chip">
              {num(score)} <span>/ {num(a.max_score)}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
