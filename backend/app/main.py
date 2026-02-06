from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import (
    companies,
    matters,
    documents,
    admin,
    chatbot,
    legal_data,
    compliance,
    templates,
    reviews,
    settings as settings_routes,
    support,
    team,
    integrations,
    vault,
    analyzer,
    calculator,
    rti,
    news,
)

app = FastAPI(
    title="JurisGPT API",
    description="AI-powered legal services platform for Indian startups and MSMEs",
    version="0.2.0",
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

# Include routers — existing
app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(matters.router, prefix="/api/matters", tags=["matters"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(chatbot.router, prefix="/api/chat", tags=["chatbot"])
app.include_router(legal_data.router, tags=["legal-data"])

# Include routers — new Phase 1 features
app.include_router(compliance.router, tags=["compliance"])
app.include_router(templates.router, tags=["templates"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(settings_routes.router, prefix="/api/settings", tags=["settings"])
app.include_router(support.router, prefix="/api/support", tags=["support"])
app.include_router(team.router, prefix="/api/team", tags=["team"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["integrations"])

# Include routers — Phase 2 features
app.include_router(vault.router, prefix="/api/vault", tags=["vault"])
app.include_router(analyzer.router, prefix="/api/analyzer", tags=["analyzer"])
app.include_router(calculator.router, prefix="/api/calculator", tags=["calculator"])
app.include_router(rti.router, prefix="/api/rti", tags=["rti"])
app.include_router(news.router, prefix="/api/news", tags=["news"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
