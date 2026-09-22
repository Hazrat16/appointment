import type { NextFunction, Request, Response } from 'express';

// Mongo operator keys ($gt, $where, $ne, ...) or dotted paths ("address.street")
// let a JSON field value change what a query/update actually matches — this
// blocks both regardless of which controller field a value ends up in.
const DANGEROUS_KEY = /^\$|\./;

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (DANGEROUS_KEY.test(key)) continue;
      clean[key] = sanitize(val);
    }
    return clean;
  }

  return value;
}

/**
 * Strips Mongo operator keys and dotted paths from req.body/req.query/
 * req.params before any controller or Mongoose query sees them — defense in
 * depth against NoSQL injection, on top of each controller cherry-picking
 * known fields rather than spreading request data directly into a query.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query) as typeof req.query;
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params) as typeof req.params;
  }
  next();
}
