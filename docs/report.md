# CardioIA — Technical Report

> Phase 7: Full Cardiac Intelligence Platform
> 2TIAOR — FIAP 2026

---

## 1. Introduction

CardioIA Phase 7 consolidates all previous phases into a unified Full Cardiac Intelligence Platform. The project transitions from isolated AI modules to an integrated digital product: a web dashboard, mobile app, Python backend, and IoT sensor layer — all connected through a single REST API.

## 2. Architecture Overview

The platform follows a hub-and-spoke architecture with the **FastAPI backend** as the central hub:

- **IoT Layer** (MicroPython on ESP32/Wokwi) → sends sensor data to backend
- **Backend** (FastAPI on Render) → orchestrates AI engines, serves REST API
- **Web** (React + Vite + shadcn/ui on Vercel) → consumes API, renders dashboard
- **Mobile** (React Native + Expo) → same API consumption, native Android experience

> See `docs/architecture.md` for the full Mermaid diagram.

## 3. Backend Integrator

The FastAPI backend exposes 7 endpoint groups:

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Service health check |
| `POST /api/auth/login` | Mock authentication (admin/cardioai) |
| `POST /api/predict` | Cardiac risk prediction using Phase 6 RF model |
| `POST /api/chat` | LLM-powered cardiac assistant via OpenRouter |
| `POST /api/sensors` | IoT sensor data ingestion |
| `GET /api/sensors/latest` | Retrieve latest sensor readings |
| `GET /api/symptoms/*` | Knowledge base search (Phase 2 data) |

**Key design decisions:**
- OpenRouter API key lives exclusively on the backend (Render env vars)
- The RF model (`cardio_risk.joblib`) is loaded once at startup
- Sensor data is stored in-memory (deque of 100 readings) for MVP simplicity
- CORS is configured for both local dev and production origins

## 4. IoT Module (MicroPython)

The Phase 3 Arduino C++ sketch (1475 lines) was converted to MicroPython (~290 lines) for the ESP32, simulated on Wokwi:

- **DHT22** — temperature sensor
- **Potentiometer** — simulates heart rate (mapped to 40-180 BPM)
- **SSD1306 OLED** — displays real-time readings
- **3 LEDs** (Green/Yellow/Red) — visual alert based on thresholds
- **HTTP POST** — sends readings to backend every 3 seconds

Thresholds trigger alerts: high temperature (>38°C), abnormal heart rate (<50 or >120 BPM).

## 5. Web Dashboard

Built with React 18 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui:

- **Login** — mock authentication with session persistence
- **Dashboard** — sensor monitoring cards (temperature, heart rate, IoT alerts), risk prediction form with 6 clinical inputs, protocol recommendations
- **Chat** — conversational AI assistant with message history

Deployed on Vercel with `vercel.json` configured for SPA route rewrites.

## 6. Mobile App

Built with React Native + Expo SDK 56 + React Native Paper (Material Design 3):

- Same feature set as web: Login → Dashboard → Chat
- Environment configured via `app.config.js` + `.env` (`EXPO_PUBLIC_API_URL`)
- APK generated via EAS Build (`eas.json` preview profile)
- Android package: `br.com.fiap.cardioai`

## 7. Cross-Phase Integration

| Phase | Artifact | Integration Point |
|-------|----------|-------------------|
| Phase 2 | `knowledge_map.csv` | Chat context enrichment + symptom search API |
| Phase 3 | `sketch.ino` | Converted to MicroPython `main.py` |
| Phase 6 | `cardio_risk.joblib` | `/api/predict` endpoint |
| Phase 6 | `protocols.json` | Risk-based clinical recommendations |

## 8. Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Backend | Render (free tier) | https://twotiaor-fase7-cap1.onrender.com |
| Web | Vercel | _See README.md_ |
| Mobile | Expo EAS Build | _APK download link in README.md_ |
| IoT | Wokwi | https://wokwi.com/projects/466225873706038273 |

## 9. Conclusion

Phase 7 demonstrates the full lifecycle of an AI-powered healthcare platform: from edge sensor data collection (IoT/MicroPython), through backend orchestration (FastAPI/Python), to user-facing interfaces (React web + React Native mobile). The architecture prioritizes security (API keys backend-only), simplicity (single REST API for all clients), and cross-phase reuse of previously developed AI models and knowledge bases.
