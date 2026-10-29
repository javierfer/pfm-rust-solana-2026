# Technical Diagrams — CaféChain

## 1. System Architecture

```mermaid
graph TB
    subgraph "Frontend — Next.js"
        UI[Dashboard / UI]
        WA[Wallet Adapter<br/>Backpack]
    end

    subgraph "Backend off-chain"
        ORC["Open-Meteo Oracle<br/>/api/oracle/weather"]
        MCP["MCP Server<br/>traza-solana-server"]
    end

    subgraph "Blockchain — Solana"
        PROG["Traza Program<br/>Anchor / Rust<br/>f5HoQ1ph…"]
        PDAs["PDAs on-chain<br/>ProgramConfig · RoleRegistry<br/>TraceToken · TraceEvent<br/>Certificate · TokenBalance<br/>PendingTransfer · PendingRole"]
    end

    subgraph "AI Tools"
        AI["OpenCode / Claude<br/>+ MCP Client"]
    end

    UI --> WA
    UI --> ORC
    WA --> PROG
    PROG --> PDAs
    MCP --> PROG
    AI --> MCP

    style UI fill:#61dafb,color:#000
    style PROG fill:#9945FF,color:#fff
    style PDAs fill:#7b2fff,color:#fff
    style ORC fill:#f0a500,color:#000
    style MCP fill:#2d9cdb,color:#fff
    style AI fill:#10b981,color:#fff
```

---

## 2. Roles and Traceability Flow

```mermaid
flowchart LR
    AUTH["🔑 Authority<br/>initialize()<br/>validate_role()<br/>resolve_certificate()"]

    PROD["🌱 Producer<br/>create_token()<br/>add_trace_event()<br/>request_certificate()<br/>initiate_transfer()"]

    FACT["🏭 Factory<br/>create_token()<br/>add_trace_event()<br/>request_certificate()<br/>initiate_transfer()"]

    RET["🏪 Retailer<br/>initiate_transfer()<br/>accept_transfer()"]

    CON["☕ Consumer<br/>accept_transfer()<br/>View full traceability"]

    AUTH -->|"validates role"| PROD
    AUTH -->|"validates role"| FACT
    AUTH -->|"validates role"| RET
    AUTH -->|"validates role"| CON

    PROD -->|"initiate_transfer<br/>accept_transfer"| FACT
    FACT -->|"initiate_transfer<br/>accept_transfer"| RET
    RET  -->|"initiate_transfer<br/>accept_transfer"| CON

    style AUTH fill:#f59e0b,color:#000
    style PROD fill:#10b981,color:#fff
    style FACT fill:#3b82f6,color:#fff
    style RET  fill:#8b5cf6,color:#fff
    style CON  fill:#ef4444,color:#fff
```

---

## 3. Registering a Lot (create_token)

```mermaid
sequenceDiagram
    actor Producer
    participant Frontend
    participant OpenMeteo as "Open-Meteo API<br/>(Oracle)"
    participant Program as "Solana Program<br/>(Anchor)"
    participant Solana

    Producer->>Frontend: Fills in the lot form<br/>(type, farm, country, altitude)
    Frontend->>OpenMeteo: GET /api/oracle/weather?lat=&lon=
    OpenMeteo-->>Frontend: { temperature, humidity }
    Note over Frontend: Oracle fields read-only<br/>oracle_verified = true
    Producer->>Frontend: Confirms transaction
    Frontend->>Program: create_token(metadata, coffee_type,<br/>farm_name, temperature, humidity,<br/>latitude, longitude, …)
    Program->>Program: Checks Producer role
    Program->>Program: Creates TraceToken PDA<br/>Creates TokenBalance PDA
    Program->>Solana: Writes on-chain
    Solana-->>Program: Confirmation
    Program-->>Frontend: Tx signature
    Frontend-->>Producer: Lot registered ✅
```

---

## 4. Transfer Flow (escrow)

