import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'
import { ActivationFlow, ScimActivationPage } from './scim-page'
import { ScimIdentityError } from './scim-client'
import type { LoadedIdentityCatalog } from '../catalog/runtime'
const { call } = vi.hoisted(() => ({ call: vi.fn() }))
vi.mock('../router', () => ({
  Presentation: ({
    title,
    description,
    children,
    pending,
  }: {
    title: string
    description: string
    children: React.ReactNode
    pending: boolean
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{description}</p>
      <fieldset disabled={pending}>{children}</fieldset>
    </main>
  ),
}))
vi.mock('./scim-client', async () => ({
  ...(await vi.importActual('./scim-client')),
  ScimIdentityClient: class {
    call = call
  },
}))
vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({
    locale: 'en',
    authProjectionId: 'test',
    catalogVersion: 'test-1',
  }),
}))
vi.mock('../catalog/runtime', () => ({
  loadIdentityCatalog: async () => ({
    projection: {
      regions: [
        {
          regionId: 'region-a',
          identityOrigin: 'https://identity.example.com',
        },
      ],
    },
    presentation: { themePairingId: 'octamorph-iris' },
  }),
}))
vi.mock('../presentation/theme', () => ({ installPresentationTheme: vi.fn() }))
const id = '01994200-0000-7000-8000-000000000001'
const entry = {
  schemaVersion: 1 as const,
  sourceRegionId: 'region-a',
  activationId: id,
  provisionerId: id,
  scimUserId: id,
  ceremony: {
    schemaVersion: 1 as const,
    attemptId: id,
    continuationId: id,
    expectedCeremonyRevision: '1',
  },
  expiresAt: '2099-01-01T00:00:00Z',
  startCapability: btoa('protected-start').replace(/=+$/u, ''),
}
const catalog = {
  projection: {
    regions: [
      { regionId: 'region-a', identityOrigin: 'https://identity.example.com' },
    ],
  },
} as unknown as LoadedIdentityCatalog
const fragment = { entry, catalogDigest: 'A'.repeat(43) }
afterEach(() => {
  cleanup()
  call.mockReset()
  delete window.__MM_AUTH_FRAGMENT_V1__
})
describe('Plan 09 human activation flow', () => {
  it('retries the same protected email request after an uncertain response', async () => {
    call
      .mockRejectedValueOnce(new ScimIdentityError(true, 0))
      .mockResolvedValueOnce({ accepted: true })
    render(
      <I18nextProvider i18n={i18n}>
        <ActivationFlow
          catalog={catalog}
          fragment={fragment}
          onSubmitted={vi.fn()}
          onInvalid={vi.fn()}
        />
      </I18nextProvider>,
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'person@example.com' },
    })
    fireEvent.submit(screen.getByRole('textbox').closest('form')!)
    await screen.findByText(
      'The activation service is temporarily unavailable. Retry the same request.',
    )
    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Retry' }) as HTMLButtonElement)
          .disabled,
      ).toBe(false),
    )
    fireEvent.click(screen.getByText('Retry'))
    await screen.findByText('Check your email')
    expect(call.mock.calls[0].slice(0, 3)).toEqual(
      call.mock.calls[1].slice(0, 3),
    )
    expect(call.mock.calls[0][1]).toEqual({
      ceremony: entry.ceremony,
      startCapability: entry.startCapability,
      submittedEmail: 'person@example.com',
    })
  })
  it('submits a separate completion capability and keeps target access pending', async () => {
    const completion = {
      activation: {
        ceremony: { ...entry.ceremony, expectedCeremonyRevision: '2' },
        activationId: id,
        provisionerId: id,
        scimUserId: id,
        expectedActivationRevision: '2',
        proof: {
          kind: 'new_account',
          verifiedPrimaryEmailReceiptId: id,
          expectedProvisionalIdentityRevision: '1',
        },
      },
      completionCapability: btoa('protected-completion').replace(/=+$/u, ''),
    }
    call
      .mockResolvedValueOnce({ completion })
      .mockResolvedValueOnce({ nextStep: 'pending_provisioning' })
    const submitted = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <ActivationFlow
          catalog={catalog}
          fragment={{
            ...fragment,
            challenge: { challengeId: id, proof: 'A'.repeat(43) },
          }}
          onSubmitted={submitted}
          onInvalid={vi.fn()}
        />
      </I18nextProvider>,
    )
    await screen.findByText('Email verified')
    fireEvent.click(screen.getByText('Continue activation'))
    await screen.findByText('Provisioning pending')
    expect(call.mock.calls[1][0]).toBe('identity.scim.activation.complete')
    expect(call.mock.calls[1][1]).toEqual(completion)
    expect(submitted).toHaveBeenCalledOnce()
    expect(screen.getByText(/Access is not granted by this page/)).toBeTruthy()
  })
  it('scrubs early entry custody and conceals the flow on pagehide', async () => {
    Object.defineProperty(window, '__MM_AUTH_FRAGMENT_V1__', {
      value: '#scim=' + btoa(JSON.stringify(fragment)).replace(/=+$/u, ''),
      configurable: true,
    })
    render(
      <I18nextProvider i18n={i18n}>
        <ScimActivationPage />
      </I18nextProvider>,
    )
    await screen.findByRole('textbox')
    expect(window.__MM_AUTH_FRAGMENT_V1__).toBeUndefined()
    fireEvent(window, new Event('pagehide'))
    expect(screen.queryByRole('textbox')).toBeNull()
    fireEvent(window, new Event('pageshow'))
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})
