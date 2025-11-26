##############
# Base Stage #
##############

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

######################
# Dependencies Stage #
######################

FROM base AS deps
WORKDIR /app

# Install python and g++ for better-sqlite3
RUN apk add --no-cache libc6-compat python3 make g++

# Copy files from local filesystem
COPY package.json pnpm-lock.yaml* ./
COPY apps/server/package.json ./apps/server/
COPY pnpm-workspace.yaml ./

# Install pnpm and dependencies
RUN pnpm install --frozen-lockfile

#################
# Builder Stage #
#################

FROM base AS builder
WORKDIR /app

# Copy dependencies from dependencies stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY . .

# Build the server
WORKDIR /app/apps/server
RUN pnpm build

#################
# Runner Stage #
#################

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install build tools for better-sqlite3
RUN apk add --no-cache libc6-compat python3 make g++

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder --chown=nodejs:nodejs /app/apps/server/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/drizzle ./drizzle
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Fresh install to avoid symlink issues
RUN pnpm install --frozen-lockfile --prod=false

# Create data directory for SQLite
RUN mkdir -p /data && chown nodejs:nodejs /data

USER nodejs

EXPOSE 3000

ENV PORT=3000
ENV DATABASE_URL=/data/botc.db

CMD ["sh", "-c", "pnpm exec drizzle-kit migrate && node dist/index.js"]
