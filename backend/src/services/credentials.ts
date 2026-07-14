import crypto from 'crypto';

/**
 * Generates a unique username from the examiner's name
 */
export function generateUsername(name: string): string {
  const base = name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  const suffix = Date.now().toString(36).slice(-4);
  return `gtec_${base}_${suffix}`;
}

/**
 * Generates a strong random password (12 chars, URL-safe base64)
 */
export function generatePassword(): string {
  return crypto.randomBytes(9).toString('base64url'); // ~12 chars
}
