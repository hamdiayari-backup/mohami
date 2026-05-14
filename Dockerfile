# syntax=docker/dockerfile:1
# -----------------------------------------------------------------------------
# Build: Vite production bundle → /app/dist
# Run:  nginx:alpine serves static files for https://mouhami-ai.tn/
#
# Recommended (keys stay out of image layers; requires BuildKit):
#   docker build --secret id=env,src=.env -t mouhami-ai:web .
#
# Alternative — build-args (visible in `docker history`; use CI masked vars):
#   docker build \
#     --build-arg GEMINI_API_KEY=... \
#     --build-arg DATABASE_URL=... \
#     -t mouhami-ai:web .
# -----------------------------------------------------------------------------

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Values used by vite.config.ts → loadEnv + define (baked into the client bundle)
ARG GEMINI_API_KEY=""
ARG DATABASE_URL=""
ARG EMAILJS_SERVICE_ID=""
ARG EMAILJS_TEMPLATE_ID=""
ARG EMAILJS_PUBLIC_KEY=""
ARG SMTP_HOST=""
ARG SMTP_PORT=""
ARG SMTP_USER=""
ARG SMTP_PASSWORD=""
ARG MAIL_FROM_ADDRESS=""
ARG MAIL_FROM_NAME=""

ENV GEMINI_API_KEY=${GEMINI_API_KEY} \
    DATABASE_URL=${DATABASE_URL} \
    EMAILJS_SERVICE_ID=${EMAILJS_SERVICE_ID} \
    EMAILJS_TEMPLATE_ID=${EMAILJS_TEMPLATE_ID} \
    EMAILJS_PUBLIC_KEY=${EMAILJS_PUBLIC_KEY} \
    SMTP_HOST=${SMTP_HOST} \
    SMTP_PORT=${SMTP_PORT} \
    SMTP_USER=${SMTP_USER} \
    SMTP_PASSWORD=${SMTP_PASSWORD} \
    MAIL_FROM_ADDRESS=${MAIL_FROM_ADDRESS} \
    MAIL_FROM_NAME=${MAIL_FROM_NAME}

# Optional BuildKit secret: dotenv-style file overrides/supplements the above for this RUN only
RUN --mount=type=secret,id=env,target=/run/secrets/env,required=false \
    if [ -f /run/secrets/env ]; then set -a && . /run/secrets/env && set +a; fi && \
    npm run build

# -----------------------------------------------------------------------------
FROM nginx:1.26-alpine AS runner

LABEL org.opencontainers.image.title="Al Mohami" \
      org.opencontainers.image.description="Vite static frontend for mouhami-ai.tn"

RUN mkdir -p /var/www/certbot

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
