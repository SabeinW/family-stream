FROM node:20-alpine

# ffmpeg is required at runtime for transcoding uploads (fluent-ffmpeg
# shells out to the ffmpeg/ffprobe binaries, it doesn't bundle them).
RUN apk add --no-cache ffmpeg openssl

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

# Uploads live here; mount a volume over this path in docker-compose so
# media survives container rebuilds.
RUN mkdir -p /app/src/uploads/originals /app/src/uploads/transcoded /app/src/uploads/thumbnails

# SQLite file lives in its own volume-mounted directory, separate from the
# app code layer, so `docker compose build` never touches your data.
RUN mkdir -p /app/data
ENV DATABASE_URL="file:/app/data/dev.db"

EXPOSE 4000

# Sync the SQLite schema (creates the DB file on first boot, no-op after),
# backfill any Media rows missing an owner (idempotent, no-op once caught
# up), then start the API. Switch to `prisma migrate deploy` once you've run
# `npx prisma migrate dev` locally and committed a prisma/migrations folder.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/scripts/backfillOwners.js && node src/server.js"]
