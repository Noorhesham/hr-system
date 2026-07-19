/** Strict 24-hour "HH:mm" (zero-padded) — e.g. "08:00", "22:30". */
export const HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Resolved at call-time (not import-time) so it reflects the env loaded by
 * ConfigModule. Single global timezone for now; trivially upgradable to a
 * per-company `Company.timezone` column later (the time util takes `tz` as an arg).
 */
export const getDefaultTz = (): string => process.env.DEFAULT_TZ || 'Asia/Riyadh';
