import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.models import *  # Import models so they are registered with Base.metadata
from app.api.api import api_router

# Create SQLite tables on startup if in dev/sqlite
try:
    Base.metadata.create_all(bind=engine)
except Exception:
    pass

app = FastAPI(
    title="PrivacyPulse API",
    version="1.0.0",
    description="PrivacyPulse REST API for personal digital-privacy dashboard",
)

# Parse CORS origins
raw_origins = settings.FRONTEND_ORIGIN or "http://localhost:5173"
origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
for default_origin in ["http://localhost:5173", "http://127.0.0.1:5173"]:
    if default_origin not in origins:
        origins.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System"])
def health():
    """Health check endpoint to verify service availability."""
    return {"status": "ok", "app": "PrivacyPulse"}

# Mount API v1 router
app.include_router(api_router)
