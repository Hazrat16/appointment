/**
 * Escapes regex metacharacters so user-supplied search input is matched as a
 * literal substring, not compiled as a pattern. Without this, a query param
 * fed straight into `new RegExp()` lets a caller inject their own regex —
 * at best broadening the match unexpectedly, at worst a catastrophic-
 * backtracking pattern (e.g. `(a+)+$`) that hangs the single-threaded
 * event loop (ReDoS).
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
