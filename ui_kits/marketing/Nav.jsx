/* global React */
const { useState, useEffect } = React;

function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{color: 'var(--fg-1)'}}>
      <path d="M22 14 L14 14 L14 50 L22 50" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="miter"/>
      <path d="M42 14 L50 14 L50 50 L42 50" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="miter"/>
      <circle cx="32" cy="32" r="4" fill="#E60000"/>
    </svg>
  );
}

function Nav({ theme, setTheme }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 50,
      background: scrolled ? 'color-mix(in srgb, var(--bg-0) 80%, transparent)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border-1)' : '1px solid transparent',
      transition: 'background 220ms var(--ease-out-quart), border-color 220ms, backdrop-filter 220ms'
    }}>
      <div style={{maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', gap: 32}}>
        <a href="#" style={{display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none'}}>
          <Logo size={24}/>
          <span style={{fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', letterSpacing: '-0.01em'}}>randomcodespace</span>
        </a>
        <div style={{display: 'flex', gap: 4, marginLeft: 16}}>
          {['Products', 'Docs', 'Changelog', 'GitHub'].map(l => (
            <a key={l} href="#" style={{fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-2)', padding: '6px 10px', borderRadius: 4, textDecoration: 'none', transition: 'background 140ms, color 140ms'}}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--fg-1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-2)'; }}
            >{l}</a>
          ))}
        </div>
        <div style={{flex: 1}}/>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase',
          color: 'var(--fg-3)', background: 'transparent', border: '1px solid var(--border-1)',
          padding: '5px 10px', borderRadius: 4, cursor: 'pointer', transition: 'all 140ms'
        }}>{theme === 'dark' ? '☾ dark' : '☀ light'}</button>
        <a href="#" style={{fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-2)', padding: '6px 10px'}}>GitHub ↗</a>
        <a href="#" style={{
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
          background: 'var(--accent)', color: 'var(--accent-fg)',
          padding: '7px 14px', borderRadius: 4, textDecoration: 'none',
          transition: 'background 140ms var(--ease-out-quart)'
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >Get the CLI</a>
      </div>
    </nav>
  );
}

window.Logo = Logo;
window.Nav = Nav;
