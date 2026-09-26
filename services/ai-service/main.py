"""
PolyCore Nexus — AI Service
FastAPI service providing AI-powered code analysis and statistical analytics.
"""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from prometheus_client import make_asgi_app

from config import get_settings
from routers import ai, analytics, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    settings = get_settings()
    logger.info(
        "Starting PolyCore Nexus AI Service",
        service="ai-service",
        port=settings.port,
        environment=settings.environment,
    )
    
    # Log which AI providers are configured
    providers = []
    if settings.gemini_api_key:
        providers.append("Gemini")
    if settings.openai_api_key:
        providers.append("OpenAI")
    if settings.anthropic_api_key:
        providers.append("Anthropic")
    
    if providers:
        logger.info(f"AI providers available: {', '.join(providers)}")
    else:
        logger.warning(
            "No AI API keys configured. Running in rule-based fallback mode. "
            "Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY to enable AI features."
        )
    
    yield
    
    logger.info("AI Service shutting down")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="PolyCore Nexus — AI Service",
        description="AI-powered code analysis and statistical analytics",
        version="1.0.0",
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url="/redoc" if settings.environment != "production" else None,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins.split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(health.router, tags=["Health"])
    app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])
    app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])

    # Prometheus metrics endpoint
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower(),
    )
