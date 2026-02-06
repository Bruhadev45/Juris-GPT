from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import companies, matters, documents, admin, chatbot, legal_data

app = FastAPI(
    title="NyayaSetu API",
    description="AI-powered legal services platform for Indian startups and MSMEs",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.environment}

# Include routers
# Auth router removed for now - can be added back later
# app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(matters.router, prefix="/api/matters", tags=["matters"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(chatbot.router, prefix="/api/chat", tags=["chatbot"])
app.include_router(legal_data.router, tags=["legal-data"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
