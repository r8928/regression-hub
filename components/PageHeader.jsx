export default function PageHeader({ eyebrow, title, sub, subStyle, actions }) {
  const header = (
    <div className="page-header" style={actions ? { marginBottom: 0 } : undefined}>
      {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
      <h1 className="page-title">{title}</h1>
      {sub && <p className="page-sub" style={subStyle}>{sub}</p>}
    </div>
  );
  if (!actions) return header;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      {header}
      {actions}
    </div>
  );
}
