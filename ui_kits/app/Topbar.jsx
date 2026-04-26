/* global React, lucide */

function Topbar({ theme, setTheme, onCmdK }) {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [theme]);
  return (
    <header style={{
      height: 48, display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 20px', borderBottom: '1px solid var(--border-1)',
      position: 'sticky', top: 0, background: 'var(--bg-0)', zIndex: 5
    }}>
      <div style={{display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)'}}>
        <span>workspace</span>
        <span style={{color: 'var(--fg-4)'}}>/</span>
        <span style={{color: 'var(--fg-1)', fontWeight: 500}}>services</span>
      </div>
      <div style={{flex: 1}}/>
      <button onClick={onCmdK} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '5px 10px 5px 12px', borderRadius: 4,
        background: 'var(--bg-1)', border: '1px solid var(--border-1)',
        color: 'var(--fg-3)', fontFamily: 'var(--font-sans)', fontSize: 12.5, cursor: 'pointer',
        width: 280
      }}>
        <i data-lucide="search" width="13" height="13" strokeWidth="1.5"/>
        <span style={{flex: 1, textAlign: 'left'}}>Search services, logs…</span>
        <kbd style={{fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', background: 'var(--bg-2)', border: '1px solid var(--border-1)', padding: '1px 5px', borderRadius: 3}}>⌘K</kbd>
      </button>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{
        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 4, border: '1px solid var(--border-1)', background: 'var(--bg-1)',
        color: 'var(--fg-2)', cursor: 'pointer', transition: 'all 140ms'
      }}>
        <i data-lucide={theme === 'dark' ? 'moon' : 'sun'} width="14" height="14" strokeWidth="1.5"/>
      </button>
      <button style={{
        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 4, border: '1px solid var(--border-1)', background: 'var(--bg-1)',
        color: 'var(--fg-2)', cursor: 'pointer'
      }}>
        <i data-lucide="bell" width="14" height="14" strokeWidth="1.5"/>
      </button>
    </header>
  );
}

window.Topbar = Topbar;
