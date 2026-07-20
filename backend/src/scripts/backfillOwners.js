const prisma = require('../utils/prisma');

// Runs on every container boot (see Dockerfile CMD), after `prisma db push`
// and before the server starts accepting connections. Only touches rows
// where ownerId is still NULL, so it's a no-op once everything is matched —
// safe to run unconditionally forever rather than as a one-off manual step.
async function backfillOwners() {
  const unowned = await prisma.media.findMany({
    where: { ownerId: null },
    select: { id: true, uploadedBy: true },
  });

  if (!unowned.length) return;

  // SQLite string comparison (and Prisma's `in` filter on it) is
  // case-sensitive, so matching on a lowercased search term against
  // as-stored emails would silently find nothing. Fetch all users (a family
  // server has few) and normalize case in JS instead.
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const byEmail = new Map(users.map((u) => [u.email.trim().toLowerCase(), u.id]));

  let matched = 0;
  const unmatched = [];

  for (const media of unowned) {
    const ownerId = media.uploadedBy && byEmail.get(media.uploadedBy.trim().toLowerCase());
    if (ownerId) {
      await prisma.media.update({ where: { id: media.id }, data: { ownerId } });
      matched++;
    } else {
      unmatched.push(media.id);
    }
  }

  console.log(`[backfillOwners] matched ${matched}/${unowned.length} media rows to an owner.`);
  if (unmatched.length) {
    console.warn(
      `[backfillOwners] ${unmatched.length} row(s) could not be matched to any account (stale/orphaned uploadedBy) and remain ownerId=NULL: ${unmatched.join(', ')}`
    );
  }
}

backfillOwners()
  .catch((err) => {
    console.error('[backfillOwners] failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
