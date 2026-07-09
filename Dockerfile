FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN cp -r public .next/standalone/public \
  && mkdir -p .next/standalone/.next \
  && cp -r .next/static .next/standalone/.next/static

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache openssl
COPY --from=builder /app ./
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
