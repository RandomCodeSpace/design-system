/* global React, lucide */

function CommandMenu({ open, onClose }) {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [open]);
  const [q, setQ] = React.useState('');
  if (!open) return null;
  const items = [
    { icon: 'plus', label: 'New service', hint: '⌘ N', group: 'Actions' },
    { icon: 'refresh-ccw', label: 'Restart all services', hint: '⌘ ⇧ R', group: 'Actions' },
    { icon: 'database', label: 'Run backup now', hint: '⌘ B', group: 'Actions' },
    { icon: 'box', label: 'vault-primary', hint: 'service', group: 'Jump to' },
    { icon: 'box', label: 'gateway', hint: 'service', group: 'Jump to' },
    { icon: 'box', label: 'postgres', hint: 'service', group: 'Jump to' },
    { icon: 'settings', label: 'Settings → Network', hint: 'page', group: 'Jump to' },
  ];
  const filtered = items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()));
  const groups = [...new Set(filtered.map(i => i.group))];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120,
      animation: 'rcsFadeIn 180ms var(--ease-out-quart)'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 560, background: 'var(--bg-1)', border: '1px solid var(--border-2)',
        borderRadius: 8, boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
        animation: 'rcsRise 220ms var(--ease-out-quart)'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border-1)'}}>
          <i data-lucide="search" width="14" height="14" strokeWidth="1.5" style={{color: 'var(--fg-3)'}}/>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Run a command or jump to a service…" style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)'
          }}/>
          <kbd style={{fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', background: 'var(--bg-2)', border: '1px solid var(--border-1)', padding: '1px 5px', borderRadius: 3}}>esc</kbd>
        </div>
        <div style={{padding: 6, maxHeight: 400, overflowY: 'auto'}}>
          {groups.map(g => (
            <div key={g}>
              <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', padding: '8px 10px 4px', fontWeight: 500}}>{g}</div>
              {filtered.filter(i => i.group === g).map((i, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 4,
                  background: idx === 0 && g === groups[0] ? 'var(--bg-2)' : 'transparent',
                  cursor: 'pointer'
                }}>
                  <i data-lucide={i.icon} width="14" height="14" strokeWidth="1.5" style={{color: 'var(--fg-2)'}}/>
                  <span style={{flex: 1, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)'}}>{i.label}</span>
                  <span style={{fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)'}}>{i.hint}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes rcsFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes rcsRise { from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:translateY(0)} }
      `}</style>
    </div>
  );
}

window.CommandMenu = CommandMenu;
