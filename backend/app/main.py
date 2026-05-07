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
    drafting,
    auth,
    version_control,
    audit,
    contracts,
    eval as eval_routes,
    cases,
    lawyers,
)

# Import middleware
from app.middleware.rate_limiter import RateLimitMiddleware
from app.middleware.audit_logger import AuditLogMiddleware
from app.middleware.csrf import CSRFMiddleware, csrf_router

app = FastAPI(
    title="JurisGPT API",
    description="AI-powered legal services platform for Indian startups and MSMEs",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware (must be first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CSRF protection middleware (after CORS, before rate limiting)
app.add_middleware(CSRFMiddleware)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Audit logging middleware
app.add_middleware(AuditLogMiddleware)


# ============== Health & Info Endpoints ==============

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": "JurisGPT API",
        "version": "1.0.0",
        "description": "AI-powered legal services for Indian startups",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/api/info")
async def api_info():
    """API information endpoint"""
    return {
        "name": "JurisGPT API",
        "version": "1.0.0",
        "environment": settings.environment,
        "features": {
            "authentication": True,
            "rate_limiting": True,
            "audit_logging": True,
            "document_versioning": True,
            "ai_chat": True,
            "document_generation": True,
            "compliance_tracking": True
        },
        "endpoints": {
            "auth": "/api/auth",
            "chat": "/api/chat",
            "documents": "/api/documents",
            "contracts": "/api/contracts",
            "legal_data": "/api/legal",
            "compliance": "/api/compliance",
            "versions": "/api/versions",
            "audit": "/api/audit"
        }
    }


# ============== CSRF Token Route ==============
app.include_router(csrf_router, prefix="/api", tags=["csrf"])

# ============== Authentication Routes ==============
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])

# ============== Core Business Routes ==============
app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(matters.router, prefix="/api/matters", tags=["matters"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chatbot.router, prefix="/api/chat", tags=["chatbot"])
app.include_router(legal_data.router, tags=["legal-data"])

# ============== Compliance & Templates ==============
app.include_router(compliance.router, tags=["compliance"])
app.include_router(templates.router, tags=["templates"])

# ============== Contract Generation ==============
app.include_router(contracts.router, prefix="/api/contracts", tags=["contracts"])

# ============== Document Management ==============
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(vault.router, prefix="/api/vault", tags=["vault"])
app.include_router(analyzer.router, prefix="/api/analyzer", tags=["analyzer"])
app.include_router(version_control.router, prefix="/api/versions", tags=["version-control"])

# ============== Tools & Utilities ==============
app.include_router(calculator.router, prefix="/api/calculator", tags=["calculator"])
app.include_router(rti.router, prefix="/api/rti", tags=["rti"])
app.include_router(news.router, prefix="/api/news", tags=["news"])
app.include_router(drafting.router, prefix="/api/drafting", tags=["drafting"])

# ============== Admin & Settings ==============
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(settings_routes.router, prefix="/api/settings", tags=["settings"])
app.include_router(support.router, prefix="/api/support", tags=["support"])
app.include_router(team.router, prefix="/api/team", tags=["team"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["integrations"])

# ============== Audit & Monitoring ==============
app.include_router(audit.router, prefix="/api/audit", tags=["audit"])

# ============== Evaluation & Benchmarking ==============
app.include_router(eval_routes.router, prefix="/api/eval", tags=["evaluation"])

# ============== Cases & Lawyers (Real-time Legal Data) ==============
app.include_router(cases.router, tags=["cases"])
app.include_router(lawyers.router, tags=["lawyers"])


# ============== Startup & Shutdown Events ==============

@app.on_event("startup")
async def startup_event():
    """Application startup tasks"""
    print("JurisGPT API starting up...")
    print(f"   Environment: {settings.environment}")
    print(f"   CORS Origins: {settings.cors_origins}")

    # Fail fast if production secrets are missing
    missing = settings.validate_production_secrets()
    if missing:
        msg = f"FATAL: Missing required secrets for production: {', '.join(missing)}"
        print(msg)
        raise RuntimeError(msg)

    print("API ready to accept requests")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks"""
    print("👋 JurisGPT API shutting down...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
