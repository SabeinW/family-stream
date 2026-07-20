const { PrismaClient } = require('@prisma/client');

// Reuse a single instance across the app (avoids exhausting SQLite connections
// during dev hot-reloads).
const prisma = new PrismaClient();

module.exports = prisma;
