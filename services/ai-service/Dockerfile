FROM python:3.12-slim AS builder

WORKDIR /build
RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ─── Final image ──────────────────────────────────────────────────────────────
FROM python:3.12-slim

# Security: non-root user
RUN addgroup --gid 1001 polycore && \
    adduser --uid 1001 --gid 1001 --disabled-password --gecos "" polycore

WORKDIR /app

# Copy installed packages
COPY --from=builder /root/.local /home/polycore/.local

# Copy application
COPY --chown=polycore:polycore . .

# Create routers and services __init__.py files
RUN touch routers/__init__.py services/__init__.py

USER polycore

ENV PATH=/home/polycore/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8001

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')" || exit 1

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
