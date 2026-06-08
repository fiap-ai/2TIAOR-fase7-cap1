"""Knowledge map loader — Phase 2 symptom-disease associations.

Loads `knowledge_map.csv` and provides lookup functions for the chat
and symptoms endpoints.
"""

from __future__ import annotations

import csv
from functools import lru_cache

from src.config import KNOWLEDGE_MAP_PATH


@lru_cache(maxsize=1)
def load_knowledge_map() -> list[dict[str, str]]:
    """Load the symptom-disease knowledge map as a list of dicts."""
    entries: list[dict[str, str]] = []
    with open(KNOWLEDGE_MAP_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            entries.append(dict(row))
    return entries


def get_knowledge_context() -> str:
    """Return a formatted string of the knowledge map for LLM context."""
    entries = load_knowledge_map()
    lines = []
    for e in entries:
        lines.append(
            f"- {e['symptom1']} / {e['symptom2']} → {e['associated_disease']}"
        )
    return "\n".join(lines)


def search_symptoms(query: str) -> list[dict[str, str]]:
    """Search the knowledge map for entries matching a query string."""
    query_lower = query.lower()
    entries = load_knowledge_map()
    return [
        e
        for e in entries
        if query_lower in e["symptom1"].lower()
        or query_lower in e["symptom2"].lower()
        or query_lower in e["associated_disease"].lower()
    ]
