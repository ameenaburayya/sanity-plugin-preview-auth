/**
 * Sanity document type for long-lived preview auth secrets.
 *
 * Unlike `sanity.previewUrlSecret` (used by the Presentation tool),
 * documents of this type use an explicit `expiresAt` field so they are
 * NOT cleaned up by @sanity/preview-url-secret's 1-hour TTL sweep.
 */
export const PREVIEW_AUTH_SECRET_TYPE = 'sanity.previewAuthSecret';

export const THREE_MONTHS_IN_SECONDS = 60 * 60 * 24 * 90;

/** TTL used by @sanity/preview-url-secret for short-lived Presentation tool secrets. */
export const PRESENTATION_SECRET_TTL = 3600;
