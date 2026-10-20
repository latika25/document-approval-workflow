# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json yarn.lock ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN yarn install --frozen-lockfile

COPY tsconfig.base.json ./
COPY backend backend
COPY frontend frontend
RUN yarn build

FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    STATIC_DIR=/app/frontend/dist \
    UPLOAD_DIR=/app/data/uploads \
    EMBEDDED_DB_DIR=/app/data/pglite
WORKDIR /app

# Yarn 1 installs root devDependencies even with --production in a workspace, so drop them first.
COPY package.json yarn.lock ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));delete p.devDependencies;fs.writeFileSync('package.json',JSON.stringify(p,null,2))" \
 && yarn install --frozen-lockfile --production \
 && yarn cache clean

COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/dist ./frontend/dist
RUN mkdir -p /app/data && chown node:node /app/data

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "backend/dist/server.js"]
