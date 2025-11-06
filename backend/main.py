from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routers import projects
import uvicorn

app = FastAPI(
    title="Modelify API",
    description="API pour la plateforme de demandes de modélisation 3D Modelify",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(projects.router, prefix="/api", tags=["projects"])

@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API Modelify", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)