/* global React */
function TOC() {
  const items = [
    { label: 'Write the config', active: true },
    { label: 'Deploy', sub: false },
    { label: 'Verify', sub: false },
    { label: 'Next steps', sub: false },
  ];
  return (
    <aside style={{width: 200, height: 'calc(100vh - 56px)', position: 'sticky', top: 56, padding: '48px 24px 24px'}}>
      <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 500, marginBottom: 12}}>On this page</div>
      {items.map(i => (
        <a key={i.label} href="#" style={{
          display: 'block', padding: '4px 0', fontFamily: 'var(--font-sans)', fontSize: 12.5,
          color: i.active ? 'var(--fg-1)' : 'var(--fg-3)',
          fontWeight: i.active ? 500 : 400, textDecoration: 'none',
          borderLeft: i.active ? '2px solid var(--accent)' : '2px solid transparent',
          paddingLeft: 10, marginLeft: -12, transition: 'color 140ms'
        }}>{i.label}</a>
      ))}
    </aside>
  );
}
window.TOC = TOC;
