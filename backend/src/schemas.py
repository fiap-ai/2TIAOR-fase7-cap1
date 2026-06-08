"""Pydantic schemas for request/response validation."""

from __future__ import annotations

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------

class PatientInput(BaseModel):
    """Clinical features expected by the Phase 6 RF model (9 features, pt-BR names)."""
    patient_name: str = Field(default="Paciente", description="Patient name for the report")
    idade: int = Field(ge=1, le=120, description="Age in years")
    frequencia_cardiaca: int = Field(ge=30, le=250, description="Heart rate in BPM")
    spo2: float = Field(ge=50, le=100, description="Blood oxygen saturation (%)")
    pressao_sistolica: int = Field(ge=50, le=250, description="Systolic blood pressure (mmHg)")
    pressao_diastolica: int = Field(ge=30, le=180, description="Diastolic blood pressure (mmHg)")
    glicemia: float = Field(ge=30, le=500, description="Blood glucose (mg/dL)")
    carga_sistema: float = Field(ge=0, le=100, description="System load index")
    disponibilidade_recursos: float = Field(ge=0, le=100, description="Resource availability index")
    historico_cardiopatia: int = Field(ge=0, le=1, description="Heart disease history (0=no, 1=yes)")


class PredictionResponse(BaseModel):
    patient_name: str
    risk_probability: float
    risk_class: str
    protocols: list[dict]
    recommendation_summary: str


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str = Field(description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    response: str
    sources: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Sensors
# ---------------------------------------------------------------------------

class SensorReading(BaseModel):
    temperature: float = Field(description="Body temperature in °C")
    heart_rate: int = Field(description="Heart rate in BPM")
    device_id: str = Field(default="esp32-01")


class SensorAlert(BaseModel):
    status: str
    alert: str | None = None
    reading: SensorReading | None = None


class SensorLatestResponse(BaseModel):
    readings: list[dict]
    count: int
