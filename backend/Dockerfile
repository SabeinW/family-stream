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
RUN mkdir -p /app/src/uploads/originals /app/src/uploads/transcoded /app/src/uploads/thumbnails /app/src/uploads/avatars

# SQLite file lives in its own volume-mounted directory, separate from the
# app code layer, so `docker compose build` never touches your data.
RUN mkdir -p /app/data
ENV DATABASE_URL="file:/app/data/dev.db"

EXPOSE 4000

# Sync the SQLite schema (creates the DB file on first boot, no-op after),
# backfill any Media rows missing an owner (idempotent, no-op once caught
# up), then start the API. Switch to `prisma migrate deploy` once you've run
# `npx prisma migrate dev` locally and committed a prisma/migrations folder.
#
# --accept-data-loss: there's no TTY in a container to answer Prisma's
# interactive confirmation, so without this flag `db push` hard-fails (and
# the container restart-loops) on *any* schema change it flags as
# potentially destructive -- including safe ones, like adding a new unique
# constraint to a column with no data yet. This trades away a safety net:
# a schema change that legitimately could drop data (e.g. narrowing a
# column, dropping one with real rows in it) will now also proceed
# silently instead of stopping for confirmation. Test schema changes
# locally first and back up the SQLite file before deploying one, same as
# already documented in this project's deploy notes.
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && node src/scripts/backfillOwners.js && node src/server.js"]
