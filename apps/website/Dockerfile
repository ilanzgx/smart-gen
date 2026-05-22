# 1. Base
FROM node:22-alpine AS base
RUN npm i -g pnpm@9
WORKDIR /app

# 2. Dependencias
FROM base AS dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/supabase/package.json ./packages/supabase/
COPY packages/shared/package.json ./packages/shared/
COPY packages/reports/package.json ./packages/reports/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY apps/mobile/package.json ./apps/mobile/
COPY apps/website/package.json ./apps/website/
RUN pnpm install --frozen-lockfile

# 3. Build (Compilação do app)
FROM dependencies AS build-stage
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN pnpm --filter @smart-gen/website build

# 4. Rodar (Servidor ultra-leve para SPA)
FROM node:22-alpine AS run-stage
RUN npm install -g serve
WORKDIR /app
COPY --from=build-stage /app/apps/website/dist ./dist
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]