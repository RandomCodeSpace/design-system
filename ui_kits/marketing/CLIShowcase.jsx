/* global React, lucide */

function CLIShowcase() {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
  const commands = [
    { cmd: 'rcs deploy', desc: 'Ship a service from a single TOML file.' },
    { cmd: 'rcs secrets', desc: 'Read, write, rotate. Encrypted at rest by default.' },
    { cmd: 'rcs logs --tail', desc: 'Structured JSON, filterable, local only.' },
    { cmd: 'rcs backup', desc: 'Snapshot state to anywhere rsync reaches.' },
  ];
  return (
    <section style={{padding: '80px 24px', borderTop: '1px solid var(--border-1)'}}>
      <div style={{maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center'}}>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 500, marginBottom: 16
          }}>02 — The CLI is the interface</div>
          <h2 style={{
            fontFamily: 'var(--font-sans)', fontWeight: 600,
            fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.028em',
            color: 'var(--fg-1)', marginBottom: 16, textWrap: 'balance'
          }}>Four commands. That's the API.</h2>
          <p style={{fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', marginBottom: 28, textWrap: 'pretty'}}>
            The web UI is a convenience. Every workflow has a CLI equivalent that's scriptable, testable, and commits cleanly to a Makefile.
          </p>
          <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
            {commands.map(c => (
              <div key={c.cmd} style={{
                display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'baseline',
                padding: '10px 0', borderBottom: '1px solid var(--border-1)'
              }}>
                <code style={{fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)', background: 'transparent', border: 'none', padding: 0}}>{c.cmd}</code>
                <div style={{fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.5}}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{
          background: 'var(--bg-1)', border: '1px solid var(--border-1)',
          borderRadius: 6, boxShadow: 'var(--shadow-md)', overflow: 'hidden'
        }}>
          <div style={{padding: '10px 14px', borderBottom: '1px solid var(--border-1)', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', gap: 10}}>
            <i data-lucide="terminal" width="14" height="14" strokeWidth="1.5" style={{color: 'var(--fg-3)'}}/>
            <span style={{fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em', textTransform: 'uppercase'}}>rcs deploy</span>
          </div>
          <pre style={{margin: 0, padding: 18, fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.7, color: 'var(--fg-1)'}}>
<span style={{color: 'var(--fg-3)'}}># vault.toml</span>
<span style={{color: 'var(--accent)'}}>[service]</span>
name = <span style={{color: 'var(--success)'}}>"vault-primary"</span>
image = <span style={{color: 'var(--success)'}}>"rcs/vault:0.14"</span>
port = <span style={{color: 'var(--warning)'}}>8443</span>

<span style={{color: 'var(--accent)'}}>[secrets]</span>
source = <span style={{color: 'var(--success)'}}>"env:VAULT_KEY"</span>

<span style={{color: 'var(--fg-3)'}}>$ rcs deploy vault.toml</span>
<span style={{color: 'var(--fg-3)'}}>→ validating config...</span>
<span style={{color: 'var(--success)'}}>✓ deployed in 2.3s</span>
          </pre>
        </div>
      </div>
    </section>
  );
}

window.CLIShowcase = CLIShowcase;
