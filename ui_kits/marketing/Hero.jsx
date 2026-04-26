/* global React */

function Eyebrow({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 10
    }}>
      <span style={{width: 20, height: 1, background: 'var(--border-2)'}}/>
      {children}
    </div>
  );
}

function Hero() {
  return (
    <section style={{position: 'relative', padding: '120px 24px 80px', overflow: 'hidden'}}>
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, var(--grid-line) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        maskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
        pointerEvents: 'none'
      }}/>
      {/* Brand glow (dark mode only via CSS var) */}
      <div style={{
        position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 400,
        background: 'radial-gradient(ellipse, rgba(28,28,28,0.06) 0%, transparent 60%)',
        pointerEvents: 'none'
      }}/>

      <div style={{maxWidth: 1100, margin: '0 auto', position: 'relative'}}>
        <Eyebrow>v0.14.2 — signed releases, smaller binary</Eyebrow>
        <h1 style={{
          fontFamily: 'var(--font-sans)', fontWeight: 600,
          fontSize: 'clamp(44px, 7vw, 80px)', lineHeight: 1.02, letterSpacing: '-0.035em',
          color: 'var(--fg-1)', marginTop: 24, marginBottom: 20, maxWidth: 900,
          textWrap: 'balance'
        }}>
          Tools you own.<br/>
          <span style={{color: 'var(--fg-3)'}}>Self-hosted. Open source. Signed.</span>
        </h1>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: 17, lineHeight: 1.55,
          color: 'var(--fg-2)', maxWidth: 560, marginBottom: 36,
          textWrap: 'pretty'
        }}>
          RandomCodeSpace is a set of secure, single-binary services for the infrastructure you run yourself. One download, no daemons, no telemetry.
        </p>

        <div style={{display: 'flex', gap: 10, marginBottom: 48, flexWrap: 'wrap'}}>
          <a href="#" style={{
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            background: 'var(--accent)', color: 'var(--accent-fg)',
            padding: '10px 18px', borderRadius: 4, textDecoration: 'none',
            transition: 'background 140ms var(--ease-out-quart)'
          }}>Get the CLI →</a>
          <a href="#" style={{
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            background: 'var(--bg-1)', color: 'var(--fg-1)',
            border: '1px solid var(--border-2)',
            padding: '10px 18px', borderRadius: 4, textDecoration: 'none',
            transition: 'background 140ms, border-color 140ms'
          }}>Read the docs</a>
        </div>

        {/* Terminal showcase */}
        <div style={{
          background: 'var(--bg-1)', border: '1px solid var(--border-1)',
          borderRadius: 6, maxWidth: 640, overflow: 'hidden',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderBottom: '1px solid var(--border-1)',
            background: 'var(--bg-2)'
          }}>
            <div style={{display: 'flex', gap: 6}}>
              <div style={{width: 10, height: 10, borderRadius: '50%', background: 'var(--fg-4)', opacity: 0.35}}/>
              <div style={{width: 10, height: 10, borderRadius: '50%', background: 'var(--fg-4)', opacity: 0.35}}/>
              <div style={{width: 10, height: 10, borderRadius: '50%', background: 'var(--fg-4)', opacity: 0.35}}/>
            </div>
            <div style={{fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginLeft: 8, letterSpacing: '0.04em', textTransform: 'uppercase'}}>~ install</div>
          </div>
          <pre style={{
            margin: 0, padding: '16px 18px',
            fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.65,
            color: 'var(--fg-1)', whiteSpace: 'pre'
          }}>
<span style={{color: 'var(--accent)'}}>$</span> curl -sSL rcs.sh/install | sh
<span style={{color: 'var(--fg-3)'}}>→ fetching rcs v0.14.2 (9.8 MB)...</span>
<span style={{color: 'var(--fg-3)'}}>→ verifying signature (cosign)...</span>
<span style={{color: 'var(--success)'}}>✓ installed to /usr/local/bin/rcs</span>

<span style={{color: 'var(--accent)'}}>$</span> rcs serve --port 8443
<span style={{color: 'var(--fg-3)'}}>listening on https://0.0.0.0:8443 · started in 180ms</span>
          </pre>
        </div>
      </div>
    </section>
  );
}

window.Hero = Hero;
window.Eyebrow = Eyebrow;
