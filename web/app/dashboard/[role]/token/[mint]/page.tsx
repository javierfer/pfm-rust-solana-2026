"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/context/ProgramProvider";
import { useTraceEvents } from "@/lib/hooks/useTraceEvents";
import { useCertificates } from "@/lib/hooks/useCertificates";
import { addTraceEvent } from "@/lib/solana/instructions";
import { getTraceTokenPDA } from "@/lib/utils/pda";
import { formatAddress } from "@/lib/utils/format";

const ALL_EVENT_TYPES = [
  { label: "Harvest", value: 0 },
  { label: "Processing", value: 1 },
  { label: "Roasting", value: 2 },
  { label: "Packaging", value: 3 },
  { label: "Quality Control", value: 4 },
  { label: "Transport", value: 5 },
  { label: "Storage", value: 6 },
];

// On-chain EventType variants, same order as ALL_EVENT_TYPES
const EVENT_KEYS = ["harvest", "processing", "roasting", "packaging", "qualitycheck", "transport", "storage"];

const ROLE_EVENT_TYPES: Record<string, number[]> = {
  producer: [0, 4, 5, 6],
  factory:  [1, 2, 3, 4, 5, 6],
  retailer: [4, 5, 6],
};

const CERT_LABELS: Record<string, string> = { sanitary: "Health", quality: "Quality", organic: "Organic" };
const CERT_STATUS: Record<string, { color: string; bg: string; label: string }> = {
  pending:  { color: "var(--gold-bright)", bg: "rgba(192,144,56,0.15)", label: "Pending" },
  approved: { color: "#7DC86A", bg: "rgba(74,122,58,0.15)", label: "Approved" },
  rejected: { color: "#C87A7A", bg: "var(--crimson-dim)", label: "Rejected" },
};

const STATUS_LABELS: Record<string, string> = { created: "Created", inTransfer: "In Transfer", accepted: "Accepted" };
const ROLE_LABELS: Record<string, string> = { producer: "Producer", factory: "Roaster", retailer: "Retailer", consumer: "Consumer" };

const fieldStyle: React.CSSProperties = {
  background: "var(--ink-3)",
  border: "1px solid var(--divider-strong)",
  borderRadius: 6,
  color: "var(--text)",
  padding: "8px 12px",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s",
};

