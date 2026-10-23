export type Role = 'mahasiswa' | 'dosen';

export interface Profile {
  id: string;
  full_name: string;
  nim: string | null;
  role: Role;
}

export interface Assignment {
  id: string;
  title: string;
  course: string | null;
  description: string | null;
  deadline: string; // ISO
  max_score: number;
  allow_late: boolean;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  link_url: string | null;
  note: string | null;
  submitted_at: string; // ISO
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
}

export type StatusKey = 'open' | 'sent' | 'late' | 'graded' | 'closed' | 'openlate';
