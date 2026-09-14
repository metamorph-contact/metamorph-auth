import { cleanup, render, screen } from '@testing-library/react'
import { PageTransitions } from '@polymorph/ui/identity'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import './i18n'
import { IdentityRouter, router } from './router'

describe('identity router presentation', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    router.history.replace('/en/auth/not-found/version')
  })

  afterEach(() => cleanup())

  it('renders an accessible fail-closed page for an unknown identity route', async () => {
    render(
      <PageTransitions>
        <IdentityRouter />
      </PageTransitions>,
    )

    expect((await screen.findByRole('main')).getAttribute('aria-busy')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeTruthy()
    expect(screen.getByText('This authentication request cannot be completed safely.')).toBeTruthy()
  })

  it('loads the development-only enterprise identity fixture route', async () => {
    expect(router.matchRoutes('/en/_preview/enterprise-security/SCR-IDN-001').at(-1)?.routeId)
      .toBe('/$locale/_preview/enterprise-security/$screenId')
    render(
      <PageTransitions>
        <IdentityRouter />
      </PageTransitions>,
    )
    await act(async () => {
      await router.navigate({
        to: '/$locale/_preview/enterprise-security/$screenId',
        params: { locale: 'en', screenId: 'SCR-IDN-001' },
      })
    })
    expect(router.state.location.pathname).toBe('/en/_preview/enterprise-security/SCR-IDN-001')
    expect(await screen.findByRole('heading', { level: 1, name: 'Authentication methods preview' })).toBeTruthy()
    expect(await screen.findByText(/Methods available for this flow:/u)).toBeTruthy()
  })

  it('rejects unsupported locales on the identity preview route', async () => {
    const guard = router.routesById['/$locale/_preview/enterprise-security/$screenId'].options.beforeLoad
    await expect(Promise.resolve().then(() => guard?.({ params: { locale: 'zz', screenId: 'SCR-IDN-001' } } as never)))
      .rejects.toMatchObject({ isNotFound: true })
  })

  it('admits every Packet I preview screen and rejects unrelated identity rows', async () => {
    const guard = router.routesById['/$locale/_preview/enterprise-security/$screenId'].options.beforeLoad
    for (const screenId of ['SCR-IDN-001', 'SCR-IDN-011', 'SCR-IDN-012', 'SCR-IDN-013', 'SCR-IDN-014', 'SCR-IDN-015', 'SCR-IDN-016', 'SCR-IDN-017']) {
      await expect(Promise.resolve().then(() => guard?.({ params: { locale: 'en', screenId } } as never)))
        .resolves.toBeUndefined()
    }
    await expect(Promise.resolve().then(() => guard?.({ params: { locale: 'en', screenId: 'SCR-IDN-009' } } as never)))
      .rejects.toMatchObject({ isNotFound: true })
  })
})
