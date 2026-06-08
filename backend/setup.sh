#!/usr/bin/env bash
# CardioIA Backend — Environment setup script
# Usage: source setup.sh
#
# Checks for .venv, creates if missing, activates it,
# installs/upgrades dependencies, and copies .env if needed.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Colors ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[setup]${NC} $1"; }
warn()  { echo -e "${YELLOW}[setup]${NC} $1"; }
error() { echo -e "${RED}[setup]${NC} $1"; }

# ── Python check ────────────────────────────────────────────────────────────
if ! command -v python3 &> /dev/null; then
    error "python3 not found. Please install Python 3.10+."
    return 1 2>/dev/null || exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
info "Python version: $PYTHON_VERSION"

# ── Virtual environment ─────────────────────────────────────────────────────
if [ ! -d ".venv" ]; then
    info "Creating virtual environment..."
    python3 -m venv .venv
    info "Virtual environment created."
else
    info "Virtual environment already exists."
fi

# Activate if not already active
if [ -z "$VIRTUAL_ENV" ] || [ "$VIRTUAL_ENV" != "$SCRIPT_DIR/.venv" ]; then
    info "Activating virtual environment..."
    source .venv/bin/activate
else
    info "Virtual environment already active."
fi

# ── Dependencies ────────────────────────────────────────────────────────────
# Check if deps are up to date by comparing requirements.txt hash
HASH_FILE=".venv/.requirements_hash"
CURRENT_HASH=$(md5 -q requirements.txt 2>/dev/null || md5sum requirements.txt | cut -d' ' -f1)

if [ -f "$HASH_FILE" ] && [ "$(cat "$HASH_FILE")" = "$CURRENT_HASH" ]; then
    info "Dependencies are up to date."
else
    info "Installing dependencies..."
    pip install --upgrade pip --quiet
    pip install -r requirements.txt --quiet
    echo "$CURRENT_HASH" > "$HASH_FILE"
    info "Dependencies installed."
fi

# ── .env file ───────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        warn "No .env file found. Copying from .env.example..."
        cp .env.example .env
        warn "Please edit .env and set your OPENROUTER_API_KEY."
    else
        warn "No .env or .env.example found. Some features may not work."
    fi
else
    info ".env file present."
fi

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
info "✅ Backend environment ready!"
info "   Python:  $(python3 --version)"
info "   Venv:    $VIRTUAL_ENV"
info "   Run:     python main.py"
echo ""
