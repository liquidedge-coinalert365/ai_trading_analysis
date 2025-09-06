import { createHash } from 'crypto';

export function normalizeQuestion(text: string) {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function questionHash(text: string) {
    const norm = normalizeQuestion(text).replace(/[^\p{L}\p{N}\s]/gu, '');
    return createHash('sha256').update(norm).digest('hex');
}
