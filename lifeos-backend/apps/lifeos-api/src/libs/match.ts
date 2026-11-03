function norm(s: string): string {
  return s.trim().toLowerCase().replace(/s$/, '');
}
/** "Do I already own this?" matching: simple name containment, ignoring a trailing plural s. */
export function matchesOwned(item: string, title: string): boolean {
  const q = norm(item);
  const n = norm(title);
  if (q.length < 3 || n.length < 3) return false;
  return n.includes(q) || q.includes(n);
}
