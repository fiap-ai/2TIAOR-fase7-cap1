# CardioIA — Architecture Diagram

> Phase 7: Full Cardiac Intelligence Platform

## System Architecture (Mermaid)

```mermaid
flowchart TB
    subgraph IoT["🔌 IoT Layer (MicroPython)"]
        ESP32["ESP32 — Wokwi Simulator"]
        DHT22["DHT22 Sensor<br/>(Temperature)"]
        POT["Potentiometer<br/>(Heart Rate sim)"]
        OLED["SSD1306 OLED<br/>Display"]
        LEDs["3x LEDs<br/>(Green/Yellow/Red)"]
        DHT22 --> ESP32
        POT --> ESP32
        ESP32 --> OLED
        ESP32 --> LEDs
    end

    subgraph Backend["⚙️ Backend (FastAPI on Render)"]
        API["REST API<br/>twotiaor-fase7-cap1.onrender.com"]
        AUTH["/api/auth/login<br/>Mock Auth"]
        PREDICT["/api/predict<br/>RF Model"]
        CHAT["/api/chat<br/>LLM Proxy"]
        SENSORS["/api/sensors<br/>IoT Ingest"]
        SYMPTOMS["/api/symptoms<br/>Knowledge Base"]
        HEALTH["/health"]

        API --- AUTH
        API --- PREDICT
        API --- CHAT
        API --- SENSORS
        API --- SYMPTOMS
        API --- HEALTH
    end

    subgraph AI["🧠 AI Engines"]
        RF["Random Forest<br/>cardio_risk.joblib<br/>(Phase 6)"]
        KB["knowledge_map.csv<br/>34 symptom-disease<br/>(Phase 2)"]
        PROTO["protocols.json<br/>Clinical Protocols"]
        LLM["OpenRouter API<br/>GPT-4o-mini"]
    end

    subgraph Frontend["🖥️ Frontend Layer"]
        WEB["Web Dashboard<br/>React + Vite + shadcn/ui<br/>(Vercel)"]
        MOBILE["Mobile App<br/>React Native + Expo<br/>(EAS Build APK)"]
    end

    subgraph User["👤 End User"]
        BROWSER["Browser"]
        PHONE["Android Device"]
    end

    %% Data flows
    ESP32 -->|"HTTP POST /api/sensors"| SENSORS
    WEB -->|"REST API calls"| API
    MOBILE -->|"REST API calls"| API

    PREDICT --> RF
    PREDICT --> PROTO
    CHAT --> LLM
    CHAT --> KB
    SYMPTOMS --> KB

    BROWSER --> WEB
    PHONE --> MOBILE

    %% Styling
    classDef iot fill:#10B981,stroke:#059669,color:#fff
    classDef backend fill:#3B82F6,stroke:#2563EB,color:#fff
    classDef ai fill:#8B5CF6,stroke:#7C3AED,color:#fff
    classDef frontend fill:#F59E0B,stroke:#D97706,color:#fff
    classDef user fill:#6B7280,stroke:#4B5563,color:#fff

    class ESP32,DHT22,POT,OLED,LEDs iot
    class API,AUTH,PREDICT,CHAT,SENSORS,SYMPTOMS,HEALTH backend
    class RF,KB,PROTO,LLM ai
    class WEB,MOBILE frontend
    class BROWSER,PHONE user
```

## Data Flow Description

```
┌─────────────┐     HTTP POST        ┌──────────────────┐
│  ESP32/IoT  │ ──────────────────→  │  FastAPI Backend  │
│  (Wokwi)    │  /api/sensors        │  (Render)         │
└─────────────┘                      │                   │
                                     │  ┌─────────────┐  │
┌─────────────┐     REST API         │  │ RF Model    │  │
│  Web App    │ ──────────────────→  │  │ (Phase 6)   │  │
│  (Vercel)   │  /api/predict        │  └─────────────┘  │
│             │  /api/chat           │                   │
│             │  /api/sensors/latest  │  ┌─────────────┐  │
└─────────────┘                      │  │ OpenRouter   │  │
                                     │  │ (LLM Proxy)  │  │
┌─────────────┐     REST API         │  └─────────────┘  │
│  Mobile App │ ──────────────────→  │                   │
│  (Expo APK) │  Same endpoints     │  ┌─────────────┐  │
└─────────────┘                      │  │ Knowledge   │  │
                                     │  │ Map (Ph. 2) │  │
                                     │  └─────────────┘  │
                                     └──────────────────┘
```

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **API key backend-only** | OpenRouter key stored exclusively on Render env vars. Frontend never holds secrets. |
| **Single REST API** | Both web and mobile consume the same `/api/*` endpoints — no duplication. |
| **Mock auth** | Simplified for MVP: `admin`/`cardioai` returns a JWT-like token. |
| **In-memory sensor store** | Lightweight for demo; last 100 readings kept in a deque. |
| **Wokwi for IoT** | No physical hardware needed; ESP32 + MicroPython simulated in browser. |
| **OpenRouter as LLM proxy** | Model-agnostic: switch between GPT-4o-mini, Claude, etc. via env var. |

## Cross-Phase Integration Map

| Phase | Artifact | Reuse in Phase 7 |
|-------|----------|-------------------|
| Phase 2 | `knowledge_map.csv` (34 symptom-disease associations) | Backend — chat enrichment & symptom search |
| Phase 3 | `sketch.ino` (ESP32 C++, 1475 lines) | IoT — direct conversion to MicroPython (~290 lines) |
| Phase 6 | `cardio_risk.joblib` (Random Forest model) | Backend — `/api/predict` risk prediction |
| Phase 6 | `protocols.json` (clinical protocols) | Backend — risk-based recommendations |
