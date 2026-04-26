/* global React, lucide */

function LogTail() {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
  const lines = [
    { t: '14:32:08.120', lvl: 'info', svc: 'vault-primary', msg: 'token refreshed for client=api-gateway' },
    { t: '14:32:07.884', lvl: 'info', svc: 'postgres', msg: 'autovacuum complete: 1.2s, 344 pages' },
    { t: '14:32:06.511', lvl: 'warn', svc: 'gateway', msg: 'upstream timeout after 5000ms, retrying (2/3)' },
    { t: '14:32:05.220', lvl: 'info', svc: 'vault-primary', msg: 'seal status unchanged' },
    { t: '14:32:02.014', lvl: 'error', svc: 'gateway', msg: 'connection refused: 10.0.1.12:8443' },
    { t: '14:32:01.940', lvl: 'info', svc: 'postgres', msg: 'checkpoint complete: wrote 128 buffers' },
    { t: '14:31:58.002', lvl: 'info', svc: 'vault-primary', msg: 'client authenticated: method=kubernetes' },
  ];
  const color = { info: 'var(--fg-3)', warn: 'var(--warning)', error: 'var(--danger)' };

  return (
    <div style={{padding: '0 24px 24px'}}>
      <div style={{background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 6, overflow: 'hidden'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-1)', background: 'var(--bg-2)'}}>
          <i data-lucide="activity" width="14" height="14" strokeWidth="1.5" style={{color: 'var(--fg-3)'}}/>
          <span style={{fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 500}}>Log tail · all services</span>
          <div style={{flex: 1}}/>
          <span style={{display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--success)'}}>
            <span style={{width: 6, height: 6, borderRadius: '50%', background: 'var(--success)'}}/>
            live
          </span>
        </div>
        <div style={{fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, padding: '10px 0'}}>
          {lines.map((l, i) => (
            <div key={i} style={{display: 'grid', gridTemplateColumns: '110px 60px 130px 1fr', gap: 12, padding: '2px 16px'}}>
              <span style={{color: 'var(--fg-4)'}}>{l.t}</span>
              <span style={{color: color[l.lvl], textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.04em', fontWeight: 600, paddingTop: 1}}>{l.lvl}</span>
              <span style={{color: 'var(--accent)'}}>{l.svc}</span>
              <span style={{color: 'var(--fg-2)'}}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.LogTail = LogTail;
