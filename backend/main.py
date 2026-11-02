import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routes.api import router as api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ecoroute.main")

app = FastAPI(
    title="EcoRoute Optimization API",
    description="Intelligent Waste Collection Route Optimization System for Moshi, Pimpri-Chinchwad, Maharashtra",
    version="1.0.0"
)

# Enable CORS for local React frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

# Serve built React frontend in production if dist exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    logger.info(f"Serving built React frontend from: {frontend_dist}")
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
else:
    @app.get("/")
    def root():
        return {
            "app": "EcoRoute – Intelligent Waste Collection Route Optimization",
            "region": "Moshi, Pimpri-Chinchwad, Maharashtra, India",
            "docs_url": "/docs",
            "api_health": "/api/health"
        }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting EcoRoute backend server on http://127.0.0.1:8000...")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
