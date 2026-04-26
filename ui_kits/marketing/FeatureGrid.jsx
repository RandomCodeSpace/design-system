/* global React, lucide */

function FeatureGrid() {
  const features = [
    { icon: 'shield', title: 'Signed releases', desc: 'Every binary is signed with cosign and verified on install. No trust bootstrap required.' },
    { icon: 'server', title: 'Single binary', desc: 'Statically linked, under 12 MB. Drop it on a VM and it runs.' },
    { icon: 'key', title: 'Your keys, your keys', desc: 'All secrets stored locally, encrypted at rest. No hosted key escrow, ever.' },
    { icon: 'database', title: 'SQLite state', desc: 'One file to back up. rsync it, snapshot it, move it. No external database needed.' },
    { icon: 'activity', title: 'Structured logs', desc: 'JSON lines to stderr. Pipes into anything. Nothing phones home.' },
    { icon: 'git-branch', title: 'Config as code', desc: 'A single rcs.toml file describes the deployment. Commit it, review it, roll it back.' },
  ];

  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  return (
    <section style={{padding: '80px 24px', borderTop: '1px solid var(--border-1)'}}>
      <div style={{maxWidth: 1100, margin: '0 auto'}}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 500, marginBottom: 16
        }}>01 — What you get</div>
        <h2 style={{
          fontFamily: 'var(--font-sans)', fontWeight: 600,
          fontSize: 40, lineHeight: 1.08, letterSpacing: '-0.028em',
          color: 'var(--fg-1)', marginBottom: 12, maxWidth: 700, textWrap: 'balance'
        }}>Designed for infrastructure you already run.</h2>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 1.55,
          color: 'var(--fg-2)', maxWidth: 600, marginBottom: 56
        }}>No platform. No lock-in. The tool is the product.</p>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '1px solid var(--border-1)', borderRadius: 6, overflow: 'hidden'}}>
          {features.map((f, i) => (
            <div key={f.title} style={{
              padding: 28,
              borderRight: (i % 3 !== 2) ? '1px solid var(--border-1)' : 'none',
              borderBottom: (i < 3) ? '1px solid var(--border-1)' : 'none',
              background: 'var(--bg-1)',
              transition: 'background 220ms var(--ease-out-quart)',
              cursor: 'default'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-1)'}
            >
              <i data-lucide={f.icon} width="22" height="22" strokeWidth="1.5" style={{color: 'var(--accent)', marginBottom: 18, display: 'block'}}/>
              <h3 style={{
                fontFamily: 'var(--font-sans)', fontWeight: 600,
                fontSize: 16, lineHeight: 1.3, letterSpacing: '-0.01em',
                color: 'var(--fg-1)', marginBottom: 8, marginTop: 0
              }}>{f.title}</h3>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: 13.5, lineHeight: 1.55,
                color: 'var(--fg-3)', margin: 0, textWrap: 'pretty'
              }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

window.FeatureGrid = FeatureGrid;
