FROM node:24-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Copy api package files
COPY apps/api/package.json apps/api/package-lock.json ./

# Install external deps
RUN npm ci

# Copy shared package
COPY packages/shared ./packages/shared

# Install shared package
RUN npm install ./packages/shared

# Build the app
FROM base AS builder
WORKDIR /app

# Install openssl for Prisma generate
RUN apt-get update -y && apt-get install -y openssl ca-certificates

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY apps/api ./

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY apps/api/docker-entrypoint.sh ./

USER nestjs

EXPOSE 4000

ENV PORT=4000

ENTRYPOINT ["./docker-entrypoint.sh"]

