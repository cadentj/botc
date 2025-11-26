FROM node:22-slim AS builder
RUN corepack enable pnpm
WORKDIR /app

# Copy monorepo files needed for workspace resolution
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @botc/server build

# Create pruned production bundle
RUN pnpm --filter @botc/server deploy --prod /prod

# Production stage
FROM node:22-slim
RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy deployed bundle and migration files
COPY --from=builder /prod .
COPY --from=builder /app/apps/server/drizzle ./drizzle

EXPOSE 3000
CMD ["node", "dist/index.js"]

