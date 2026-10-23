'use client';

import Shell from '@/components/Shell';
import StudentDashboard from '@/components/StudentDashboard';
import LecturerDashboard from '@/components/LecturerDashboard';

export default function DashboardPage() {
  return <Shell>{(role) => (role === 'dosen' ? <LecturerDashboard /> : <StudentDashboard />)}</Shell>;
}
