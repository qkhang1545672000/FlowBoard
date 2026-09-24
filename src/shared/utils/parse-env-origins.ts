export function parseEnvOrigins(...values: (string | undefined)[]) {
  const out: string[] = [];

  for (const v of values) {
    if (!v) continue;

    for (const part of v.split(',')) {
      const s = part.trim();

      if (s) {
        out.push(s);
      }
    }
  }

  return [...new Set(out)];
}
