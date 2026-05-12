/**
 * Derive explorer level / XP from local ride stats (no server).
 * Tunable constants for game-feel; sync phase can persist official values later.
 */
const XP_PER_KM = 40;
const XP_PER_MINUTE_RIDDEN = 8;
const XP_PER_RIDE_COMPLETED = 35;
const XP_PER_LEVEL = 1000;

export function computeExplorerProgress(totalDistanceMeters, totalDurationMs, totalRides) {
  const km = totalDistanceMeters / 1000;
  const minutes = totalDurationMs / 60_000;
  const xp = Math.max(
    0,
    Math.floor(km * XP_PER_KM + minutes * XP_PER_MINUTE_RIDDEN + totalRides * XP_PER_RIDE_COMPLETED),
  );
  const level = Math.max(1, 1 + Math.floor(xp / XP_PER_LEVEL));
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL;
  const progressPct = (xpIntoLevel / xpToNext) * 100;

  return {
    xp,
    level,
    xpIntoLevel,
    xpToNext,
    progressPct,
  };
}
