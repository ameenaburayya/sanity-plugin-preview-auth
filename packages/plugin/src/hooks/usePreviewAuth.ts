import { useState, useCallback, useMemo } from 'react'
import { useClient, useCurrentUser, DEFAULT_STUDIO_CLIENT_OPTIONS } from 'sanity'
import { createPreviewSecret } from 'sanity-plugin-preview-auth-validate'

/** @public */
export type UsePreviewAuthOptions = {
	previewOrigin: string
	previewAuthApi: string
}

/** @public */
export type UsePreviewAuthResult = {
	redirectUrl: string | null
	fullRedirectUrl: string | null
	isAuthenticating: boolean
	error: string | null
	handleAuthenticate: () => Promise<void>
}

/** @public */
export function usePreviewAuth({
	previewOrigin,
	previewAuthApi,
}: UsePreviewAuthOptions): UsePreviewAuthResult {
	const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
	const currentUser = useCurrentUser()
	const [isAuthenticating, setIsAuthenticating] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const redirectUrl = useMemo(() => {
		if (typeof window === 'undefined') {
			return null
		}

		return new URLSearchParams(window.location.search).get('redirect')
	}, [])

	const fullRedirectUrl = useMemo(() => {
		if (!redirectUrl || !previewOrigin) {
			return null
		}

		try {
			return new URL(redirectUrl, previewOrigin).toString()
		} catch {
			return `${previewOrigin}${redirectUrl}`
		}
	}, [redirectUrl, previewOrigin])

	const handleAuthenticate = useCallback(async () => {
		if (!previewOrigin) {
			setError('No preview URL configured for this workspace.')

			return
		}

		setIsAuthenticating(true)
		setError(null)

		try {
			const { secret } = await createPreviewSecret({
				client,
				source: 'sanity/preview-auth',
				studioUrl: window.location.href,
				userId: currentUser?.id,
			})

			const apiUrl = new URL(previewAuthApi, previewOrigin)
			const redirectPath = redirectUrl?.startsWith('/preview')
				? redirectUrl.replace(/^\/preview/, '') || '/'
				: redirectUrl || '/'

			apiUrl.searchParams.set('sanity-preview-secret', secret)
			apiUrl.searchParams.set('sanity-preview-pathname', redirectPath)
			apiUrl.searchParams.set('response', 'json')

			const response = await fetch(apiUrl, {
				method: 'GET',
				credentials: 'include',
				headers: { Accept: 'application/json' },
			})

			const payload = await response.json().catch(() => null)

			if (!response.ok || payload?.ok === false) {
				throw new Error(payload?.error || `Authentication failed (${response.status})`)
			}

			if (!payload?.redirectTo) {
				throw new Error('Missing redirect target from authentication response.')
			}

			window.location.href = new URL(payload.redirectTo, previewOrigin).toString()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to authenticate preview mode.')
			setIsAuthenticating(false)
		}
	}, [client, currentUser?.id, previewAuthApi, previewOrigin, redirectUrl])

	return { redirectUrl, fullRedirectUrl, isAuthenticating, error, handleAuthenticate }
}
