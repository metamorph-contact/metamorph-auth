import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('BFCache guard', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = '<input type="password" value="secret">'
  })

  it('installs synchronously and scrubs password controls on pagehide', async () => {
    const { installBfcacheGuard } = await import('./bfcache')
    installBfcacheGuard()
    window.dispatchEvent(new Event('pagehide'))
    expect((document.querySelector('input') as HTMLInputElement).value).toBe('')
  })
})
