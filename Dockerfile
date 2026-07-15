FROM node:24-bookworm-slim AS deps
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:24-bookworm-slim AS builder
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 linkshelf \
  && mkdir -p /data/linkshelf \
  && chown -R linkshelf:nodejs /app /data/linkshelf

COPY --from=builder --chown=linkshelf:nodejs /app/public ./public
COPY --from=builder --chown=linkshelf:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=linkshelf:nodejs /app/.next/standalone ./

USER linkshelf

EXPOSE 3000

CMD ["node", "server.js"]
