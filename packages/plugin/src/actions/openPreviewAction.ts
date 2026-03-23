import React, { useState } from 'react'
import { useClient, useCurrentUser, DEFAULT_STUDIO_CLIENT_OPTIONS } from 'sanity'
import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
import { EyeOpenIcon } from '@sanity/icons'
import { createPreviewSecret } from 'sanity-plugin-preview-auth-validate'

/** @public */
export type OpenPreviewActionOptions = {
	previewOrigin: string
	/** Slug field name on route documents (default: 'slug') */
	slugField?: string
}

function createAction(options: OpenPreviewActionOptions): DocumentActionComponent {
	const { previewOrigin, slugField = 'slug' } = options

	const OpenPreviewAction = (props: DocumentActionProps) => {
		const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
		const currentUser = useCurrentUser()
		const [isGenerating, setIsGenerating] = useState(false)

		const slug = (props.draft ?? props.published)?.[slugField] as
			| { current?: string }
			| string
			| undefined

		const slugValue = typeof slug === 'string' ? slug : slug?.current

		if (!slugValue) {
			return null
		}

		return {
			label: isGenerating ? 'Opening…' : 'Open Preview',
			icon: EyeOpenIcon,
			disabled: isGenerating,
			onHandle: async () => {
				setIsGenerating(true)

				try {
					const { secret } = await createPreviewSecret({
						client,
						source: 'sanity/open-preview-action',
						studioUrl: window.location.href,
						userId: currentUser?.id,
					})

					const previewPath = slugValue.startsWith('/') ? slugValue : `/${slugValue}`
					const url = new URL(`/preview${previewPath}`, previewOrigin)

					url.searchParams.set('sanity-preview-secret', secret)

					window.open(url.toString(), '_blank', 'noopener,noreferrer')
				} finally {
					setIsGenerating(false)
					props.onComplete()
				}
			},
		}
	}

	OpenPreviewAction.action = 'openPreview'

	return OpenPreviewAction as DocumentActionComponent
}

/** @public */
export function openPreviewAction(options: OpenPreviewActionOptions): DocumentActionComponent {
	return createAction(options)
}
