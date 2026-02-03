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
RUN apk add --no-cache yt-dlp py3-send2trash py3-charset-normalizer

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

# TODO: We need to create an empty "subs" and "texts".
#       - But right now they are probably compiled with the code.
#       - So we prob need to move them out of code (to /public?)
#         so that we can access them as directories after build.
#         use /tmp/subs, /tmp/texts

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# TODO: Remove below.
# Copy aws-crt-nodejs.node binary from /app/node_modules/ on docker container "builder".
# This is a workaround since the file does not end up in /app/.next/standalone/node_modules by some reason.
# Maybe it's because Next.js standalone build is still "unstable".
# RUN mkdir -p ./node_modules/aws-crt/dist/bin/linux-x64-musl/
# COPY --from=builder --chown=nextjs:nodejs /app/node_modules/aws-crt/dist/bin/linux-x64-musl/aws-crt-nodejs.node ./node_modules/aws-crt/dist/bin/linux-x64-musl/

USER nextjs

# What port do we want to run it on?
# EXPOSE 80

EXPOSE 3001

ENV PORT 3001

ENV HOSTNAME="172.17.0.2"
CMD ["node", "server.js"]
