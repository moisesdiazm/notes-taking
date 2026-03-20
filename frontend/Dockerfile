# ── deps: install all dependencies ───────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── dev: hot-reload for docker-compose local development ─────────────────────
# Uses node:22 (Debian) instead of alpine so Playwright system deps are available.
# Does its own npm ci + playwright install rather than reusing the alpine deps stage.
FROM node:22 AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npx playwright install --with-deps chromium
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── build: production build ───────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── runtime: minimal production image ────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
    CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["npm", "run", "start"]