export default function TokenDetailPage() {
  const params = useParams();
  const mintStr = params.mint as string;
  const roleParam = params.role as string;
  const eventTypes = ALL_EVENT_TYPES.filter(et =>
    (ROLE_EVENT_TYPES[roleParam] ?? ALL_EVENT_TYPES.map(e => e.value)).includes(et.value)
  );

  const { publicKey } = useWallet();
  const { program } = useProgram();

  const [mint, setMint] = useState<PublicKey | null>(null);
  const [tokenData, setTokenData] = useState<any>(null);
  const [loadingToken, setLoadingToken] = useState(true);
  const [hasBalance, setHasBalance] = useState(false);

  const [eventType, setEventType] = useState(0);
  const [description, setDescription] = useState("");
  const [eventTemp, setEventTemp] = useState("");
  const [eventHumidity, setEventHumidity] = useState("");
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [isFetchingOracle, setIsFetchingOracle] = useState(false);

  const fetchOracleForEvent = async () => {
    if (!tokenData?.latitude || !tokenData?.longitude) {
      setEventError("No coordinates available to query the oracle");
      return;
    }
    setIsFetchingOracle(true);
    setEventError(null);
    try {
      const res = await fetch(`/api/oracle/weather?lat=${tokenData.latitude}&lon=${tokenData.longitude}`);
      const data = await res.json();
      if (data.temperature !== undefined) setEventTemp(data.temperature.toString());
      if (data.humidity !== undefined) setEventHumidity(data.humidity.toString());
    } catch (err) {
      setEventError("Failed to query the oracle");
    } finally {
      setIsFetchingOracle(false);
    }
  };

  useEffect(() => {
    try { setMint(new PublicKey(mintStr)); } catch { setMint(null); }
  }, [mintStr]);

  const { events, loading: eventsLoading, refetch: refetchEvents } = useTraceEvents(mint);
  const { certificates, loading: certsLoading } = useCertificates(mint);

  useEffect(() => {
    if (!program || !mint) return;
    const fetch = async () => {
      try {
        const [pda] = getTraceTokenPDA(mint);
        const data = await program.account.traceToken.fetch(pda);
        setTokenData(data);
        if (publicKey) {
          try {
            const { getTokenBalancePDA } = await import("@/lib/utils/pda");
            const [balPda] = getTokenBalancePDA(mint, publicKey);
            const bal = await program.account.tokenBalance.fetch(balPda);
            setHasBalance(bal.balance.toNumber() > 0);
          } catch { setHasBalance(false); }
        }
      } catch { setTokenData(null); }
      finally { setLoadingToken(false); }
    };
    fetch();
  }, [program, mint, publicKey]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !program || !mint || !tokenData) return;
    setSubmittingEvent(true);
    setEventError(null);
    try {
      const index = tokenData.eventCount ?? 0;
      await addTraceEvent(program, publicKey, mint, index, eventType, description,
        eventTemp ? parseFloat(eventTemp) : null,
        eventHumidity ? parseFloat(eventHumidity) : null
      );
      setDescription(""); setEventTemp(""); setEventHumidity("");
      await refetchEvents();
      const [pda] = getTraceTokenPDA(mint);
      const updated = await program.account.traceToken.fetch(pda);
      setTokenData(updated);
    } catch (err) {
      setEventError(err instanceof Error ? err.message : "Failed to record event");
    } finally {
      setSubmittingEvent(false);
    }
  };

  const normalizeEnum = (v: any) => typeof v === "string" ? v : Object.keys(v || {})[0] || "";

  if (loadingToken) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12, color: "var(--text-2)", fontSize: 13 }}>
        <div style={{ width: 16, height: 16, border: "1.5px solid var(--divider-strong)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Loading lot...
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "var(--text-2)", fontSize: 13 }}>
        Lot not found
      </div>
    );
  }

  const creatorRole = normalizeEnum(tokenData.creatorRole);
  const status = normalizeEnum(tokenData.status);
  const statusInfo = STATUS_LABELS[status] || status;

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      {/* Token header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 36, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: 6 }}>
              {tokenData.metadata}
            </h1>
            <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 12, color: "var(--text-2)" }}>
              <span>{tokenData.coffeeType}</span>
              <span style={{ color: "var(--divider-strong)" }}>·</span>
              <span>{ROLE_LABELS[creatorRole] || creatorRole}</span>
              <span style={{ color: "var(--divider-strong)" }}>·</span>
              <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10 }}>{formatAddress(mintStr)}</span>
              {tokenData.oracleVerified && (
                <>
                  <span style={{ color: "var(--divider-strong)" }}>·</span>
                  <span style={{ 
                    fontSize: 10, 
                    fontWeight: 600, 
                    padding: "2px 8px", 
                    borderRadius: 3, 
                    background: "rgba(74,122,58,0.2)", 
                    color: "#7DC86A",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}>
                    🔮 Oracle Verified
                  </span>
                </>
              )}
            </div>
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: 4,
            background: "rgba(192,144,56,0.12)",
            color: "var(--gold)",
            border: "1px solid var(--gold-dim)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            {statusInfo}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Farm data */}
        <section style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>
            Farm Data
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { label: "Farm", value: tokenData.farmName || "—" },
              { label: "Country", value: tokenData.originCountry || "—" },
              { label: "Altitude", value: tokenData.altitudeMeters ? `${tokenData.altitudeMeters} m` : "—" },
              { label: "Harvest", value: tokenData.harvestDate?.toNumber() ? new Date(tokenData.harvestDate.toNumber() * 1000).toLocaleDateString("en-US") : "—" },
              { label: "Temperature", value: tokenData.temperature !== null && tokenData.temperature !== undefined ? `${tokenData.temperature}°C` : "—" },
              { label: "Humidity", value: tokenData.humidity !== null && tokenData.humidity !== undefined ? `${tokenData.humidity}%` : "—" },
              { label: "Total Supply", value: tokenData.totalSupply?.toNumber()?.toLocaleString() || "—" },
              { label: "Mint", value: formatAddress(mintStr), mono: true },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{
                  fontWeight: 500,
                  color: "var(--text)",
                  fontFamily: item.mono ? "var(--font-jetbrains)" : "inherit",
                  fontSize: item.mono ? 10 : 13,
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Certificates */}
        <section style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>
            Certifications
          </div>
          {certsLoading ? (
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {(["sanitary", "quality", "organic"] as const).map(type => {
                const cert = certificates.find(c => c.certType === type);
                const style = cert ? (CERT_STATUS[cert.status] || CERT_STATUS.pending) : null;
                return (
                  <div key={type} style={{
                    background: "var(--ink-3)",
                    border: "1px solid var(--divider)",
                    borderRadius: 6,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>
                      {CERT_LABELS[type]}
                    </div>
                    {cert && style ? (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 3,
                        background: style.bg,
                        color: style.color,
                        border: `1px solid ${style.color}40`,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        width: "fit-content",
                      }}>
                        {style.label}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 3,
                        background: "rgba(90,74,53,0.2)",
                        color: "var(--text-3)",
                        border: "1px solid rgba(90,74,53,0.4)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        width: "fit-content",
                      }}>
                        No certificate
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Event timeline */}
        <section style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Event Timeline
            </div>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{events.length} records</span>
          </div>

          {eventsLoading ? (
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading events...</div>
          ) : events.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>No events recorded</div>
          ) : (
            <div style={{ position: "relative" }}>
              {/* Vertical line */}
              <div style={{
                position: "absolute",
                left: 12,
                top: 8,
                bottom: 8,
                width: 1,
                background: "var(--divider)",
              }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {events.map((ev, i) => (
                  <div key={ev.index} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                    {/* Dot */}
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--ink-4)",
                      border: `1px solid var(--divider-strong)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontFamily: "var(--font-jetbrains)",
                      color: "var(--gold)",
                      flexShrink: 0,
                      position: "relative",
                      zIndex: 1,
                    }}>
                      {ev.index + 1}
                    </div>
                    <div style={{ flex: 1, paddingBottom: i < events.length - 1 ? 4 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 3,
                          background: "rgba(192,144,56,0.12)",
                          color: "var(--gold)",
                          border: "1px solid var(--gold-dim)",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}>
                          {ALL_EVENT_TYPES[EVENT_KEYS.indexOf(ev.eventType.toLowerCase())]?.label ?? ev.eventType}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                          {new Date(ev.timestamp * 1000).toLocaleString("en-US")}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{ev.description}</div>
                      {(ev.temperature !== null || ev.humidity !== null) && (
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, fontFamily: "var(--font-jetbrains)" }}>
                          {ev.temperature !== null && `${ev.temperature}°C`}
                          {ev.temperature !== null && ev.humidity !== null && " · "}
                          {ev.humidity !== null && `${ev.humidity}% RH`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Register event form */}
        {hasBalance && roleParam !== "consumer" && (
          <section style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 24 }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>
              Record Event
            </div>
            <form onSubmit={handleAddEvent} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {roleParam === "producer" ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Event Type</div>
                      <select
                        value={eventType} onChange={e => setEventType(Number(e.target.value))}
                        style={{ ...fieldStyle, width: "100%", cursor: "pointer" }}
                        onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--gold)"; }}
                        onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--divider-strong)"; }}
                      >
                        {eventTypes.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Temp. (°C)</div>
                      <input type="number" value={eventTemp} readOnly placeholder="From Oracle 🔮"
                        style={{ ...fieldStyle, width: "100%", background: "var(--ink-4)", color: "var(--text-2)", borderStyle: "dashed" }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Humidity (%)</div>
                      <input type="number" value={eventHumidity} readOnly placeholder="From Oracle 🔮" min="0" max="100"
                        style={{ ...fieldStyle, width: "100%", background: "var(--ink-4)", color: "var(--text-2)", borderStyle: "dashed" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      onClick={fetchOracleForEvent}
                      disabled={isFetchingOracle || !tokenData?.latitude || !tokenData?.longitude}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: (isFetchingOracle || !tokenData?.latitude || !tokenData?.longitude) ? "not-allowed" : "pointer",
                        background: (isFetchingOracle || !tokenData?.latitude || !tokenData?.longitude) ? "var(--ink-4)" : "#4A7A3A",
                        color: (isFetchingOracle || !tokenData?.latitude || !tokenData?.longitude) ? "var(--text-3)" : "white",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {isFetchingOracle ? "Querying..." : "🔮 Query Oracle"}
                    </button>
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                      Uses the coordinates of the lot's country of origin
                    </span>
                  </div>
                </>
              ) : (
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Event Type</div>
                  <select
                    value={eventType} onChange={e => setEventType(Number(e.target.value))}
                    style={{ ...fieldStyle, width: "100%", cursor: "pointer" }}
                    onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--gold)"; }}
                    onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--divider-strong)"; }}
                  >
                    {eventTypes.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
                  </select>
                </div>
)}
              <div>
                <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Description *</div>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the event (max. 200 characters)" maxLength={200} rows={2}
                  style={{ ...fieldStyle, width: "100%", resize: "none" }}
                  required
                  onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--gold)"; }}
                  onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--divider-strong)"; }}
                />
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>{description.length}/200</div>
              </div>
              {eventError && (
                <div style={{ padding: "8px 12px", borderRadius: 6, background: "var(--crimson-dim)", border: "1px solid rgba(138,58,58,0.4)", color: "#C87A7A", fontSize: 12 }}>
                  {eventError}
                </div>
              )}
              <button
                type="submit" disabled={submittingEvent || !description}
                style={{
                  padding: "10px 0",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: (submittingEvent || !description) ? "not-allowed" : "pointer",
                  background: (submittingEvent || !description) ? "var(--ink-4)" : "var(--gold)",
                  color: (submittingEvent || !description) ? "var(--text-3)" : "var(--ink)",
                  border: "none",
                  transition: "all 0.15s",
                }}
              >
                {submittingEvent ? "Recording on blockchain…" : "Record Event"}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
