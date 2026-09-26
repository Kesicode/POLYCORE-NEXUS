"""
AI Provider abstraction.
Tries providers in priority order: Gemini → OpenAI → Anthropic → Rule-based fallback.
Never crashes if no AI key is configured.
"""
import asyncio
import re
from typing import Tuple
from loguru import logger


async def _try_gemini(prompt: str, api_key: str) -> str:
    """Call Google Gemini API."""
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    return response.text


async def _try_openai(prompt: str, api_key: str) -> str:
    """Call OpenAI API."""
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key)
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2048,
    )
    return response.choices[0].message.content or ""


async def _try_anthropic(prompt: str, api_key: str) -> str:
    """Call Anthropic Claude API."""
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=api_key)
    response = await client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


def _rule_based_fallback(prompt: str) -> str:
    """
    Rule-based fallback analysis when no AI API key is configured.
    Provides basic structural analysis of code.
    """
    # Extract code from markdown fences if present
    code_match = re.search(r"```\w*\n(.*?)```", prompt, re.DOTALL)
    code = code_match.group(1) if code_match else prompt

    lines = [l for l in code.split("\n") if l.strip()]
    non_comment_lines = [l for l in lines if not l.strip().startswith(("#", "//", "*", "/*", "//"))]

    # Count basic structures
    functions = sum(1 for l in code.split("\n") if re.search(r"\b(def |func |function |fn |void |int |public |private )", l))
    classes = sum(1 for l in code.split("\n") if re.search(r"\b(class |struct |interface |impl )", l))
    imports = sum(1 for l in code.split("\n") if re.search(r"\b(import |require|use |#include|using )", l))
    loops = sum(1 for l in code.split("\n") if re.search(r"\b(for |while |foreach |loop )", l))
    conditions = sum(1 for l in code.split("\n") if re.search(r"\b(if |else |match |switch )", l))

    return (
        f"## Rule-Based Code Analysis\n\n"
        f"> ℹ️ **No AI API key configured.** This is a basic structural analysis.\n"
        f"> Configure `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY` for AI-powered analysis.\n\n"
        f"### Code Metrics\n"
        f"- **Total lines**: {len(lines)}\n"
        f"- **Code lines** (excluding blank/comments): ~{len(non_comment_lines)}\n"
        f"- **Import statements**: {imports}\n"
        f"- **Functions/methods**: ~{functions}\n"
        f"- **Classes/structs**: ~{classes}\n"
        f"- **Loops**: ~{loops}\n"
        f"- **Conditionals**: ~{conditions}\n\n"
        f"### Complexity Estimate\n"
        f"{'High complexity' if functions + conditions + loops > 20 else 'Moderate complexity' if functions + conditions + loops > 10 else 'Low complexity'} "
        f"based on structural analysis.\n\n"
        f"*Configure an AI provider for detailed, language-aware analysis.*"
    )


class AIProvider:
    """Selects and calls the best available AI provider."""

    async def generate(self, prompt: str) -> Tuple[str, str, bool]:
        """
        Generate a response from the best available AI provider.
        Returns: (result_text, provider_name, is_fallback)
        """
        from config import get_settings
        settings = get_settings()

        # Try Gemini first
        if settings.gemini_api_key:
            try:
                result = await asyncio.wait_for(
                    _try_gemini(prompt, settings.gemini_api_key),
                    timeout=30.0,
                )
                return result, "Google Gemini", False
            except Exception as e:
                logger.warning(f"Gemini failed, trying next provider: {e}")

        # Try OpenAI
        if settings.openai_api_key:
            try:
                result = await asyncio.wait_for(
                    _try_openai(prompt, settings.openai_api_key),
                    timeout=30.0,
                )
                return result, "OpenAI", False
            except Exception as e:
                logger.warning(f"OpenAI failed, trying next provider: {e}")

        # Try Anthropic
        if settings.anthropic_api_key:
            try:
                result = await asyncio.wait_for(
                    _try_anthropic(prompt, settings.anthropic_api_key),
                    timeout=30.0,
                )
                return result, "Anthropic", False
            except Exception as e:
                logger.warning(f"Anthropic failed, falling back to rule-based: {e}")

        # Rule-based fallback — always works
        result = _rule_based_fallback(prompt)
        return result, "Rule-based (No AI key)", True


_provider_instance: AIProvider | None = None


def get_ai_provider() -> AIProvider:
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = AIProvider()
    return _provider_instance
