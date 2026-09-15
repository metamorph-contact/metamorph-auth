import { StrictMode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import i18n from '../i18n'
import en from '../i18n/locales/en/enterprise-security.json'
import { FederationJourneyPanel } from './federation-panel'
import { FederationJourney, nextFederationState } from './federation-journey'
import {
  federationJourneyFixture,
  JOURNEY_FIXTURE_FLOW,
  JOURNEY_FIXTURE_PROOF,
} from './dev-fixtures/federation-journey'
import { identityRecipientFixture } from './dev-fixtures/identity-recipient'
// This test covers journey/form behavior. Icon drawing is isolated because
// the shared source package has its own React install in this worktree setup.
vi.mock('@polymorph/core', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  Icon: () => null,
}))
// The linked Radix peer also uses a separate React install. Isolate Checkbox
// drawing here; the privacy receipt owner, form and retry path remain actual.
vi.mock('@polymorph/ui', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  Checkbox: ({
    checked,
    onCheckedChange,
    label,
    disabled,
  }: {
    checked: boolean
    onCheckedChange: (v: boolean) => void
    label: string
    disabled: boolean
  }) => (
    <label>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      {label}
    </label>
  ),
}))
i18n.addResourceBundle('en', 'enterprise-security', en)
afterEach(cleanup)
function mount(options = {}) {
  const fixture = federationJourneyFixture(options)
  const journey = new FederationJourney(
    JOURNEY_FIXTURE_FLOW,
    'octamorph-browser',
    fixture.client,
    fixture.resolution.expiresAt,
  )
  const owners = {
    recipient: identityRecipientFixture('ready'),
    privacy: { required: false, acknowledge: vi.fn() },
  }
  const view = render(
    <StrictMode>
      <FederationJourneyPanel
        journey={journey}
        initial={nextFederationState(fixture.initial)}
        owners={owners}
        navigation={vi.fn()}
      />
    </StrictMode>,
  )
  return { fixture, view }
}
it('survives StrictMode replay, submits chosen email and renders the independent challenge', async () => {
  const { fixture } = mount()
  fireEvent.change(screen.getByRole('textbox', { name: 'Primary email' }), {
    target: { value: 'chosen@example.com' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Send verification' }))
  await screen.findByRole('textbox', { name: 'Email verification proof' })
  expect(fixture.inspect().email).toBe('chosen@example.com')
  expect(fixture.inspect().verified).toBe(false)
  fireEvent.change(screen.getByRole('textbox', { name: 'Email verification proof' }), {
    target: { value: JOURNEY_FIXTURE_PROOF },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verify email' }))
  await screen.findByRole('textbox', { name: 'Handle' })
  expect(fixture.inspect().verified).toBe(true)
})
it('synchronously conceals form material on pagehide and refuses restored submissions', async () => {
  mount()
  fireEvent.change(screen.getByRole('textbox', { name: 'Primary email' }), {
    target: { value: 'private@example.com' },
  })
  fireEvent(window, new Event('pagehide'))
  expect(screen.queryByRole('textbox')).toBeNull()
  fireEvent(window, new Event('pageshow'))
  await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull())
})
it('keeps an unsatisfied controlled-factor step disabled without the actual proof owner', () => {
  mount({ factor: true })
  expect(
    (screen.getByRole('button', { name: 'Verify with a controlled factor' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true)
  expect(screen.queryByRole('textbox', { name: 'Primary email' })).toBeNull()
})
it.each(['profile', 'acknowledgement'])(
  'recovers a lost %s response with the original required privacy command/receipt',
  async (loss) => {
    const fixture = federationJourneyFixture({ loseProfileResponse: loss === 'profile' })
    const journey = new FederationJourney(
      JOURNEY_FIXTURE_FLOW,
      'octamorph-browser',
      fixture.client,
      fixture.resolution.expiresAt,
    )
    const initial = nextFederationState(fixture.initial)
    if (initial.kind !== 'verify-email') throw new Error('wrong state')
    const email = await journey.email(initial, 'chosen@example.com')
    if (email.kind !== 'verify-email') throw new Error('wrong state')
    const profile = await journey.verify(email, JOURNEY_FIXTURE_PROOF)
    const acknowledge = vi.fn(async () => ({
      policy: {
        policyId: JOURNEY_FIXTURE_FLOW,
        policyVersion: '1',
        purpose: 'required_notice' as const,
        presentationDigest: 'A'.repeat(43),
      },
      ceremonyId: JOURNEY_FIXTURE_FLOW,
      acknowledgementReceiptId: JOURNEY_FIXTURE_FLOW,
      actorBindingDigest: 'B'.repeat(43),
    }))
    if (loss === 'acknowledgement')
      acknowledge.mockRejectedValueOnce(new TypeError('Simulated acknowledgement response loss'))
    render(
      <FederationJourneyPanel
        journey={journey}
        initial={profile}
        owners={{
          recipient: identityRecipientFixture('ready'),
          privacy: { required: true, acknowledge },
        }}
        navigation={vi.fn()}
      />,
    )
    for (const [name, value] of [
      ['Handle', 'alex-example'],
      ['First name', 'Alex'],
    ] as const)
      fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: en['security.journey.save'] }))
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: en['security.journey.save'] }))
    await screen.findByRole('button', { name: 'Skip for now' })
    expect(acknowledge).toHaveBeenCalledTimes(loss === 'profile' ? 1 : 2)
    if (loss === 'acknowledgement')
      expect(acknowledge.mock.calls[0]).toEqual(acknowledge.mock.calls[1])
    expect(fixture.inspect().completed).toBe(true)
  },
)
it('erases idle ceremony state and private inputs at its original deadline', async () => {
  const { fixture } = mount({ ttlMs: 150 })
  fireEvent.change(screen.getByRole('textbox', { name: 'Primary email' }), {
    target: { value: 'private@example.com' },
  })
  await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull())
  expect(fixture.inspect().commands).toBe(0)
})
