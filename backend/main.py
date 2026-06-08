"""CardioIA Backend — FastAPI application entry point.

Central integrator connecting Web/Mobile frontends to AI engines
(RF model from Phase 6, LLM chat, IoT sensor ingestion).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import HOST, PORT
from src.routers import auth, chat, health, predict, sensors, symptoms

app = FastAPI(
    title="CardioIA API",
    description="Backend integrator for the CardioIA cardiac intelligence platform — Phase 7",
    version="1.0.0",
)

# CORS — allow Web (Vercel) and Mobile (Expo) to consume the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(chat.router)
app.include_router(sensors.router)
app.include_router(symptoms.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
