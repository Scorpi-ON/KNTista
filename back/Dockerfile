ARG BUN_VERSION=1.3
FROM oven/bun:${BUN_VERSION}-slim AS base
ENV NODE_ENV=production \
    PRISMA_ENGINES_CACHE=/tmp/prisma-engines
EXPOSE 5000
WORKDIR /app

FROM base AS prod-deps
COPY package.json bun.lock ./
COPY front/package.json ./front/package.json
COPY back/package.json ./back/package.json
COPY tg/package.json ./tg/package.json
RUN --mount=type=cache,id=bun,target=~/.bun/install/cache \
    bun install --frozen-lockfile --production --ignore-scripts

FROM prod-deps AS deps
RUN --mount=type=cache,id=bun,target=~/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY back ./back
COPY .env ./
RUN bun run --cwd back db:gen && bun run --cwd back build

FROM base AS release
COPY --from=build --chown=bun:bun \
    /app/back/prisma.config.ts \
    /app/back/docker-entrypoint.sh \
    /app/back/package.json \
    ./back/
COPY --from=build --chown=bun:bun /app/back/dist ./back/dist
COPY --from=build --chown=bun:bun /app/back/generated ./back/generated
COPY --from=build --chown=bun:bun /app/back/prisma ./back/prisma
COPY --from=prod-deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=prod-deps --chown=bun:bun /app/back/node_modules ./back/node_modules
WORKDIR /app/back
USER bun
RUN mkdir -p /tmp/prisma-engines \
    && chmod +x ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "run", "start:prod"]
