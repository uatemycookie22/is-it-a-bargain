# syntax=docker.io/docker/dockerfile:1
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Build the API routes
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx expo export -p web --no-ssg

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expo

# Install runtime dependencies only
RUN npm install express compression tsx better-sqlite3 drizzle-orm

COPY --from=builder --chown=expo:nodejs /app/dist ./dist
COPY --from=builder --chown=expo:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=expo:nodejs /app/db ./db
COPY --from=builder --chown=expo:nodejs /app/node_modules/expo-server ./node_modules/expo-server
COPY --from=builder --chown=expo:nodejs /app/server.ts ./server.ts

# Create data directory for SQLite with correct permissions
RUN mkdir -p /app/data && chown -R expo:nodejs /app/data

USER expo

EXPOSE 3001

ENV PORT=3001
ENV DATABASE_URL=/app/data/bargain.db

CMD ["npx", "tsx", "server.ts"]
