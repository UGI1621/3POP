FROM node:26.13.1-slim AS base

# https://pnpm.io/ko/docker
COPY --from=ghcr.io/pnpm/pnpm:12.18.0 /opt/pnpm /opt/pnpm
RUN for bin in pnpm pn pnpx pnx; do ln -s "/opt/pnpm/$bin" "/usr/local/bin/$bin"; done

WORKDIR /app

FROM base AS dev
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/engine/package.json packages/engine/
COPY apps/server/package.json apps/server/
COPY apps/client/package.json apps/client/

RUN --mount=type=cache,id=pnpm,target=/var/cache/pnpm \
  pnpm install --frozen-lockfile --store-dir /var/cache/pnpm

COPY . .

