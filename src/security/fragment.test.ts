import { describe, expect, it } from 'vitest'

import {
  InvalidAuthFragmentError,
  consumeAuthFragment,
  consumeAuthFragmentOnce,
  discardConsumedAuthFragment,
  hasUnconsumedAuthFragment,
  __test,
} from './fragment'

describe('authentication fragment parser', () => {
  it('accepts an exact initial fragment', () => {
    expect(__test.parseFragment(`#v=1&kind=initial&projection=octamorph-browser&controller=local-a&catalog=central-development-6&digest=${'d'.repeat(43)}&recovery=aaa.bbb.ccc&start=ddd.eee.fff`)).toMatchObject({
      kind: 'initial',
      controller: 'local-a',
    })
  })

  it('accepts the exact destination continuation grammar', () => {
    expect(__test.parseFragment(`#v=1&flow=01890f3a-6e3a-7c15-8c65-450b85e12a01&operation=01890f3a-6e3a-7c15-8c65-450b85e12a02&digest=${'d'.repeat(43)}&receipt=aaa.bbb.ccc`)).toMatchObject({
      kind: 'destination',
      digest: 'd'.repeat(43),
    })
  })

  it.each([
    `#v=1&kind=initial&projection=p&controller=c&catalog=v&digest=${'d'.repeat(43)}&recovery=aaa.bbb.ccc&start=ddd.eee.fff&extra=x`,
    `#v=1&v=1&flow=01890f3a-6e3a-7c15-8c65-450b85e12a01&operation=01890f3a-6e3a-7c15-8c65-450b85e12a02&digest=${'d'.repeat(43)}&receipt=aaa.bbb.ccc`,
    `#v=1&flow=01890f3a-6e3a-7c15-8c65-450b85e12a01&operation=01890f3a-6e3a-7c15-8c65-450b85e12a02&digest=${'d'.repeat(43)}&receipt=https%3A%2F%2Fevil.example`,
    `#flow=01890f3a-6e3a-7c15-8c65-450b85e12a01&operation=01890f3a-6e3a-7c15-8c65-450b85e12a02&digest=${'d'.repeat(43)}&receipt=aaa.bbb.ccc`,
    `#kind=initial&v=1&projection=p&controller=c&catalog=v&digest=${'d'.repeat(43)}&recovery=aaa.bbb.ccc&start=ddd.eee.fff`,
  ])('rejects a malformed or extended fragment', (hash) => {
    expect(() => __test.parseFragment(hash)).toThrow(InvalidAuthFragmentError)
  })

  it('scrubs a malformed capability fragment before rejecting it', () => {
    window.history.replaceState(null, '', `/#v=1&kind=initial&recovery=${'r'.repeat(43)}&extra=x`)
    expect(() => consumeAuthFragment()).toThrow(InvalidAuthFragmentError)
    expect(window.location.hash).toBe('')
  })

  it('persists recovery state before removing an initial fragment', () => {
    const hash = `#v=1&kind=initial&projection=octamorph-browser&controller=local-a&catalog=central-development-6&digest=${'d'.repeat(43)}&recovery=aaa.bbb.ccc&start=ddd.eee.fff`
    window.history.replaceState(null, '', `/${hash}`)
    const observations: string[] = []
    consumeAuthFragment(window.location, (fragment) => {
      observations.push(fragment.kind, window.location.hash)
    })
    expect(observations).toEqual(['initial', hash])
    expect(window.location.hash).toBe('')
  })

  it('consumes the fragment staged by the first executable after URL scrubbing', () => {
    const hash = `#v=1&kind=initial&projection=octamorph-browser&controller=local-a&catalog=central-development-6&digest=${'d'.repeat(43)}&recovery=aaa.bbb.ccc&start=ddd.eee.fff`
    window.history.replaceState(null, '', '/')
    Object.defineProperty(window, '__MM_AUTH_FRAGMENT_V1__', {
      value: hash,
      configurable: true,
      enumerable: false,
      writable: false,
    })
    discardConsumedAuthFragment()
    expect(hasUnconsumedAuthFragment()).toBe(true)
    expect(consumeAuthFragmentOnce()).toMatchObject({ kind: 'initial' })
    expect(hasUnconsumedAuthFragment()).toBe(false)
    discardConsumedAuthFragment()
  })

  it('consumes a staged destination continuation after URL scrubbing', () => {
    const hash = `#v=1&flow=01890f3a-6e3a-7c15-8c65-450b85e12a01&operation=01890f3a-6e3a-7c15-8c65-450b85e12a02&digest=${'d'.repeat(43)}&receipt=aaa.bbb.ccc`
    window.history.replaceState(null, '', '/')
    Object.defineProperty(window, '__MM_AUTH_FRAGMENT_V1__', {
      value: hash,
      configurable: true,
      enumerable: false,
      writable: false,
    })
    discardConsumedAuthFragment()
    expect(hasUnconsumedAuthFragment()).toBe(true)
    expect(consumeAuthFragmentOnce()).toMatchObject({ kind: 'destination' })
    expect(hasUnconsumedAuthFragment()).toBe(false)
    discardConsumedAuthFragment()
  })
})
