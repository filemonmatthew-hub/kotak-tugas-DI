'use client';

import { useParams } from 'next/navigation';
import Shell from '@/components/Shell';
import AssignmentForm from '@/components/AssignmentForm';

export default function EditAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Shell>
      {(role) =>
        role === 'dosen' ? <AssignmentForm id={id} /> : <div className="notice err">Hanya dosen yang bisa mengubah tugas.</div>
      }
    </Shell>
  );
}
