# ── dev: hot-reload for docker-compose local development ─────────────────────
FROM python:3.12-slim AS dev
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /usr/local/bin/uv

# Install venv outside /app so the volume mount doesn't wipe it
ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ── runtime: production-ready image ──────────────────────────────────────────
FROM python:3.12-slim AS runtime
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /usr/local/bin/uv

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH" \
    UV_COMPILE_BYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN useradd --system --no-create-home --shell /sbin/nologin appuser

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project && rm /usr/local/bin/uv

COPY . .
RUN chown -R appuser:appuser /app

USER appuser
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
    CMD python -c "import socket; s=socket.create_connection(('localhost',8000),2); s.close()" || exit 1

# NOTE: replace with gunicorn for production (add gunicorn to pyproject.toml deps)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
