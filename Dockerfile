# Install dependencies only when needed
FROM node:20-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN apk upgrade --ignore alpine-baselayout
COPY package.json package-lock.json ./
# TODO: We really SHOULD use --frozen-lockfile so we can be sure we use exactly the same dependencies as in dev env.
# But we also need this to work...
# RUN yarn install --frozen-lockfile
RUN npm install

# If using npm with a `package-lock.json` comment out above and use below instead
# COPY package.json package-lock.json ./
# RUN npm ci

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk upgrade --ignore alpine-baselayout
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM node:20-alpine AS runner

# TODO: Check that we get latest version of yt-dlp. Otherwise we need to download latest stable with e.g. wget.
RUN apk add --no-cache py3-send2trash py3-charset-normalizer

RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /bin/yt-dlp
RUN chmod a+rx /bin/yt-dlp

WORKDIR /app
RUN apk upgrade --ignore alpine-baselayout

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/subtotxt.py ./subtotxt.py

# Copy cookie file from environment, if found
COPY --from=builder /app/cookies.txt* ./
RUN chmod a+r /cookies.txt*

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# What port do we want to run it on?
# EXPOSE 80

EXPOSE 3001

ENV PORT 3001

# Host name must be set below to work locally (by some reason). But it may not work on production environment since
# they probably use a different IP range. Test without setting it for now.
# ENV HOSTNAME="172.17.0.2"
CMD ["node", "server.js"]
