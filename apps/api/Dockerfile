# ===========================
# Stage 1 : Builder
# ===========================
FROM node:24-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy dependency manifests first (layer caching)
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/ ./packages/
RUN find packages -name "package.json" -maxdepth 2 | head -20

# Install dependencies (cached unless lockfile changes)
RUN pnpm install --frozen-lockfile

# Now copy source code
COPY apps/api ./apps/api
COPY prisma ./prisma

# Generate Prisma client (from repo root so apps/api/prisma.config.ts stays out of scope)
RUN npx prisma generate --schema=/app/prisma/schema.prisma

# Build API
RUN pnpm --filter @tradingo/api build

# ===========================
# Stage 2 : Migration runner (optional init container)
# ===========================
FROM node:24-alpine AS migration

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apk add --no-cache curl postgresql16-client

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

COPY scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main"]

# ===========================
# Stage 3 : Runner
# ===========================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

RUN apk add --no-cache curl

# Non-root user
RUN addgroup -S tradingo -g 1001 && \
    adduser -S tradingo -u 1001 -G tradingo

# Copy production files (preserve pnpm layout so relative symlinks resolve)
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/prisma ./prisma

# Permissions
RUN chown -R tradingo:tradingo /app

USER tradingo

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
CMD curl -f http://localhost:3001/health || exit 1

CMD ["node","apps/api/dist/main.js"]