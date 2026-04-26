/* global React, lucide */

function Sparkline({ data, color }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 24;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return <svg width={w} height={h} style={{display: 'block'}}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/></svg>;
}

function ServicesGrid({ onSelect }) {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
  const [selected, setSelected] = React.useState(null);

  const services = [
    { id: 1, name: 'vault-primary', status: 'running', uptime: '14d 02:11', mem: '48.2 MB', reqs: 12.4, spark: [8,10,9,11,12,11,13,12,14,12,12.4], color: 'var(--success)', label: 'RUNNING' },
    { id: 2, name: 'gateway', status: 'degraded', uptime: '03:14', mem: '112 MB', reqs: 0.3, spark: [6,5,4,3,2,1,0.5,0.3,0.4,0.3,0.3], color: 'var(--warning)', label: 'DEGRADED' },
    { id: 3, name: 'postgres', status: 'running', uptime: '21d 09:44', mem: '256 MB', reqs: 48.1, spark: [40,42,44,46,48,50,49,48,47,48,48.1], color: 'var(--success)', label: 'RUNNING' },
    { id: 4, name: 'metrics', status: 'stopped', uptime: '—', mem: '—', reqs: 0, spark: [0,0,0,0,0,0,0,0,0,0,0], color: 'var(--fg-4)', label: 'STOPPED' },
  ];

  return (
    <div style={{padding: 24}}>
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24}}>
        <div>
          <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 500, marginBottom: 8}}>4 services · 1 degraded</div>
          <h1 style={{fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 28, lineHeight: 1.15, letterSpacing: '-0.022em', color: 'var(--fg-1)', margin: 0}}>Services</h1>
        </div>
        <div style={{display: 'flex', gap: 8}}>
          <button style={{fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, background: 'var(--bg-1)', color: 'var(--fg-1)', border: '1px solid var(--border-2)', padding: '7px 12px', borderRadius: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6}}>
            <i data-lucide="filter" width="13" height="13" strokeWidth="1.5"/> Filter
          </button>
          <button style={{fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, background: 'var(--accent)', color: 'var(--accent-fg)', border: '1px solid var(--accent)', padding: '7px 12px', borderRadius: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6}}>
            <i data-lucide="plus" width="13" height="13" strokeWidth="2"/> New service
          </button>
        </div>
      </div>

      <div style={{border: '1px solid var(--border-1)', borderRadius: 6, overflow: 'hidden', background: 'var(--bg-1)'}}>
        <div style={{display: 'grid', gridTemplateColumns: '1.5fr 120px 110px 100px 90px 130px 40px', gap: 0, padding: '8px 16px', borderBottom: '1px solid var(--border-1)', background: 'var(--bg-2)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 500}}>
          <div>Service</div>
          <div>Status</div>
          <div>Uptime</div>
          <div>Memory</div>
          <div>Req/s</div>
          <div>Trend</div>
          <div/>
        </div>
        {services.map(s => (
          <div key={s.id} onClick={() => { setSelected(s.id); onSelect && onSelect(s); }} style={{
            display: 'grid', gridTemplateColumns: '1.5fr 120px 110px 100px 90px 130px 40px', gap: 0,
            padding: '14px 16px', alignItems: 'center',
            borderBottom: '1px solid var(--border-1)',
            background: selected === s.id ? 'var(--bg-2)' : 'transparent',
            cursor: 'pointer', transition: 'background 140ms'
          }}
            onMouseEnter={e => { if (selected !== s.id) e.currentTarget.style.background = 'var(--bg-2)'; }}
            onMouseLeave={e => { if (selected !== s.id) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
              <div style={{width: 6, height: 6, borderRadius: '50%', background: s.color, boxShadow: s.status === 'running' ? `0 0 0 3px color-mix(in srgb, ${s.color} 25%, transparent)` : 'none'}}/>
              <div>
                <div style={{fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500, color: 'var(--fg-1)'}}>{s.name}</div>
                <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)'}}>:{8443 + s.id - 1} · v0.14</div>
              </div>
            </div>
            <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.04em', color: s.color, fontWeight: 600}}>{s.label}</div>
            <div style={{fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)'}}>{s.uptime}</div>
            <div style={{fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)'}}>{s.mem}</div>
            <div style={{fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)'}}>{s.reqs}</div>
            <div><Sparkline data={s.spark} color={s.color}/></div>
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <i data-lucide="more-horizontal" width="14" height="14" strokeWidth="1.5" style={{color: 'var(--fg-3)'}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.ServicesGrid = ServicesGrid;
