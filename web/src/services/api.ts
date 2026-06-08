const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// --- Auth ---

export interface LoginResponse {
  token: string
  user: { name: string; role: string }
}

export function login(username: string, password: string) {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
}

// --- Predict ---

export interface PatientInput {
  idade: number
  frequencia_cardiaca: number
  spo2: number
  pressao_sistolica: number
  pressao_diastolica: number
  glicemia: number
  carga_sistema: number
  disponibilidade_recursos: number
  historico_cardiopatia: number
}

export interface ProtocolItem {
  name: string
  description: string
  priority: string
  actions: string[]
}

export interface PredictResponse {
  patient_name: string
  risk_probability: number
  risk_class: string
  protocols: ProtocolItem[]
  recommendation_summary: string
}

export function predict(data: PatientInput) {
  return request<PredictResponse>("/api/predict", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// --- Chat ---

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatResponse {
  response: string
  sources: string[]
}

export function chat(message: string, history: ChatMessage[]) {
  return request<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  })
}

// --- Sensors ---

export interface SensorReading {
  temperature: number
  heart_rate: number
  device_id: string
  timestamp?: string
  alert?: string | null
}

export interface SensorLatestResponse {
  readings: SensorReading[]
  count: number
}

export function getSensorLatest() {
  return request<SensorLatestResponse>("/api/sensors/latest")
}

// --- Symptoms ---

export interface SymptomEntry {
  symptom: string
  disease: string
  [key: string]: string
}

export function getKnowledgeMap() {
  return request<SymptomEntry[]>("/api/symptoms/knowledge")
}

export function searchSymptoms(query: string) {
  return request<SymptomEntry[]>(`/api/symptoms/search?q=${encodeURIComponent(query)}`)
}

// --- Health ---

export function healthCheck() {
  return request<{ status: string }>("/health")
}
