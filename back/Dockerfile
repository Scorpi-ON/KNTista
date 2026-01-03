ARG BUN_VERSION=1.3
FROM oven/bun:${BUN_VERSION}-slim AS base
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
WORKDIR /app/back
ENV NODE_ENV=production
RUN bun run db:gen
RUN bun run build

FROM base AS release
ENV NODE_ENV=production
ENV PRISMA_ENGINES_CACHE=/tmp/prisma-engines
COPY --from=build /app/back/prisma.config.ts ./back/prisma.config.ts
COPY --from=build /app/back/dist ./back/dist
COPY --from=build /app/back/generated ./back/generated
COPY --from=build /app/back/prisma ./back/prisma
COPY --from=build /app/back/docker-entrypoint.sh ./back/docker-entrypoint.sh
COPY --from=build /app/back/package.json ./back/package.json
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/back/node_modules ./back/node_modules
WORKDIR /app/back
RUN mkdir -p /tmp/prisma-engines \
    && chmod +x ./docker-entrypoint.sh \
    && chown -R bun:bun /app /tmp/prisma-engines
USER bun
EXPOSE 5000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "run", "start:prod"]
