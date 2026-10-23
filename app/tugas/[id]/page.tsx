'use client';

import { useParams } from 'next/navigation';
import Shell from '@/components/Shell';
import StudentAssignment from '@/components/StudentAssignment';
import LecturerAssignment from '@/components/LecturerAssignment';

export default function AssignmentPage() {
  const { id } = useParams<{ id: string }>();
  return <Shell>{(role) => (role === 'dosen' ? <LecturerAssignment id={id} /> : <StudentAssignment id={id} />)}</Shell>;
}
