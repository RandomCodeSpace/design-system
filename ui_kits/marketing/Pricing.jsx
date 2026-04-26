/* global React */

/**
 * "Pricing" section, but the answer is: there isn't any.
 * Everything is free, open source, MIT. No tiers, no upsells, no asterisks.
 *
 * Component is still named `Pricing` to match the marketing-site IA (the URL,
 * the section anchor, the nav link). The contents are an open-source statement
 * with three reinforcing facts.
 */
function Pricing() {
  const facts = [
    {
      label: 'License',
      headline: 'MIT',
      body: 'Use it, fork it, run it in production, ship it inside your own product. No royalties, no per-seat fees, no contact-sales gates.',
      mono: 'LICENSE'
    },
    {
      label: 'Hosting',
      headline: 'Self-hosted',
      body: 'You run it on your hardware, your VPC, your laptop. No SaaS plan, no hosted tier, no usage-metered backend reading your traffic.',
      mono: 'docker compose up'
    },
    {
      label: 'Support',
      headline: 'Community',
      body: 'GitHub Issues, Discussions, and Discord. Maintainers reply when they can. Sponsorships are welcome and earn nothing extra.',
      mono: 'gh issue create'
    }
  ];

  return (
    <section id="pricing" style={{padding: '96px 24px', borderTop: '1px solid var(--border-1)'}}>
      <div style={{maxWidth: 1100, margin: '0 auto'}}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 500, marginBottom: 16
        }}>03 — Free & open</div>

        <h2 style={{
          fontFamily: 'var(--font-sans)', fontWeight: 600,
          fontSize: 56, lineHeight: 1.02, letterSpacing: '-0.032em',
          color: 'var(--fg-1)', marginBottom: 20, textWrap: 'balance', maxWidth: 820
        }}>Free. Open source.<br/>No paid tier, ever.</h2>

        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: 17, lineHeight: 1.55,
          color: 'var(--fg-2)', maxWidth: 640, marginBottom: 56, textWrap: 'pretty'
        }}>
          Every feature is in the repo. Every release is signed and free to download. There is no &ldquo;pro&rdquo; build, no enterprise SKU, no hosted backend you can&rsquo;t see. The whole thing is yours.
        </p>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 48}}>
          {facts.map(f => (
            <div key={f.label} style={{
              background: 'var(--bg-1)',
              border: '1px solid var(--border-1)',
              borderRadius: 6, padding: 28
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em',
                textTransform: 'uppercase', color: 'var(--fg-3)',
                fontWeight: 500, marginBottom: 18
              }}>{f.label}</div>

              <div style={{
                fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 28,
                letterSpacing: '-0.022em', color: 'var(--fg-1)', marginBottom: 12
              }}>{f.headline}</div>

              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: 13.5, lineHeight: 1.55,
                color: 'var(--fg-2)', marginBottom: 20, textWrap: 'pretty'
              }}>{f.body}</p>

              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)',
                background: 'var(--bg-2)', border: '1px solid var(--border-1)',
                borderRadius: 4, padding: '8px 12px', display: 'inline-block'
              }}>{f.mono}</div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          paddingTop: 32, borderTop: '1px solid var(--border-1)'
        }}>
          <a href="#" style={{
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            background: 'var(--accent)', color: 'var(--accent-fg)',
            padding: '10px 16px', borderRadius: 4, textDecoration: 'none',
            transition: 'opacity 140ms var(--ease-out-quart)'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >Get the CLI</a>

          <a href="#" style={{
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            color: 'var(--fg-1)', border: '1px solid var(--border-2)',
            padding: '10px 16px', borderRadius: 4, textDecoration: 'none', background: 'var(--bg-1)',
            transition: 'background 140ms'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-1)'}
          >Star on GitHub</a>

          <a href="#" style={{
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            color: 'var(--fg-2)', padding: '10px 4px', textDecoration: 'none',
            transition: 'color 140ms', marginLeft: 'auto'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--fg-1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-2)'}
          >Sponsor on GitHub →</a>
        </div>
      </div>
    </section>
  );
}

window.Pricing = Pricing;
