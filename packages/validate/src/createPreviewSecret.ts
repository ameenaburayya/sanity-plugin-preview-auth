import { PREVIEW_AUTH_SECRET_TYPE, THREE_MONTHS_IN_SECONDS } from './constants';

/** @public */
export type SanityClientLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: (id: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: () => any;
  delete: (params: { query: string }) => Promise<unknown>;
};

function generateSecret(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);

    crypto.getRandomValues(array);

    let key = '';

    for (let i = 0; i < array.length; i++) {
      key += array[i]!.toString(16).padStart(2, '0');
    }

    return btoa(key).replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '');
  }

  return Math.random().toString(36).slice(2);
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const buildDeleteExpiredQuery = () =>
  `*[_type == "${PREVIEW_AUTH_SECRET_TYPE}" && dateTime(expiresAt) < dateTime(now())]`;

/** @public */
export type CreatePreviewSecretOptions = {
  client: SanityClientLike;
  source: string;
  studioUrl: string;
  userId?: string;
  ttl?: number;
};

/**
 * Creates a long-lived preview auth secret stored as a `sanity.previewAuthSecret` document.
 * Unlike secrets created by the Presentation tool, these use an explicit `expiresAt` field
 * and are not swept by \@sanity/preview-url-secret's 1-hour cleanup.
 * @public
 */
export async function createPreviewSecret({
  client,
  source,
  studioUrl,
  userId,
  ttl = THREE_MONTHS_IN_SECONDS
}: CreatePreviewSecretOptions): Promise<{ secret: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + 1000 * ttl);
  const _id = `drafts.${generateId()}`;
  const secret = generateSecret();

  try {
    const patch = client.patch(_id).set({ secret, source, studioUrl, userId, expiresAt: expiresAt.toISOString() });

    await client
      .transaction()
      .createOrReplace({ _id, _type: PREVIEW_AUTH_SECRET_TYPE })
      .patch(patch)
      .commit({ tag: 'preview-auth.create-secret' });

    return { secret, expiresAt };
  } finally {
    try {
      await client.delete({ query: buildDeleteExpiredQuery() });
    } catch {
      // Non-fatal — expired documents will be cleaned up on the next call
    }
  }
}
