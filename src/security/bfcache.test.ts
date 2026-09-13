import { beforeEach, describe, expect, it, vi } from 'vitest'

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
