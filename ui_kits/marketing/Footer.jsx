/* global React */

function Footer() {
  const cols = [
    { title: 'Product', links: ['Overview', 'Services', 'CLI', 'Changelog', 'Roadmap'] },
    { title: 'Docs', links: ['Getting started', 'Configuration', 'Security', 'API reference'] },
    { title: 'Community', links: ['GitHub', 'Discord', 'Contributing', 'Code of conduct'] },
    { title: 'Legal', links: ['License (MIT)', 'Privacy', 'Security contact'] },
  ];
  return (
    <footer style={{padding: '64px 24px 40px', borderTop: '1px solid var(--border-1)', background: 'var(--bg-0)'}}>
      <div style={{maxWidth: 1100, margin: '0 auto'}}>
        <div style={{display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: 40, marginBottom: 56}}>
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14}}>
              <svg width="24" height="24" viewBox="0 0 64 64" fill="none" style={{color: 'var(--fg-1)'}}>
                <path d="M22 14 L14 14 L14 50 L22 50" stroke="currentColor" strokeWidth="3" fill="none"/>
                <path d="M42 14 L50 14 L50 50 L42 50" stroke="currentColor" strokeWidth="3" fill="none"/>
                <circle cx="32" cy="32" r="4" fill="#E60000"/>
              </svg>
              <span style={{fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--fg-1)'}}>randomcodespace</span>
            </div>
            <p style={{fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.55, color: 'var(--fg-3)', maxWidth: 280, marginBottom: 16}}>
              Open-source, self-hostable tools for infrastructure you own.
            </p>
          </div>
          {cols.map(c => (
            <div key={c.title}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 500, marginBottom: 14
              }}>{c.title}</div>
              <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8}}>
                {c.links.map(l => (
                  <li key={l}>
                    <a href="#" style={{fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none', transition: 'opacity 140ms'}}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--border-1)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)'}}>
          <div>© 2026 randomcodespace · MIT</div>
          <div style={{display: 'flex', gap: 14}}>
            <span>v0.14.2</span>
            <span>·</span>
            <span>sha: 4f2a9c1</span>
            <span>·</span>
            <span>180 ms cold start</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
