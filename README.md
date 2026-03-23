# sanity-plugin-preview-auth

Long-lived cross-origin preview authentication for Sanity Studio.

## The Problem

The official `@sanity/preview-url-secret` package creates preview secrets with a 1-hour TTL. Every time the Presentation tool generates a new secret, it runs a cleanup sweep that deletes **all** `sanity.previewUrlSecret` documents older than 1 hour — including any secrets you intended to be long-lived. This forces editors to re-authenticate constantly.

## The Solution

This plugin introduces a separate document type (`sanity.previewAuthSecret`) with an explicit `expiresAt` field. Because it uses a different type, the package's cleanup sweep never touches it. Secrets last 3 months by default.

## Packages

| Package | Description |
|---|---|
| [`sanity-plugin-preview-auth`](./packages/plugin) | Sanity Studio plugin — registers the schema type and auth UI |
| [`sanity-preview-auth`](./packages/validate) | Framework-agnostic validation utilities for your server |

## Quick Start

### 1. Install

```bash
npm install sanity-plugin-preview-auth sanity-preview-auth
```

### 2. Add the plugin to your Studio

```ts
// sanity.config.ts
import { previewAuthPlugin } from 'sanity-plugin-preview-auth';

export default defineConfig({
  plugins: [
    previewAuthPlugin({
      previewOrigin: 'https://your-preview-site.com',
      previewAuthApi: '/api/draft-mode/enable'
    })
  ]
});
```

### 3. Add the enable endpoint

```ts
// e.g. Astro: src/pages/api/draft-mode/enable.ts
import { validatePreviewSecret } from 'sanity-preview-auth';
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'your-project-id',
  dataset: 'production',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01'
});

export async function GET({ request, cookies, redirect }) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('sanity-preview-secret');
  const redirectTo = url.searchParams.get('sanity-preview-pathname') ?? '/';

  const { isValid } = await validatePreviewSecret(secret, client);

  if (!isValid) {
    return new Response('Invalid secret', { status: 401 });
  }

  cookies.set('sanity-preview-secret', secret, {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 60 * 60 * 24 * 90 // 3 months
  });

  return redirect(`/preview${redirectTo}`, 307);
}
```

### 4. Validate on each preview request

```ts
import { validatePreviewSecret } from 'sanity-preview-auth';

const secret = cookies.get('sanity-preview-secret');
const { isValid } = await validatePreviewSecret(secret, client);
```

## License

MIT
