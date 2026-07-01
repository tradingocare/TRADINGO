# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install dependencies first (better layer caching)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm --filter @tradingo/api exec prisma generate
RUN pnpm --filter @tradingo/api build

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S tradingo && \
    adduser -S tradingo -u 1001 -G tradingo

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Remove dev dependencies and unnecessary files
RUN rm -rf prisma/migrations node_modules/.cache

# Set ownership to non-root user
RUN chown -R tradingo:tradingo /app

USER tradingo

EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/main"]
