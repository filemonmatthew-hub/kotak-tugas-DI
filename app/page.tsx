import Logo from '@/components/Logo';
import { NavActions, HeroActions } from '@/components/LandingAuth';

const TOPICS = ['Poster', 'Branding', 'UI Kit', 'Ilustrasi', 'Motion', 'Tipografi', 'Fotografi', 'Prototipe', 'Layout', 'Kemasan'];

export default function Home() {
  return (
    <>
      <div className="wrap">
        <header className="top">
          <Logo />
          <NavActions />
        </header>

        <section className="hero">
          <div>
            <span className="eyebrow">Untuk kelas desain</span>
            <h1>
              Setor karya.
              <br />
              <span className="hl hl-pink">Dapat kritik.</span>
              <br />
              Lihat nilainya.
            </h1>
            <p className="lead">
              Tempat mahasiswa mengunggah poster, desain UI, dan proyek akhir. Dosen melihat semuanya dalam satu galeri,
              memberi nilai, lalu menulis umpan balik.
            </p>
            <HeroActions />
            <p className="mono muted" style={{ fontSize: 13, marginTop: 18 }}>
              Gratis dipakai · Tenggat dihitung dengan jam server (WIB)
            </p>
          </div>

          <div className="collage" aria-hidden="true">
            <div className="poster poster-a">
              <b>Poster Tipografi</b>
              <span>Contoh · Nilai 92</span>
            </div>
            <div className="poster poster-b">
              <b>Identitas Merek</b>
              <span>Contoh · Nilai 88</span>
            </div>
            <div className="poster poster-c">
              <b>Prototipe Mobile</b>
              <span>Contoh · Nilai 95</span>
            </div>
            <div className="badge">
              Tepat
              <br />
              waktu!
            </div>
          </div>
        </section>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((n) => (
            <span key={n} style={{ display: 'inline-flex', gap: 36 }}>
              {TOPICS.map((t) => (
                <span key={t} style={{ display: 'inline-flex', gap: 36 }}>
                  {t} <i>✺</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="wrap">
        <section className="feat">
          <article>
            <span className="num">01 / SETOR</span>
            <div>
              <h3>Setor sekali klik</h3>
              <p style={{ marginTop: 12 }}>
                Unggah gambar, PDF, atau video. Karya besar di Figma? Tempel tautannya. Tenggat dicek di server, bukan jam HP.
              </p>
            </div>
          </article>
          <article>
            <span className="num">02 / KRITIK</span>
            <div>
              <h3>Galeri untuk kritik</h3>
              <p style={{ marginTop: 12 }}>
                Dosen melihat semua pengumpulan sebagai galeri visual, bukan daftar berkas yang dibuka satu per satu.
              </p>
            </div>
          </article>
          <article>
            <span className="num">03 / NILAI</span>
            <div>
              <h3>Nilai dan umpan balik</h3>
              <p style={{ marginTop: 12 }}>
                Nilai dan catatan dosen langsung muncul di halaman tugas, lengkap dengan status tepat waktu atau terlambat.
              </p>
            </div>
          </article>
        </section>

        <section className="roles">
          <div className="role-card">
            <h3>Untuk mahasiswa</h3>
            <ul>
              <li>Lihat semua tugas beserta sisa waktunya</li>
              <li>Unggah berkas atau tempel tautan Figma, Behance, Drive</li>
              <li>Kumpul ulang selama belum dinilai</li>
              <li>Baca nilai dan catatan dosen di satu tempat</li>
            </ul>
          </div>
          <div className="role-card dark">
            <h3>Untuk dosen</h3>
            <ul>
              <li>Buat tugas dengan brief, tenggat, dan nilai maksimal</li>
              <li>Periksa pengumpulan dalam tampilan galeri</li>
              <li>Beri nilai dan umpan balik langsung di kartu karya</li>
              <li>Unduh rekap nilai kelas ke berkas CSV</li>
            </ul>
          </div>
        </section>

        <section className="cta-band">
          <h2>Siap setor tugas pertama?</h2>
          <HeroActions tone="sun" />
        </section>

        <footer className="foot">
          <span>Kotak Tugas · dibuat untuk kelas desain</span>
          <span>Semua jam dalam WIB</span>
        </footer>
      </div>
    </>
  );
}
