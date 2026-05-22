export default function EmptyState({ icon, title, children, style }) {
  if (!icon && !title) {
    return <div className="empty-state" style={style}>{children}</div>;
  }
  return (
    <div className="empty-state" style={style}>
      {icon && <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>}
      {title && <strong>{title}</strong>}
      {children}
    </div>
  );
}
