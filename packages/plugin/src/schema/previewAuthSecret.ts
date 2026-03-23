import { defineField, defineType } from 'sanity';
import { PREVIEW_AUTH_SECRET_TYPE } from 'sanity-plugin-preview-auth-validate';

/**
 * System document type for long-lived preview auth secrets.
 * Add this to your Sanity schema types array, or use `previewAuthPlugin`
 * which registers it automatically.
 * @public
 */
export const previewAuthSecret = defineType({
  name: PREVIEW_AUTH_SECRET_TYPE,
  type: 'document',
  title: 'Preview Auth Secret',
  fields: [
    defineField({ name: 'secret', type: 'string', title: 'Secret' }),
    defineField({ name: 'source', type: 'string', title: 'Source' }),
    defineField({ name: 'studioUrl', type: 'string', title: 'Studio URL' }),
    defineField({ name: 'userId', type: 'string', title: 'User ID' }),
    defineField({ name: 'expiresAt', type: 'datetime', title: 'Expires At' })
  ]
});
