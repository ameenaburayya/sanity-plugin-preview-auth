import { PREVIEW_AUTH_SECRET_TYPE, PRESENTATION_SECRET_TTL } from './constants';

// Structural type — avoids version conflicts between @sanity/client v6 and v7
/** @public */
export type SanityFetchClientLike = {
  withConfig: (config: Record<string, unknown>) => SanityFetchClientLike;
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>;
};

type SecretDocument = {
  _id: string;
  secret: string | null;
  studioUrl: string | null;
} | null;

type ShortLivedDocument = SecretDocument & {
  _updatedAt: string | null;
};

const longLivedQuery = `*[_type == "${PREVIEW_AUTH_SECRET_TYPE}" && secret == $secret && dateTime(expiresAt) > dateTime(now())][0]{
  _id,
  secret,
  studioUrl
}`;

const shortLivedQuery = `*[_type == "sanity.previewUrlSecret" && secret == $secret && dateTime(_updatedAt) > dateTime(now()) - ${PRESENTATION_SECRET_TTL}][0]{
  _id,
  _updatedAt,
  secret,
  studioUrl
}`;

const sharedQuery = `*[_id == "sanity-preview-url-secret.share-access" && _type == "sanity.previewUrlShareAccess" && secret == $secret][0]{
  secret,
  studioUrl
}`;

/** @public */
export type ValidatePreviewSecretResult = {
  isValid: boolean;
  studioUrl: string | null;
};

/**
 * Validates a preview secret against:
 * @public
 * 1. Long-lived secrets (`sanity.previewAuthSecret`) created by this plugin
 * 2. Short-lived secrets (`sanity.previewUrlSecret`) created by the Presentation tool
 * 3. Public shared access secrets
 *
 * The client must be configured with a token that has read access to the dataset.
 */
export async function validatePreviewSecret(
  secret: string | undefined,
  client: SanityFetchClientLike
): Promise<ValidatePreviewSecretResult> {
  if (!secret?.trim()) {
    return { isValid: false, studioUrl: null };
  }

  const clientWithConfig = client.withConfig({
    perspective: 'raw',
    useCdn: false,
    resultSourceMap: false
  });

  const {
    longLived,
    shortLived,
    shared
  }: {
    longLived: SecretDocument;
    shortLived: ShortLivedDocument;
    shared: SecretDocument;
  } = await clientWithConfig.fetch(
    `{ "longLived": ${longLivedQuery}, "shortLived": ${shortLivedQuery}, "shared": ${sharedQuery} }`,
    { secret }
  );

  if (longLived?._id && longLived.secret) {
    return { isValid: secret === longLived.secret, studioUrl: longLived.studioUrl };
  }

  if (shortLived?._id && shortLived._updatedAt && shortLived.secret) {
    return { isValid: secret === shortLived.secret, studioUrl: shortLived.studioUrl };
  }

  if (shared?.secret) {
    return { isValid: secret === shared.secret, studioUrl: shared.studioUrl };
  }

  return { isValid: false, studioUrl: null };
}
