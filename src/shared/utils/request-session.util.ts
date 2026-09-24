const MAX_COOKIE_CHUNKS = 8;

const SESSION_COOKIE_NAMES = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
];

export function extractBearerToken(
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const raw = headers.authorization ?? headers.Authorization;
  const v = Array.isArray(raw) ? raw[0] : raw;

  if (!v || !v.toLowerCase().startsWith('bearer ')) return null;

  const t = v.slice(7).trim();
  if (!t) return null;

  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}

function cookieValue(header: string, name: string): string | null {
  const parts = header.split(';');

  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;

    const k = part.slice(0, idx).trim();
    if (k === name) {
      return part.slice(idx + 1).trim();
    }
  }

  return null;
}

function readSessionCookieValue(
  header: string,
  baseName: string,
): string | null {
  const whole = cookieValue(header, baseName);
  if (whole) return whole;

  const chunks: string[] = [];
  for (let i = 0; i < MAX_COOKIE_CHUNKS; i++) {
    const chunk = cookieValue(header, `${baseName}.${i}`);
    if (chunk === null) break;
    chunks.push(chunk);
  }

  return chunks.length > 0 ? chunks.join('') : null;
}

function stripSignature(value: string): string {
  const lastDot = value.lastIndexOf('.');
  return lastDot > 0 ? value.slice(0, lastDot) : value;
}

export function extractSessionTokenFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const bearer = extractBearerToken(headers);
  if (bearer) {
    return stripSignature(bearer);
  }

  const rawCookie = headers.cookie ?? headers.Cookie;
  const cookieHeader = Array.isArray(rawCookie) ? rawCookie[0] : rawCookie;

  if (cookieHeader) {
    for (const name of SESSION_COOKIE_NAMES) {
      const val = readSessionCookieValue(cookieHeader, name);
      if (val) {
        return stripSignature(val);
      }
    }
  }

  return null;
}
