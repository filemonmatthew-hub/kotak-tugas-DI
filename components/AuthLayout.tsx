import Logo from './Logo';

export default function AuthLayout({
  color,
  headline,
  sub,
  children,
}: {
  color: 'blue' | 'pink' | 'sun' | 'mint';
  headline: React.ReactNode;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth">
      <aside className={`auth-art c-${color}`}>
        <Logo href="/" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1>{headline}</h1>
          <p className="lead" style={{ color: 'inherit', marginTop: 18 }}>
            {sub}
          </p>
        </div>
      </aside>
      <main className="auth-form">{children}</main>
    </div>
  );
}
