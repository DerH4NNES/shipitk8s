FROM node:22-alpine AS dev

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .
COPY .env.local .

RUN npm run build

FROM node:22-alpine AS prod

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=dev /app/.next/standalone /app
COPY --from=dev /app/.next/static /app/.next/static
COPY --from=dev /app/public /app/public
COPY --from=dev /app/.env.local /app

RUN chown -R appuser:appgroup /app/.next

USER appuser

ENV NODE_ENV=production

CMD ["node", "server.js"]
