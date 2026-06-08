"""Sensor data ingestion and retrieval endpoints."""

from __future__ import annotations

from collections import deque
from datetime import datetime, timezone

from fastapi import APIRouter

from src.schemas import SensorAlert, SensorLatestResponse, SensorReading

router = APIRouter(prefix="/api/sensors", tags=["sensors"])

# In-memory circular buffer for sensor readings (MVP — no DB).
_readings: deque[dict] = deque(maxlen=100)

# Alert thresholds (from Phase 3 sketch.ino).
_TEMP_WARNING = 37.5
_TEMP_CRITICAL = 38.5
_HR_LOW_WARNING = 50
_HR_LOW_CRITICAL = 40
_HR_HIGH_WARNING = 100
_HR_HIGH_CRITICAL = 120


def _evaluate_alert(temp: float, hr: int) -> str | None:
    """Evaluate sensor data against thresholds and return alert level."""
    if temp >= _TEMP_CRITICAL or hr >= _HR_HIGH_CRITICAL or hr <= _HR_LOW_CRITICAL:
        return "CRITICAL"
    if temp >= _TEMP_WARNING or hr >= _HR_HIGH_WARNING or hr <= _HR_LOW_WARNING:
        return "WARNING"
    return None


@router.post("", response_model=SensorAlert)
async def ingest_sensor_data(body: SensorReading):
    alert = _evaluate_alert(body.temperature, body.heart_rate)

    entry = {
        "temperature": body.temperature,
        "heart_rate": body.heart_rate,
        "device_id": body.device_id,
        "alert": alert,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _readings.append(entry)

    return SensorAlert(status="received", alert=alert, reading=body)


@router.get("/latest", response_model=SensorLatestResponse)
async def get_latest_readings(limit: int = 20):
    recent = list(_readings)[-limit:]
    return SensorLatestResponse(readings=recent, count=len(recent))
