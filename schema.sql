-- Kotak Tugas: skema database, aturan keamanan, dan penyimpanan berkas.
-- Jalankan seluruh isi file ini sekali di Supabase: SQL Editor > New query > Run.

-- ---------------------------------------------------------------
-- 1. Tabel
-- ---------------------------------------------------------------
create type public.user_role as enum ('mahasiswa', 'dosen');

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  nim        text,
  role       public.user_role not null default 'mahasiswa',
  created_at timestamptz not null default now()
);

create table public.assignments (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  course      text,
  description text,
  deadline    timestamptz not null,
  max_score   numeric not null default 100 check (max_score > 0),
  allow_late  boolean not null default false,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id    uuid not null references public.profiles (id) on delete cascade,
  file_path     text,
  file_name     text,
  file_size     bigint,
  link_url      text,
  note          text,
  submitted_at  timestamptz not null default now(),
  score         numeric,
  feedback      text,
  graded_at     timestamptz,
  graded_by     uuid references public.profiles (id) on delete set null,
  unique (assignment_id, student_id)
);

create index submissions_assignment_idx on public.submissions (assignment_id);
create index submissions_student_idx on public.submissions (student_id);

-- ---------------------------------------------------------------
-- 2. Fungsi bantu
-- ---------------------------------------------------------------
create or replace function public.is_dosen()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'dosen'
  );
$$;

create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Akun baru selalu menjadi mahasiswa. Nama dan NIM diambil dari form daftar.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, nim, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'nim'), ''),
    'mahasiswa'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- 3. Penjaga pengumpulan: tenggat, kunci setelah dinilai, nilai hanya dosen
--    Jam yang dipakai adalah jam server, bukan jam perangkat mahasiswa.
-- ---------------------------------------------------------------
create or replace function public.submissions_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.assignments%rowtype;
  dosen boolean;
begin
  -- Perubahan dari SQL Editor atau service role tidak dibatasi.
  if auth.uid() is null then
    return new;
  end if;

  dosen := public.is_dosen();

  if tg_op = 'INSERT' then
    if dosen then
      raise exception 'Akun dosen tidak mengumpulkan tugas.';
    end if;
    select * into a from public.assignments where id = new.assignment_id;
    if not found then
      raise exception 'Tugas tidak ditemukan.';
    end if;
    if now() > a.deadline and not a.allow_late then
      raise exception 'Pengumpulan sudah ditutup.';
    end if;
    new.student_id   := auth.uid();
    new.submitted_at := now();
    new.score        := null;
    new.feedback     := null;
    new.graded_at    := null;
    new.graded_by    := null;
    return new;
  end if;

  -- UPDATE
  select * into a from public.assignments where id = old.assignment_id;

  if dosen then
    -- Dosen hanya mengubah nilai dan umpan balik.
    new.assignment_id := old.assignment_id;
    new.student_id    := old.student_id;
    new.file_path     := old.file_path;
    new.file_name     := old.file_name;
    new.file_size     := old.file_size;
    new.link_url      := old.link_url;
    new.note          := old.note;
    new.submitted_at  := old.submitted_at;
    if new.score is not null and (new.score < 0 or new.score > a.max_score) then
      raise exception 'Nilai harus antara 0 dan %.', a.max_score;
    end if;
    new.graded_at := now();
    new.graded_by := auth.uid();
    return new;
  end if;

  -- Mahasiswa
  if old.score is not null then
    raise exception 'Tugas sudah dinilai dan tidak bisa diubah.';
  end if;
  if now() > a.deadline and not a.allow_late then
    raise exception 'Pengumpulan sudah ditutup.';
  end if;
  new.assignment_id := old.assignment_id;
  new.student_id    := old.student_id;
  new.score         := old.score;
  new.feedback      := old.feedback;
  new.graded_at     := old.graded_at;
  new.graded_by     := old.graded_by;
  new.submitted_at  := now();
  return new;
end;
$$;

create trigger submissions_guard_trg
  before insert or update on public.submissions
  for each row execute function public.submissions_guard();

-- ---------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;

-- profiles
create policy "profil: lihat sendiri atau dosen lihat semua"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_dosen());

create policy "profil: ubah data sendiri tanpa mengganti peran"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.my_role());

-- assignments
create policy "tugas: semua pengguna masuk bisa melihat"
  on public.assignments for select to authenticated
  using (true);

create policy "tugas: dosen membuat"
  on public.assignments for insert to authenticated
  with check (public.is_dosen());

create policy "tugas: dosen mengubah"
  on public.assignments for update to authenticated
  using (public.is_dosen()) with check (public.is_dosen());

create policy "tugas: dosen menghapus"
  on public.assignments for delete to authenticated
  using (public.is_dosen());

-- submissions
create policy "pengumpulan: mahasiswa lihat miliknya, dosen lihat semua"
  on public.submissions for select to authenticated
  using (student_id = auth.uid() or public.is_dosen());

create policy "pengumpulan: mahasiswa mengumpulkan atas namanya"
  on public.submissions for insert to authenticated
  with check (student_id = auth.uid() and not public.is_dosen());

create policy "pengumpulan: mahasiswa ubah miliknya, dosen menilai"
  on public.submissions for update to authenticated
  using (student_id = auth.uid() or public.is_dosen())
  with check (student_id = auth.uid() or public.is_dosen());

-- ---------------------------------------------------------------
-- 5. Penyimpanan berkas (bucket privat, maks 20 MB per berkas)
--    Jalur berkas: <assignment_id>/<student_id>/<nama-berkas>
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('submissions', 'submissions', false, 20971520)
on conflict (id) do update set file_size_limit = excluded.file_size_limit, public = false;

create policy "berkas: mahasiswa unggah ke folder sendiri sebelum tenggat"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[2] = auth.uid()::text
    and not public.is_dosen()
    and exists (
      select 1 from public.assignments a
      where a.id::text = (storage.foldername(name))[1]
        and (now() <= a.deadline or a.allow_late)
    )
  );

create policy "berkas: mahasiswa baca miliknya, dosen baca semua"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'submissions'
    and ((storage.foldername(name))[2] = auth.uid()::text or public.is_dosen())
  );

create policy "berkas: dosen menghapus"
  on storage.objects for delete to authenticated
  using (bucket_id = 'submissions' and public.is_dosen());
