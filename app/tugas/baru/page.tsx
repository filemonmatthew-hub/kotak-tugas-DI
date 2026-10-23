'use client';

import Shell from '@/components/Shell';
import AssignmentForm from '@/components/AssignmentForm';

export default function NewAssignmentPage() {
  return (
    <Shell>
      {(role) =>
        role === 'dosen' ? (
          <AssignmentForm />
        ) : (
          <div className="notice err">Hanya dosen yang bisa membuat tugas.</div>
        )
      }
    </Shell>
  );
}
