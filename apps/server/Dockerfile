FROM node:22-slim AS builder
RUN corepack enable pnpm
WORKDIR /app

# Copy monorepo files needed for workspace resolution
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @org/types build
RUN pnpm --filter @botc/server build

# Create pruned production bundle
RUN pnpm --filter @botc/server deploy --prod /prod

# Production stage
FROM node:22-slim
WORKDIR /app

COPY --from=builder /prod .

EXPOSE 3000
CMD ["node", "dist/index.js"]