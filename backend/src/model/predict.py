"""Cardiac risk prediction using the Phase 6 Random Forest model.

Adapted from Phase 6 `src/model/predict.py` — provides model loading,
inference, and risk classification for the REST API.
"""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

import joblib
import pandas as pd

from src.config import MODEL_PATH, PROTOCOLS_PATH

# Feature columns expected by the trained RF model (Phase 6 contract).
FEATURE_COLUMNS: list[str] = [
    "idade",
    "frequencia_cardiaca",
    "spo2",
    "pressao_sistolica",
    "pressao_diastolica",
    "glicemia",
    "carga_sistema",
    "disponibilidade_recursos",
    "historico_cardiopatia",
]

# Probability thresholds → categorical risk class (from Phase 6).
RISK_THRESHOLDS: tuple[tuple[float, str], ...] = (
    (0.25, "BAIXO"),
    (0.50, "MEDIO"),
    (0.80, "ALTO"),
    (1.01, "CRITICO"),
)


def classify_probability(probability: float) -> str:
    """Map a probability in [0, 1] to BAIXO/MEDIO/ALTO/CRITICO."""
    for upper_bound, label in RISK_THRESHOLDS:
        if probability < upper_bound:
            return label
    return "CRITICO"


@lru_cache(maxsize=1)
def _load_model():
    """Load the serialized RF model (cached)."""
    return joblib.load(MODEL_PATH)


@lru_cache(maxsize=1)
def _load_protocols() -> dict[str, list[dict[str, Any]]]:
    """Load the clinical protocols catalog (keyed by risk class)."""
    with open(PROTOCOLS_PATH) as f:
        return json.load(f)


def predict_risk(patient_data: dict[str, Any]) -> dict[str, Any]:
    """Run inference on patient clinical data.

    Returns dict with probability, risk_class, and matched protocols.
    """
    model = _load_model()

    df = pd.DataFrame([patient_data], columns=FEATURE_COLUMNS)
    probability = float(model.predict_proba(df)[0][1])
    risk_class = classify_probability(probability)

    protocols = _load_protocols()
    matched = protocols.get(risk_class, [])

    return {
        "risk_probability": round(probability, 4),
        "risk_class": risk_class,
        "protocols": matched,
    }
