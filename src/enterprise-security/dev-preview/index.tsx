import { AuthPage, Text } from '@polymorph/ui/identity'
import { useParams } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

const CoreIdentityPreviewPage = lazy(async () => ({ default: (await import('./identity')).CoreIdentityPreviewPage }))
const CeremonyIdentityPreviewPage = lazy(async () => ({ default: (await import('./ceremony')).CeremonyIdentityPreviewPage }))

export function IdentitySecurityPreviewPage() {
  const { screenId } = useParams({ strict: false }) as { screenId?: string }
  return <Suspense fallback={<div className="identity-shell"><AuthPage title="Identity preview" pending><Text>Loading preview…</Text></AuthPage></div>}>
    {/^SCR-IDN-(?:00[2-5]|010)$/u.test(screenId ?? '')
      ? <CeremonyIdentityPreviewPage />
      : <CoreIdentityPreviewPage />}
  </Suspense>
}
