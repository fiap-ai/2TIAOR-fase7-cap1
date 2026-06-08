"""Mock authentication endpoint."""

import secrets

from fastapi import APIRouter, HTTPException

from src.schemas import LoginRequest, LoginResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Mock credentials
_VALID_USERNAME = "admin"
_VALID_PASSWORD = "cardioai"


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    if body.username != _VALID_USERNAME or body.password != _VALID_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return LoginResponse(
        token=f"mock-jwt-{secrets.token_hex(16)}",
        user={"name": "Dr. Admin", "role": "cardiologist"},
    )
