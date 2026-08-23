import xss from 'xss';

// Recursively strip dangerous HTML from every string value.
export function sanitizeValue(value) {
  if (typeof value === 'string') return xss(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)]));
  }
  return value;
}

// Express middleware: sanitizes req.body in place when present.
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}
