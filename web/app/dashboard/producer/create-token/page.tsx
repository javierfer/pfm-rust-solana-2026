"use client";

import { useState } from "react";
import { Keypair } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useProgram } from "@/lib/context/ProgramProvider";
import { createToken } from "@/lib/solana/instructions";

const COFFEE_TYPES = ["Arabica", "Robusta", "Blend", "Geisha", "Bourbon", "Typica", "Caturra", "Catuai", "Pacamara", "Maragogype", "SL28", "Yellow Bourbon"];
const ORIGIN_COUNTRIES = ["Colombia", "Ethiopia", "Brazil", "Vietnam", "Honduras", "Peru", "Guatemala", "Mexico", "Indonesia", "Kenya"];

const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  Colombia: { lat: 4.5709, lon: -74.2973 },
  Ethiopia: { lat: 9.145, lon: 40.4897 },
  Brazil: { lat: -14.235, lon: -51.9253 },
  Vietnam: { lat: 14.0583, lon: 108.2772 },
  Honduras: { lat: 15.2, lon: -86.2419 },
  Peru: { lat: -9.19, lon: -75.0152 },
  Guatemala: { lat: 15.7835, lon: -90.2308 },
  Mexico: { lat: 23.6345, lon: -102.5528 },
  Indonesia: { lat: -0.7893, lon: 113.9213 },
  Kenya: { lat: -0.0236, lon: 37.9062 },
};

const fieldStyle: React.CSSProperties = {
  background: "var(--ink-3)",
  border: "1px solid var(--divider-strong)",
  borderRadius: 6,
  color: "var(--text)",
  padding: "10px 14px",
  width: "100%",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "var(--text-3)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  marginBottom: 6,
};

const readonlyStyle: React.CSSProperties = {
  ...fieldStyle,
  background: "var(--ink-4)",
  color: "var(--text-2)",
  borderStyle: "dashed",
  borderColor: "var(--divider)",
  cursor: "not-allowed",
};

