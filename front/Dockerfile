ARG BUN_VERSION=1.3
FROM oven/bun:${BUN_VERSION}-slim AS base
WORKDIR /app
EXPOSE 3000

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
COPY front ./front
COPY .env ./.env
RUN bun run --cwd front build

FROM build AS dev
ENV CHOKIDAR_USEPOLLING=true
# USER bun
ENTRYPOINT ["bun", "run", "--cwd", "front", "dev", "--host", "0.0.0.0", "--port", "3000"]

FROM base AS release
COPY --from=build /app/front/build ./front/build
COPY --from=build /app/front/package.json ./front/package.json
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/front/node_modules ./front/node_modules
USER bun
ENTRYPOINT ["bun", "run", "--cwd", "front", "start"]
