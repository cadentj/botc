FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY apps/server/package.json ./apps/server/
COPY pnpm-workspace.yaml ./

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY . .

# Build the server
WORKDIR /app/apps/server
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/src/db/schema.ts ./src/db/schema.ts
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/apps/server/node_modules ./node_modules

# Create data directory for SQLite
RUN mkdir -p /data && chown nodejs:nodejs /data

USER nodejs

EXPOSE 3000

ENV PORT=3000
ENV DATABASE_URL=/data/botc.db

# Run drizzle-kit push to sync schema, then start the server
CMD ["sh", "-c", "npx drizzle-kit push && node dist/index.js"]
