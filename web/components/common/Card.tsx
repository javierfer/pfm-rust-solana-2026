import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className = "", style }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: "var(--ink-2)",
        border: "1px solid var(--divider)",
        borderRadius: 8,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