```mermaid
sequenceDiagram
    actor Sender as "Sender<br/>(Producer/Factory/Retailer)"
    actor Receiver as "Receiver<br/>(Factory/Retailer/Consumer)"
    participant Program as "Solana Program"

    Sender->>Program: initiate_transfer(amount)
    Program->>Program: Creates PendingTransfer PDA<br/>Debits Sender balance
    Note over Program: Funds in escrow

    Receiver->>Program: accept_transfer()
    Program->>Program: Closes PendingTransfer<br/>Credits Receiver balance
    Note over Program: Transfer complete
    Program-->>Receiver: Balance updated ✅
```

---

## 5. Certification Flow

```mermaid
sequenceDiagram
    actor Requester as "Producer / Factory"
    actor Auth as "Authority"
    participant Program as "Solana Program"

    Requester->>Program: request_certificate(cert_type, notes)
    Program->>Program: Creates Certificate PDA<br/>status = Pending

    Auth->>Program: resolve_certificate(approved, notes)
    Program->>Program: status = Approved / Rejected<br/>resolved_at = timestamp

    Note over Program: One PDA per (mint, cert_type)<br/>Cannot be duplicated
```

---

## 6. On-Chain Data Model

```mermaid
classDiagram
    class ProgramConfig {
        +Pubkey authority
        +bool initialized
        +u8 bump
        +initialize()
    }

    class RoleRegistry {
        +Pubkey wallet
        +Role role
        +i64 validated_at
        +u8 bump
    }

    class PendingRoleRegistration {
        +Pubkey wallet
        +Role requested_role
        +i64 created_at
        +u8 bump
    }

    class TraceToken {
        +Pubkey mint
        +Pubkey creator
        +Role creator_role
        +u64 total_supply
        +TokenStatus status
        +String metadata
        +String coffee_type
        +String farm_name
        +String origin_country
        +u16 altitude_meters
        +Option~i16~ temperature
        +Option~u16~ humidity
        +bool oracle_verified
        +f64 latitude
        +f64 longitude
        +u32 event_count
        +Vec~Pubkey~ source_tokens
    }

    class TokenBalance {
        +Pubkey token_mint
        +Pubkey owner
        +u64 balance
        +i64 last_updated
        +u8 bump
    }

    class TraceEvent {
        +Pubkey token_mint
        +Pubkey recorder
        +EventType event_type
        +String description
        +i64 timestamp
        +Option~i16~ temperature
        +Option~u16~ humidity
        +u32 index
        +u8 bump
    }

    class Certificate {
        +Pubkey token_mint
        +CertType cert_type
        +CertStatus status
        +Pubkey requester
        +Pubkey authority
        +i64 requested_at
        +Option~i64~ resolved_at
        +String notes
        +u8 bump
    }

    class PendingTransfer {
        +Pubkey mint
        +Pubkey from
        +Pubkey to
        +u64 amount
        +i64 created_at
        +u8 bump
    }

    ProgramConfig --> RoleRegistry : validate_role
    RoleRegistry --> TraceToken : creates lot
    TraceToken --> TokenBalance : balance per owner
    TraceToken --> TraceEvent : event history
    TraceToken --> Certificate : certifications
    TokenBalance --> PendingTransfer : transfer escrow
```

---

## 7. MCP Integration — AI Queries

```mermaid
sequenceDiagram
    actor Dev as "Developer"
    participant AI as "OpenCode / Claude"
    participant MCP as "traza-solana-server<br/>(MCP Server)"
    participant Solana as "Solana Program"

    Dev->>AI: "Which lots are registered?"
    AI->>MCP: list_trace_tokens()
    MCP->>Solana: getProgramAccounts(TraceToken)
    Solana-->>MCP: Account list
    MCP-->>AI: Decoded data
    AI-->>Dev: Natural-language answer

    Dev->>AI: "Does lot ABC have certificates?"
    AI->>MCP: list_certificates(mint: "ABC")
    MCP->>Solana: getProgramAccounts(Certificate, filter)
    Solana-->>MCP: Certificates
    MCP-->>AI: Decoded data
    AI-->>Dev: "It has 2 certificates: Quality ✅ and Organic ✅"
```
