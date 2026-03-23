import React, { useState, useCallback, useMemo } from 'react';
import { Button, Card, Container, Flex, Heading, Stack, Text } from '@sanity/ui';
import { EyeOpenIcon } from '@sanity/icons';
import { useClient, useCurrentUser } from 'sanity';
import { createPreviewSecret } from 'sanity-preview-auth';

export type PreviewAuthPageProps = {
  previewOrigin: string;
  previewAuthApi: string;
};

const API_VERSION = '2024-01-01';

export function PreviewAuthPage({ previewOrigin, previewAuthApi }: PreviewAuthPageProps) {
  const client = useClient({ apiVersion: API_VERSION });
  const currentUser = useCurrentUser();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return new URLSearchParams(window.location.search).get('redirect');
  }, []);

  const fullRedirectUrl = useMemo(() => {
    if (!redirectUrl || !previewOrigin) {
      return null;
    }

    try {
      return new URL(redirectUrl, previewOrigin).toString();
    } catch {
      return `${previewOrigin}${redirectUrl}`;
    }
  }, [redirectUrl, previewOrigin]);

  const handleAuthenticate = useCallback(async () => {
    if (!previewOrigin) {
      setError('No preview URL configured for this workspace.');

      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const { secret } = await createPreviewSecret({
        client,
        source: 'sanity/preview-auth',
        studioUrl: window.location.href,
        userId: currentUser?.id
      });

      const apiUrl = new URL(previewAuthApi, previewOrigin);
      const redirectPath = redirectUrl?.startsWith('/preview')
        ? redirectUrl.replace(/^\/preview/, '') || '/'
        : redirectUrl || '/';

      apiUrl.searchParams.set('sanity-preview-secret', secret);
      apiUrl.searchParams.set('sanity-preview-pathname', redirectPath);
      apiUrl.searchParams.set('response', 'json');

      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || `Authentication failed (${response.status})`);
      }

      if (!payload?.redirectTo) {
        throw new Error('Missing redirect target from authentication response.');
      }

      window.location.href = new URL(payload.redirectTo, previewOrigin).toString();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate preview mode.');
      setIsAuthenticating(false);
    }
  }, [client, currentUser?.id, previewAuthApi, previewOrigin, redirectUrl]);

  if (!redirectUrl) {
    return (
      <Card height="fill" overflow="auto">
        <Container width={1} padding={5}>
          <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
            <Card padding={5} radius={3} shadow={1} style={{ maxWidth: 480, width: '100%' }}>
              <Stack space={4} style={{ textAlign: 'center' }}>
                <Heading size={4}>404</Heading>
                <Text muted size={2}>
                  Preview authentication requires a redirect URL.
                </Text>
              </Stack>
            </Card>
          </Flex>
        </Container>
      </Card>
    );
  }

  return (
    <Card height="fill" overflow="auto">
      <Container width={1} padding={5}>
        <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
          <Card padding={5} radius={3} shadow={1} style={{ maxWidth: 480, width: '100%' }}>
            <Stack space={5}>
              <Flex justify="center">
                <Card padding={3} radius="full" tone="primary">
                  <Text size={4}>
                    <EyeOpenIcon />
                  </Text>
                </Card>
              </Flex>

              <Stack space={3} style={{ textAlign: 'center' }}>
                <Heading size={2}>Preview Mode Authentication</Heading>
                <Text muted size={2}>
                  Authenticate to access the preview environment. This generates a secure token
                  valid for 3 months.
                </Text>
              </Stack>

              {fullRedirectUrl && (
                <Card padding={3} radius={2} tone="positive">
                  <Stack space={3}>
                    <Text size={0} muted weight="medium">
                      Redirecting to:
                    </Text>
                    <Text size={1} style={{ wordBreak: 'break-all' }}>
                      {fullRedirectUrl}
                    </Text>
                  </Stack>
                </Card>
              )}

              {error && (
                <Card padding={3} radius={2} tone="critical">
                  <Text size={1}>{error}</Text>
                </Card>
              )}

              <Button
                fontSize={2}
                padding={4}
                tone="primary"
                loading={isAuthenticating}
                text={isAuthenticating ? 'Authenticating…' : 'Authenticate Preview Mode'}
                icon={EyeOpenIcon}
                onClick={handleAuthenticate}
                disabled={isAuthenticating || !previewOrigin}
              />
            </Stack>
          </Card>
        </Flex>
      </Container>
    </Card>
  );
}
