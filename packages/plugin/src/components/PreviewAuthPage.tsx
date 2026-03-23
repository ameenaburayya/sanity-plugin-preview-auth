import React from 'react'
import { Button, Card, Container, Flex, Heading, Stack, Text } from '@sanity/ui'
import { EyeOpenIcon } from '@sanity/icons'
import { usePreviewAuth } from '../hooks/usePreviewAuth'

export type PreviewAuthPageProps = {
	previewOrigin: string
	previewAuthApi: string
}

export function PreviewAuthPage({ previewOrigin, previewAuthApi }: PreviewAuthPageProps) {
	const { redirectUrl, fullRedirectUrl, isAuthenticating, error, handleAuthenticate } =
		usePreviewAuth({ previewOrigin, previewAuthApi })

	if (!redirectUrl) {
		return (
			<Card height='fill' overflow='auto'>
				<Container width={1} padding={5}>
					<Flex justify='center' align='center' style={{ minHeight: '60vh' }}>
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
		)
	}

	return (
		<Card height='fill' overflow='auto'>
			<Container width={1} padding={5}>
				<Flex justify='center' align='center' style={{ minHeight: '60vh' }}>
					<Card padding={5} radius={3} shadow={1} style={{ maxWidth: 480, width: '100%' }}>
						<Stack space={5}>
							<Flex justify='center'>
								<Card padding={3} radius='full' tone='primary'>
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
								<Card padding={3} radius={2} tone='positive'>
									<Stack space={3}>
										<Text size={0} muted weight='medium'>
											Redirecting to:
										</Text>
										<Text size={1} style={{ wordBreak: 'break-all' }}>
											{fullRedirectUrl}
										</Text>
									</Stack>
								</Card>
							)}

							{error && (
								<Card padding={3} radius={2} tone='critical'>
									<Text size={1}>{error}</Text>
								</Card>
							)}

							<Button
								fontSize={2}
								padding={4}
								tone='primary'
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
	)
}