export default function CreateTokenPage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { program } = useProgram();

  const [metadata, setMetadata] = useState("");
  const [amount, setAmount] = useState("");
  const [coffeeType, setCoffeeType] = useState("Arabica");
  const [farmName, setFarmName] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [originCountry, setOriginCountry] = useState("Colombia");
  const [altitudeMeters, setAltitudeMeters] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isFetchingOracle, setIsFetchingOracle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOriginCountryChange = (country: string) => {
    setOriginCountry(country);
    const coords = COUNTRY_COORDS[country];
    if (coords) {
      setLatitude(coords.lat.toString());
      setLongitude(coords.lon.toString());
    }
  };

  const fetchOracleData = async () => {
    if (!latitude || !longitude) {
      setError("Enter latitude and longitude first");
      return;
    }
    setIsFetchingOracle(true);
    setError(null);
    try {
      const res = await fetch(`/api/oracle/weather?lat=${latitude}&lon=${longitude}`);
      const data = await res.json();
      if (data.temperature !== undefined) setTemperature(data.temperature.toString());
      if (data.humidity !== undefined) setHumidity(data.humidity.toString());
    } catch (err) {
      setError("Failed to query the oracle");
    } finally {
      setIsFetchingOracle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !program) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const mint = Keypair.generate();
      const harvestTs = harvestDate ? Math.floor(new Date(harvestDate).getTime() / 1000) : 0;
      await createToken(program, publicKey, mint, {
        amount: BigInt(amount),
        metadata,
        coffeeType,
        farmName,
        harvestDate: harvestTs,
        originCountry,
        altitudeMeters: parseInt(altitudeMeters) || 0,
        temperature: temperature ? parseFloat(temperature) : null,
        humidity: humidity ? parseFloat(humidity) : null,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
      });
      router.push("/dashboard/producer/my-tokens");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create the lot");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 24, background: "#4A7A3A", borderRadius: 2 }} />
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 38, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Register New Lot
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginLeft: 13 }}>
          Mint a traceability token with all of the lot's origin data
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Identification */}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>
              Identification
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Lot Name *</label>
                <input
                  type="text" value={metadata} onChange={e => setMetadata(e.target.value)}
                  placeholder="e.g. Organic Coffee Lot 001" maxLength={256}
                  style={fieldStyle} required
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold)"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--divider-strong)"; }}
                />
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>{metadata.length}/256</div>
              </div>
              <div>
                <label style={labelStyle}>Quantity (units) *</label>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 1000" min="1"
                  style={fieldStyle} required
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold)"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--divider-strong)"; }}
                />
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--divider)" }} />

          {/* Origin */}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>
              Origin Data
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Coffee Type *</label>
                <select value={coffeeType} onChange={e => setCoffeeType(e.target.value)} style={fieldStyle}>
                  {COFFEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Country of Origin *</label>
                <select value={originCountry} onChange={e => handleOriginCountryChange(e.target.value)} style={fieldStyle}>
                  {ORIGIN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Farm Name *</label>
                <input
                  type="text" value={farmName} onChange={e => setFarmName(e.target.value)}
                  placeholder="e.g. La Esperanza Farm" maxLength={64}
                  style={fieldStyle} required
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold)"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--divider-strong)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Harvest Date</label>
                <input
                  type="date" value={harvestDate} onChange={e => setHarvestDate(e.target.value)}
                  style={fieldStyle}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold)"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--divider-strong)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Altitude (meters)</label>
                <input
                  type="number" value={altitudeMeters} onChange={e => setAltitudeMeters(e.target.value)}
                  placeholder="e.g. 1800" min="0" max="4000"
                  style={fieldStyle}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold)"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--divider-strong)"; }}
                />
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--divider)" }} />

          {/* Environmental conditions */}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>
              Environmental Conditions and Location
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Latitude (auto)</label>
                <input
                  type="number" value={latitude} readOnly
                  placeholder="Assigned automatically"
                  style={readonlyStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Longitude (auto)</label>
                <input
                  type="number" value={longitude} readOnly
                  placeholder="Assigned automatically"
                  style={readonlyStyle}
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <button
                  type="button"
                  onClick={fetchOracleData}
                  disabled={isFetchingOracle || !latitude || !longitude}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: (isFetchingOracle || !latitude || !longitude) ? "not-allowed" : "pointer",
                    background: (isFetchingOracle || !latitude || !longitude) ? "var(--ink-4)" : "#4A7A3A",
                    color: (isFetchingOracle || !latitude || !longitude) ? "var(--text-3)" : "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {isFetchingOracle ? "Querying oracle..." : "🔮 Query Oracle (Open-Meteo)"}
                </button>
              </div>
              <div>
                <label style={labelStyle}>Temperature (°C) - From Oracle 🔮</label>
                <input
                  type="number" value={temperature} readOnly
                  placeholder="Click Query Oracle" step="0.1"
                  style={readonlyStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Humidity (%) - From Oracle 🔮</label>
                <input
                  type="number" value={humidity} readOnly
                  placeholder="Click Query Oracle" min="0" max="100" step="0.1"
                  style={readonlyStyle}
                />
              </div>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 8 }}>
              Temperature and humidity are fetched automatically from the oracle (Open-Meteo external API) using the farm's coordinates. <em style={{ color: "var(--gold-dim)" }}>Note: this implementation uses an external API. For production, an on-chain oracle such as Pyth or Switchboard is recommended.</em>
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 6, background: "var(--crimson-dim)", border: "1px solid rgba(138,58,58,0.4)", color: "#C87A7A", fontSize: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={isSubmitting || !metadata || !amount || !farmName}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: (isSubmitting || !metadata || !amount || !farmName) ? "not-allowed" : "pointer",
                background: (isSubmitting || !metadata || !amount || !farmName) ? "var(--ink-4)" : "var(--gold)",
                color: (isSubmitting || !metadata || !amount || !farmName) ? "var(--text-3)" : "var(--ink)",
                border: "none",
                transition: "all 0.15s",
              }}
            >
              {isSubmitting ? "Recording on blockchain…" : "Register Lot on Blockchain"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ padding: "11px 24px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "transparent", color: "var(--text-2)", border: "1px solid var(--divider-strong)", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-dim)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--divider-strong)"; }}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
