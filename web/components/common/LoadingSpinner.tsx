export function LoadingSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <div style={{
        width: 18,
        height: 18,
        border: "1.5px solid var(--divider-strong)",
        borderTopColor: "var(--gold)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
