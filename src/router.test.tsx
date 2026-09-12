import { cleanup, render, screen } from '@testing-library/react'
import { PageTransitions } from '@polymorph/ui/identity'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import './i18n'
import { IdentityRouter } from './router'

describe('identity router presentation', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    window.history.replaceState({}, '', '/en/auth/not-found/version')
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
})
