import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import '../i18n'
import { ConditionalContinuationPresentation } from './conditional-continuation-page'

describe('conditional identity presentation', () => {
  it('shows the missing actual identity owner without a fixture ceremony or enabled action', () => {
    const markup = renderToStaticMarkup(<ConditionalContinuationPresentation owner={undefined} entry={{
      locale: 'en', authProjectionId: 'octamorph', catalogVersion: 'catalog-1', continuationId: '018f0000-0000-7000-8000-000000000001',
    }} />)
    expect(markup).toContain('required identity owner is unavailable')
    expect(markup).not.toContain('Continue verification')
    expect(markup).not.toContain('data-enterprise-fixture')
  })
})
