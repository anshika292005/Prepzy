FROM node:22-alpine AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run server:build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S prepzy && adduser -S prepzy -G prepzy
COPY --from=dependencies --chown=prepzy:prepzy /app/node_modules ./node_modules
COPY --from=build --chown=prepzy:prepzy /app/dist ./dist
COPY --chown=prepzy:prepzy package.json ./

USER prepzy
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/health >/dev/null || exit 1

CMD ["node", "dist/server.js"]
