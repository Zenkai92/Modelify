from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routers import projects, users
import uvicorn
import os

app = FastAPI(
    title="Modelify API",
    description="API pour la plateforme de demandes de modélisation 3D Modelify",
    version="1.0.0"
)

# Configuration CORS
origins = [
    "http://localhost:3000", # Default fallback
    os.getenv("FRONTEND_URL")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in origins if origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(projects.router, prefix="/api", tags=["projects"])
app.include_router(users.router, prefix="/api", tags=["users"])

@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API Modelify", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)