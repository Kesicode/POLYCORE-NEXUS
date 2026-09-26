"""AI analysis router — code explanation, analysis, optimization, documentation."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from loguru import logger

from services.ai_provider import get_ai_provider

router = APIRouter()


class CodeRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50000, description="Source code to analyze")
    language: str = Field(..., description="Programming language name")
    context: Optional[str] = Field(None, description="Optional additional context")


class CompareRequest(BaseModel):
    code_a: str = Field(..., max_length=50000)
    code_b: str = Field(..., max_length=50000)
    language_a: str
    language_b: str
    task_description: Optional[str] = None


class AIResponse(BaseModel):
    result: str
    provider: str
    is_fallback: bool


@router.post("/explain", response_model=AIResponse)
async def explain_code(req: CodeRequest):
    """Explain what the given code does in plain language."""
    provider = get_ai_provider()
    prompt = (
        f"You are an expert {req.language} developer. "
        f"Explain the following {req.language} code in clear, concise language. "
        f"Describe what it does, how it works, and any important patterns used. "
        f"Keep the explanation friendly for intermediate developers.\n\n"
        f"```{req.language}\n{req.code}\n```"
    )
    try:
        result, provider_name, is_fallback = await provider.generate(prompt)
        return AIResponse(result=result, provider=provider_name, is_fallback=is_fallback)
    except Exception as e:
        logger.error(f"AI explain failed: {e}")
        raise HTTPException(status_code=500, detail="AI analysis temporarily unavailable")


@router.post("/analyze", response_model=AIResponse)
async def analyze_code(req: CodeRequest):
    """Analyze code quality, complexity, and potential issues."""
    provider = get_ai_provider()
    prompt = (
        f"You are an expert {req.language} code reviewer. "
        f"Analyze the following {req.language} code and provide:\n"
        f"1. **Complexity**: Time and space complexity (if applicable)\n"
        f"2. **Code Quality**: Rating from 1-10 with justification\n"
        f"3. **Issues**: Any bugs, anti-patterns, or security concerns\n"
        f"4. **Best Practices**: What's done well\n"
        f"5. **Summary**: One-sentence summary\n\n"
        f"```{req.language}\n{req.code}\n```"
    )
    try:
        result, provider_name, is_fallback = await provider.generate(prompt)
        return AIResponse(result=result, provider=provider_name, is_fallback=is_fallback)
    except Exception as e:
        logger.error(f"AI analyze failed: {e}")
        raise HTTPException(status_code=500, detail="AI analysis temporarily unavailable")


@router.post("/optimize", response_model=AIResponse)
async def optimize_code(req: CodeRequest):
    """Suggest optimizations for the given code."""
    provider = get_ai_provider()
    prompt = (
        f"You are an expert {req.language} performance engineer. "
        f"Suggest concrete optimizations for the following {req.language} code. "
        f"For each suggestion: explain the problem, show the improved code, and estimate the improvement.\n\n"
        f"```{req.language}\n{req.code}\n```"
    )
    try:
        result, provider_name, is_fallback = await provider.generate(prompt)
        return AIResponse(result=result, provider=provider_name, is_fallback=is_fallback)
    except Exception as e:
        logger.error(f"AI optimize failed: {e}")
        raise HTTPException(status_code=500, detail="AI analysis temporarily unavailable")


@router.post("/document", response_model=AIResponse)
async def document_code(req: CodeRequest):
    """Generate documentation and docstrings for the given code."""
    provider = get_ai_provider()
    prompt = (
        f"You are an expert {req.language} technical writer. "
        f"Add comprehensive documentation to the following {req.language} code. "
        f"Include docstrings for functions/classes, inline comments for complex logic, "
        f"and a module-level description. Return the fully documented code.\n\n"
        f"```{req.language}\n{req.code}\n```"
    )
    try:
        result, provider_name, is_fallback = await provider.generate(prompt)
        return AIResponse(result=result, provider=provider_name, is_fallback=is_fallback)
    except Exception as e:
        logger.error(f"AI document failed: {e}")
        raise HTTPException(status_code=500, detail="AI analysis temporarily unavailable")


@router.post("/compare", response_model=AIResponse)
async def compare_code(req: CompareRequest):
    """Compare two code implementations across different languages."""
    provider = get_ai_provider()
    task_ctx = f"Task: {req.task_description}\n\n" if req.task_description else ""
    prompt = (
        f"You are an expert polyglot software engineer. "
        f"Compare these two implementations of the same functionality.\n\n"
        f"{task_ctx}"
        f"**{req.language_a} implementation:**\n```{req.language_a}\n{req.code_a}\n```\n\n"
        f"**{req.language_b} implementation:**\n```{req.language_b}\n{req.code_b}\n```\n\n"
        f"Compare them on: readability, performance characteristics, memory usage, "
        f"idiomatic style, and when you'd choose each approach."
    )
    try:
        result, provider_name, is_fallback = await provider.generate(prompt)
        return AIResponse(result=result, provider=provider_name, is_fallback=is_fallback)
    except Exception as e:
        logger.error(f"AI compare failed: {e}")
        raise HTTPException(status_code=500, detail="AI analysis temporarily unavailable")


@router.get("/status")
async def ai_status():
    """Return which AI providers are currently available."""
    from config import get_settings
    settings = get_settings()

    providers = []
    if settings.gemini_api_key:
        providers.append({"name": "Google Gemini", "priority": 1, "available": True})
    if settings.openai_api_key:
        providers.append({"name": "OpenAI", "priority": 2, "available": True})
    if settings.anthropic_api_key:
        providers.append({"name": "Anthropic", "priority": 3, "available": True})

    if not providers:
        return {
            "available": False,
            "reason": "No AI API keys configured",
            "fallback": True,
            "fallback_description": "Rule-based code analysis is active",
            "providers": [],
        }

    return {
        "available": True,
        "fallback": False,
        "active_provider": providers[0]["name"],
        "providers": providers,
    }
