/* global React, lucide */

function Callout({ tone = 'info', children, title }) {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
  const tones = {
    info: { bg: 'var(--accent-soft)', border: 'rgba(28,28,28,0.18)', icon: 'info', color: 'var(--accent)' },
    warn: { bg: 'rgba(217,142,43,0.08)', border: 'rgba(217,142,43,0.25)', icon: 'alert-triangle', color: 'var(--warning)' },
  };
  const t = tones[tone];
  return (
    <div style={{background: t.bg, border: `1px solid ${t.border}`, borderRadius: 4, padding: '12px 16px', margin: '20px 0', display: 'flex', gap: 12}}>
      <i data-lucide={t.icon} width="16" height="16" strokeWidth="1.5" style={{color: t.color, flexShrink: 0, marginTop: 2}}/>
      <div>
        {title && <div style={{fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', marginBottom: 4}}>{title}</div>}
        <div style={{fontFamily: 'var(--font-sans)', fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-2)'}}>{children}</div>
      </div>
    </div>
  );
}

function CodeBlock({ lang, children }) {
  return (
    <div style={{background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 4, margin: '16px 0', overflow: 'hidden'}}>
      <div style={{padding: '7px 14px', borderBottom: '1px solid var(--border-1)', background: 'var(--bg-2)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)'}}>{lang}</div>
      <pre style={{margin: 0, padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6, color: 'var(--fg-1)', overflowX: 'auto'}}>{children}</pre>
    </div>
  );
}

function Article() {
  return (
    <article style={{padding: '48px 56px 80px', maxWidth: 760}}>
      <div style={{fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 500, marginBottom: 10}}>Getting started · 02</div>
      <h1 style={{fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--fg-1)', margin: '0 0 14px'}}>Deploy your first service</h1>
      <p style={{fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 1.6, color: 'var(--fg-2)', margin: '0 0 28px', textWrap: 'pretty'}}>
        This walkthrough deploys a Vault instance on a single VM. It assumes you have <code>rcs</code> installed and a TLS certificate on disk.
      </p>

      <div style={{display: 'flex', gap: 14, alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', paddingBottom: 20, borderBottom: '1px solid var(--border-1)', marginBottom: 28}}>
        <span>5 min read</span><span>·</span><span>Updated 3d ago</span><span>·</span><span>v0.14</span>
      </div>

      <h2 style={{fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.018em', color: 'var(--fg-1)', margin: '40px 0 12px'}}>1 — Write the config</h2>
      <p style={{fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.65, color: 'var(--fg-2)', margin: '0 0 12px'}}>
        RCS reads a single <code>.toml</code> file. Minimal config for Vault looks like this:
      </p>

      <CodeBlock lang="toml · vault.toml">
{`[service]
name = "vault-primary"
image = "rcs/vault:0.14"
port = 8443

[tls]
cert = "/etc/rcs/certs/vault.crt"
key  = "/etc/rcs/certs/vault.key"

[secrets]
source = "env:VAULT_UNSEAL_KEY"`}
      </CodeBlock>

      <Callout tone="info" title="Config as code">
        Commit this file. <code>rcs deploy</code> is idempotent — running it against the same config is a no-op.
      </Callout>

      <h2 style={{fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.018em', color: 'var(--fg-1)', margin: '40px 0 12px'}}>2 — Deploy</h2>
      <p style={{fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.65, color: 'var(--fg-2)', margin: '0 0 12px'}}>
        Run <code>rcs deploy</code> with the config path. Deploys are synchronous; the command exits when the service is healthy.
      </p>

      <CodeBlock lang="shell">
{`$ rcs deploy vault.toml
→ validating config...
→ pulling rcs/vault:0.14 (9.8 MB)...
→ starting service...
✓ deployed in 2.3s`}
      </CodeBlock>

      <Callout tone="warn" title="TLS is required">
        Services refuse to start on plain HTTP. If you're testing locally, use <code>rcs cert --self-signed</code> to generate a dev cert.
      </Callout>

      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--border-1)'}}>
        <a href="#" style={{fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none'}}>← Install</a>
        <a href="#" style={{fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--accent)', textDecoration: 'none'}}>Configuration →</a>
      </div>
    </article>
  );
}

window.Article = Article;
