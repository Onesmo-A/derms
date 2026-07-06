import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.imports import router as imports_router
from routers.health import router as health_router
from routers.comparison import router as comparison_router

app = FastAPI(
    title="IDEMS External Results Processing Service",
    description="Generic Results Importer & Pluggable Pipeline Service.",
    version="2.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include generic versioned routers
app.include_router(imports_router)
app.include_router(health_router)
app.include_router(comparison_router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "idems-external-results",
        "version": "2.1.0"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
