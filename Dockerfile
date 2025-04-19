FROM node:22-alpine AS dev

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:22-alpine AS prod

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=dev /app/.next/standalone /app
COPY --from=dev /app/.next/static /app/.next/static
COPY --from=dev /app/public /app/public

RUN chown -R appuser:appgroup /app/.next

USER appuser

ENV NODE_ENV=production

CMD ["node", "server.js"]
