"""Centralized configuration for the CardioIA Phase 7 backend.

Loads environment variables from `.env` and exposes paths and settings
used across routers and services.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"

MODEL_PATH = MODELS_DIR / "cardio_risk.joblib"
PROTOCOLS_PATH = DATA_DIR / "protocols.json"
KNOWLEDGE_MAP_PATH = DATA_DIR / "knowledge_map.csv"

# ---------------------------------------------------------------------------
# LLM / OpenRouter
# ---------------------------------------------------------------------------

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-4o-mini")

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
