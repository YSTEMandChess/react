export function initializeBoard(): (string | null)[][] {
  return Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
}
