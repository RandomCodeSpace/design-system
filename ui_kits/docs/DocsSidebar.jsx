/* global React */

function DocsSidebar() {
  const sections = [
    { title: 'Getting started', items: ['Install', 'First service', 'Configuration'], active: 'First service' },
    { title: 'Services', items: ['Overview', 'Vault', 'Gateway', 'Postgres', 'Metrics'] },
    { title: 'Operations', items: ['Backups', 'Restore', 'Upgrades', 'Observability'] },
    { title: 'Security', items: ['Threat model', 'TLS', 'Secrets', 'Audit logs'] },
    { title: 'Reference', items: ['CLI', 'Configuration schema', 'HTTP API'] },
  ];
  return (
    <aside style={{
      width: 240, height: 'calc(100vh - 56px)', position: 'sticky', top: 56,
      padding: '24px 16px 24px 24px', overflowY: 'auto',
      borderRight: '1px solid var(--border-1)'
    }}>
      {sections.map(s => (
        <div key={s.title} style={{marginBottom: 20}}>
          <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 500, padding: '4px 8px', marginBottom: 4}}>{s.title}</div>
          {s.items.map(i => (
            <a key={i} href="#" style={{
              display: 'block', padding: '5px 10px', borderRadius: 3,
              fontFamily: 'var(--font-sans)', fontSize: 13,
              color: i === s.active ? 'var(--fg-1)' : 'var(--fg-2)',
              background: i === s.active ? 'var(--bg-2)' : 'transparent',
              fontWeight: i === s.active ? 500 : 400,
              borderLeft: i === s.active ? '2px solid var(--accent)' : '2px solid transparent',
              textDecoration: 'none', transition: 'background 140ms, color 140ms'
            }}>{i}</a>
          ))}
        </div>
      ))}
    </aside>
  );
}

window.DocsSidebar = DocsSidebar;
