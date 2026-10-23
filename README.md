# Kotak Tugas

Website pengumpulan tugas untuk kelas desain. Mahasiswa mendaftar sendiri, melihat tugas, dan menyetor karya
(gambar, PDF, ZIP, Figma, video, atau tautan). Dosen membuat tugas, melihat karya dalam galeri, memberi nilai,
menulis umpan balik, dan mengunduh rekap nilai.

Dibangun dengan Next.js dan Supabase (database, login, penyimpanan berkas). Semuanya bisa dipasang gratis.

## Pasang dalam 4 langkah (sekitar 20 menit)

### 1. Buat proyek Supabase
1. Daftar di https://supabase.com, klik **New project**, isi nama dan kata sandi database, pilih region Singapore.
2. Setelah proyek siap, buka **SQL Editor > New query**, tempel seluruh isi `supabase/schema.sql`, klik **Run**.
   Ini membuat tabel, aturan keamanan, dan tempat penyimpanan berkas.
3. Buka **Project Settings > API**, salin **Project URL** dan **anon public key**.

### 2. Taruh kode di GitHub
1. Buat repositori baru di https://github.com (boleh privat).
2. Unggah seluruh isi folder ini. Berkas `.env.local` tidak ikut karena sudah diabaikan oleh `.gitignore`.

### 3. Pasang di Vercel
1. Daftar di https://vercel.com dengan akun GitHub, klik **Add New > Project**, pilih repositori tadi.
2. Di bagian **Environment Variables**, isi dua nilai:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL dari langkah 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key dari langkah 1
3. Klik **Deploy**. Hasilnya alamat seperti `https://kotak-tugas-xxxx.vercel.app`. Itu alamat yang dibagikan ke kelas.

### 4. Atur Supabase agar cocok dengan alamat situs
Di Supabase buka **Authentication > URL Configuration**:
- **Site URL**: isi alamat Vercel tadi.
- **Redirect URLs**: tambahkan alamat yang sama diikuti `/**`.

Opsional tapi disarankan untuk kelas: di **Authentication > Sign In / Providers > Email**, matikan **Confirm email**.
Dengan begitu mahasiswa langsung bisa masuk setelah daftar, tanpa menunggu email konfirmasi.

## Menjadikan akunmu dosen

Semua akun baru berperan mahasiswa. Hanya kamu yang bisa mengubahnya, lewat database:

1. Daftar di situs dengan email dosen.
2. Di Supabase buka **SQL Editor**, jalankan (ganti emailnya):

```sql
update public.profiles
set role = 'dosen'
where id = (select id from auth.users where email = 'email-dosen@kampus.ac.id');
```

3. Keluar dari situs lalu masuk lagi. Dashboard dosen akan muncul.

Mahasiswa tidak bisa menaikkan perannya sendiri. Aturan ini dijaga di database, bukan di tampilan.

## Cara pakai

**Dosen**: Dashboard > **Buat tugas** (judul, mata kuliah, brief, tenggat WIB, nilai maksimal, boleh terlambat atau tidak).
Klik kartu tugas untuk melihat galeri karya. Isi nilai dan umpan balik di tiap kartu, lalu **Simpan nilai**.
Tombol **Unduh nilai (CSV)** menghasilkan rekap yang bisa dibuka di Excel atau Google Sheets.

**Mahasiswa**: daftar dengan nama dan NIM, buka tugas, lalu **Setor sekarang**. Boleh kumpul ulang selama belum dinilai.

## Aturan yang dijaga database

| Aturan | Cara kerjanya |
|---|---|
| Tenggat | Dicek dengan jam server. Mengubah jam HP tidak berpengaruh. |
| Waktu setor | Dicatat otomatis oleh server, tidak bisa diisi mahasiswa. |
| Nilai | Hanya dosen yang bisa mengisi. Upaya mahasiswa mengisi nilainya sendiri diabaikan. |
| Setelah dinilai | Pengumpulan terkunci, mahasiswa tidak bisa mengubahnya. |
| Privasi | Mahasiswa hanya melihat karya dan nilainya sendiri. Dosen melihat semua. |
| Berkas | Disimpan privat. Mahasiswa hanya bisa mengunggah ke folder sendiri dan hanya sebelum tenggat (atau jika terlambat diizinkan). |
| Peran | Akun baru selalu mahasiswa. Hanya bisa diubah lewat SQL Editor. |

## Batasan yang perlu diketahui

- Batas ukuran berkas 20 MB. Untuk karya lebih besar, mahasiswa mengunggah ke Drive atau Figma dan menempel tautan.
- Paket gratis Supabase memberi 1 GB penyimpanan berkas dan 50.000 pengguna aktif per bulan, cukup untuk beberapa kelas.
  Proyek gratis dijeda otomatis kalau tidak dipakai selama seminggu. Buka dashboard Supabase untuk mengaktifkannya lagi.
- Email konfirmasi bawaan Supabase dibatasi jumlah kirimnya per jam. Karena itu konfirmasi email disarankan dimatikan.
- Berkas lama tidak otomatis terhapus saat mahasiswa mengunggah ulang atau tugas dihapus. Bersihkan lewat
  Supabase **Storage > submissions** kalau ruangnya mulai penuh.

## Menjalankan di laptop

```bash
cp .env.local.example .env.local   # isi dengan URL dan anon key Supabase
npm install
npm run dev                        # buka http://localhost:3000
```
