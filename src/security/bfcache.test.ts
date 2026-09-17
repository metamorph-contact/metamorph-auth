import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LoadedIdentityCatalog } from '../catalog/runtime'

afterEach(() => vi.unstubAllGlobals())

describe('BFCache guard', () => {
  beforeEach(() => {
    vi.resetModules()
    document.documentElement.style.visibility = ''
    document.body.innerHTML = '<input type="password" value="secret"><input value="email@example.com"><textarea>notes</textarea><img src="blob:https://auth.example/picture">'
  })

  it('installs synchronously and conceals and scrubs retained UI on pagehide', async () => {
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { revokeObjectURL }))
    const { installBfcacheGuard } = await import('./bfcache')
    installBfcacheGuard()
    window.dispatchEvent(new Event('pagehide'))
    expect([...document.querySelectorAll('input')].every((input) => input.value === '')).toBe(true)
    expect((document.querySelector('textarea') as HTMLTextAreaElement).value).toBe('')
    expect(revokeObjectURL).toHaveBeenCalledOnce()
    expect(document.documentElement.style.visibility).toBe('hidden')
  })
})

describe('conditional BFCache recovery', () => {
  it('replaces a previous SPA return while the new nonce is pending or unavailable', async () => {
    vi.resetModules()
    const listeners = new Map<string, (event: { persisted: boolean }) => void>()
    const replace = vi.fn()
    const noncePath = '/en/auth/new-product/v1/conditional-step-up/018f0000-0000-7000-8000-000000000001'
    vi.stubGlobal('window', {
      location: { href: `https://auth.example${noncePath}?unexpected=input#secret`, replace },
      addEventListener: (name: string, listener: (event: { persisted: boolean }) => void) => listeners.set(name, listener),
    })
    const { armBfcacheRecovery, armCurrentBfcacheRecovery } = await import('./bfcache')
    const oldCatalog = { projection: {
      commonUiOrigin: 'https://auth.example', productUiOrigin: 'https://old-product.example',
      registeredReturns: [{ purpose: 'authStartRecovery', path: '/en/auth/start' }],
    } } as unknown as LoadedIdentityCatalog
    armBfcacheRecovery(oldCatalog)
    armCurrentBfcacheRecovery()
    listeners.get('pageshow')?.({ persisted: false })
    expect(replace).not.toHaveBeenCalled()
    listeners.get('pageshow')?.({ persisted: true })
    expect(replace).toHaveBeenCalledExactlyOnceWith(`https://auth.example${noncePath}`)
  })
})
