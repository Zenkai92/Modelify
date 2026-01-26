from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routers import projects, users
from app.database import supabase
import uvicorn
import os
import logging

logger = logging.getLogger(__name__)

# Validation des variables d'environnement critiques au démarrage
REQUIRED_ENV_VARS = ["SUPABASE_URL", "SUPABASE_KEY"]
missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
if missing_vars:
    raise RuntimeError(f"Variables d'environnement manquantes: {', '.join(missing_vars)}")

app = FastAPI(
    title="Modelify API",
    description="API pour la plateforme de demandes de modélisation 3D Modelify",
    version="1.0.0",
)

# Configuration CORS
origins = ["http://localhost:3000", os.getenv("FRONTEND_URL")]  # Default fallback

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in origins if origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Routes
app.include_router(projects.router, prefix="/api", tags=["projects"])
app.include_router(users.router, prefix="/api", tags=["users"])


@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API Modelify", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check avec vérification de la connexion à la base de données"""
    db_status = "connected"
    try:
        # Test de connexion à Supabase
        supabase.table("Users").select("id").limit(1).execute()
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        db_status = "disconnected"
    
    status = "healthy" if db_status == "connected" else "degraded"
    return {"status": status, "database": db_status}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
