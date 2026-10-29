interface ErrorMessageProps {
  error: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ error, onDismiss }: ErrorMessageProps) {
  return (
    <div style={{
      background: "var(--crimson-dim)",
      border: "1px solid rgba(138,58,58,0.4)",
      color: "#C87A7A",
      padding: "10px 14px",
      borderRadius: 6,
      fontSize: 13,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    }}>
      <span>{error}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ color: "#C87A7A", background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, opacity: 0.7 }}
        >
          ×
        </button>
      )}
    </div>
  );
}
