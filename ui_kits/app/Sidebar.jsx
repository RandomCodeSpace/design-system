/* global React, lucide */

function Sidebar({ active, setActive }) {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [active]);

  const nav = [
    { id: 'services', label: 'Services', icon: 'box', count: 4 },
    { id: 'logs', label: 'Logs', icon: 'activity' },
    { id: 'secrets', label: 'Secrets', icon: 'key', count: 12 },
    { id: 'backups', label: 'Backups', icon: 'database' },
    { id: 'network', label: 'Network', icon: 'git-branch' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  const services = [
    { name: 'vault-primary', status: 'running' },
    { name: 'gateway', status: 'degraded' },
    { name: 'postgres', status: 'running' },
    { name: 'metrics', status: 'stopped' },
  ];
  const statusColor = { running: 'var(--success)', degraded: 'var(--warning)', stopped: 'var(--fg-4)', down: 'var(--danger)' };

  return (
    <aside style={{
      width: 260, height: '100vh', background: 'var(--bg-1)',
      borderRight: '1px solid var(--border-1)', display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, zIndex: 10
    }}>
      <div style={{height: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid var(--border-1)'}}>
        <svg width="20" height="20" viewBox="0 0 64 64" fill="none" style={{color: 'var(--fg-1)'}}>
          <path d="M22 14 L14 14 L14 50 L22 50" stroke="currentColor" strokeWidth="3" fill="none"/>
          <path d="M42 14 L50 14 L50 50 L42 50" stroke="currentColor" strokeWidth="3" fill="none"/>
          <circle cx="32" cy="32" r="4" fill="#E60000"/>
        </svg>
        <span style={{fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color: 'var(--fg-1)'}}>randomcodespace</span>
        <span style={{marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)'}}>v0.14.2</span>
      </div>

      <div style={{padding: '16px 10px', flex: 1, overflowY: 'auto'}}>
        <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', padding: '0 8px 8px', fontWeight: 500}}>Workspace</div>
        {nav.map(n => (
          <button key={n.id} onClick={() => setActive(n.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
            background: active === n.id ? 'var(--bg-2)' : 'transparent',
            color: active === n.id ? 'var(--fg-1)' : 'var(--fg-2)',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active === n.id ? 500 : 400,
            transition: 'background 140ms var(--ease-out-quart), color 140ms',
            textAlign: 'left'
          }}>
            <i data-lucide={n.icon} width="16" height="16" strokeWidth="1.5"/>
            <span style={{flex: 1}}>{n.label}</span>
            {n.count !== undefined && <span style={{fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)'}}>{n.count}</span>}
          </button>
        ))}

        <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', padding: '20px 8px 8px', fontWeight: 500}}>Services</div>
        {services.map(s => (
          <button key={s.name} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--fg-2)',
            fontFamily: 'var(--font-mono)', fontSize: 12,
            textAlign: 'left', transition: 'background 140ms'
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{width: 6, height: 6, borderRadius: '50%', background: statusColor[s.status], flexShrink: 0}}/>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      <div style={{padding: 12, borderTop: '1px solid var(--border-1)', display: 'flex', alignItems: 'center', gap: 10}}>
        <div style={{width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-soft-2)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600}}>R</div>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: 'var(--fg-1)'}}>root</div>
          <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)'}}>rcs.local</div>
        </div>
        <i data-lucide="chevrons-up-down" width="14" height="14" strokeWidth="1.5" style={{color: 'var(--fg-3)'}}/>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
