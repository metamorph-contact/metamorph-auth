import { describe, expect, it, vi } from 'vitest'
import type { LoadedIdentityCatalog } from '../catalog/runtime'
import { ConditionalStepUpSession, type ConditionalIdentityOwner } from './conditional-continuation-client'

const id = (n: number) => `018f0000-0000-7000-8000-${String(n).padStart(12, '0')}`
const epoch = Date.parse('2030-01-01T00:00:00Z')
const entry = { locale: 'en', authProjectionId: 'octamorph', catalogVersion: 'catalog-1', continuationId: id(1) }
function fixture() {
  let clock = epoch
  let selected = { identityHomeTenantId: id(2), userId: id(3), containerId: id(4), accountSlotId: id(5), accountSessionId: id(6) }
  const challenge = {
    decisionId: id(7), decisionRegionId: 'product-b', continuationId: id(1), identityHomeRegionId: 'home-a',
    actionBindingSha256: 'a'.repeat(64), createdAt: new Date(epoch).toISOString(), expiresAt: new Date(epoch + 300_000).toISOString(),
    required: ['recent', 'mfa'], baselineRequired: ['hardware_bound', 'separate_local_factor'],
    action: { ...selected, productId: 'octamorph', surfaceId: 'web', clientId: 'octamorph.web', resourceId: 'document', actionId: 'read',
      resource: { kind: 'project', tenantId: id(8), productId: 'octamorph', projectId: id(9), productSectionKey: 'workspace' },
      ceremonyTargetSha256: 'b'.repeat(64), originalEvidenceRevision: '1' },
  }
  const catalog = { locale: 'en', projection: { ...entry, productId: 'octamorph', surfaceId: 'web', clientId: 'octamorph.web', supportedLocales: ['en'],
    expiresAt: new Date(epoch + 600_000).toISOString(), regions: [{ regionId: 'home-a' }, { regionId: 'product-b' }] } } as unknown as LoadedIdentityCatalog
  const proof = { schemaVersion: 1, action: { ceremonyId: id(10), expectedAccountSessionId: id(6), evidenceRevision: '2' }, evidenceRevision: '2', expiresAt: new Date(epoch + 600_000).toISOString() }
  const owner: ConditionalIdentityOwner = {
    resolve: vi.fn(async () => ({ catalog, challengeJson: JSON.stringify(challenge) })),
    currentSelection: vi.fn(() => selected),
    collect: vi.fn(async () => JSON.stringify(proof)),
    returnToAction: vi.fn(async () => {}),
  }
  return { owner, challenge, catalog, proof, now: () => clock, advance: (ms: number) => { clock += ms }, switchAccount: () => { selected = { ...selected, accountSlotId: id(11) } } }
}

describe('EA-10E conditional identity continuation', () => {
  it('returns the exact frozen action and new common proof once without changing the selected account', async () => {
    const f = fixture(), signal = new AbortController().signal
    const session = await ConditionalStepUpSession.resolve(entry, f.owner, signal, f.now)
    const phases: string[] = []
    await session.run(signal, (phase) => phases.push(phase))
    expect(phases).toEqual(['collecting', 'returning'])
    expect(f.owner.collect).toHaveBeenCalledWith(session.challenge, signal)
    expect(f.owner.returnToAction).toHaveBeenCalledWith(session.challenge, f.proof.action, signal)
    expect(Object.isFrozen(session.challenge.action.resource)).toBe(true)
    expect(session.challenge.action.ceremonyTargetSha256).not.toBe(session.challenge.actionBindingSha256)
    await expect(session.run(signal, () => {})).rejects.toMatchObject({ kind: 'uncertain' })
    expect(f.owner.collect).toHaveBeenCalledTimes(1)
    expect(f.owner.returnToAction).toHaveBeenCalledTimes(1)
  })

  it('rejects wrong nonce, catalog product, region, empty requirements and extended/future lifetime before collection', async () => {
    for (const mutate of [
      (f: ReturnType<typeof fixture>) => { f.challenge.continuationId = id(12) },
      (f: ReturnType<typeof fixture>) => { f.challenge.action.productId = 'other' },
      (f: ReturnType<typeof fixture>) => { f.challenge.decisionRegionId = 'unknown' },
      (f: ReturnType<typeof fixture>) => { f.challenge.required = []; f.challenge.baselineRequired = [] },
      (f: ReturnType<typeof fixture>) => { f.challenge.expiresAt = new Date(epoch + 300_001).toISOString() },
      (f: ReturnType<typeof fixture>) => { f.challenge.createdAt = new Date(epoch + 2001).toISOString() },
      (f: ReturnType<typeof fixture>) => { f.challenge.action.resource.productId = 'other' },
      (f: ReturnType<typeof fixture>) => { f.challenge.action.ceremonyTargetSha256 = f.challenge.actionBindingSha256 },
    ]) {
      const f = fixture(); mutate(f)
      await expect(ConditionalStepUpSession.resolve(entry, f.owner, new AbortController().signal, f.now)).rejects.toMatchObject({ kind: 'mismatch' })
      expect(f.owner.collect).not.toHaveBeenCalled()
    }
  })

  it('rejects duplicate/unknown wire fields and does not accept a lease or permit in a challenge', async () => {
    for (const corrupt of [
      (s: string) => s.replace('"decisionId":', `"decisionId":"${id(7)}","decisionId":`),
      (s: string) => s.replace('{', '{"targetLeaseId":"injected",'),
    ]) {
      const f = fixture()
      f.owner.resolve = vi.fn(async () => ({ catalog: f.catalog, challengeJson: corrupt(JSON.stringify(f.challenge)) }))
      await expect(ConditionalStepUpSession.resolve(entry, f.owner, new AbortController().signal, f.now)).rejects.toThrow()
      expect(f.owner.collect).not.toHaveBeenCalled()
    }
  })

  it('cancels a selected-account change during bootstrap and collection', async () => {
    for (const at of ['bootstrap', 'collection']) {
      const f = fixture(), signal = new AbortController().signal
      if (at === 'bootstrap') {
        f.owner.resolve = vi.fn(async () => { f.switchAccount(); return { catalog: f.catalog, challengeJson: JSON.stringify(f.challenge) } })
        await expect(ConditionalStepUpSession.resolve(entry, f.owner, signal, f.now)).rejects.toMatchObject({ kind: 'mismatch' })
      } else {
        const session = await ConditionalStepUpSession.resolve(entry, f.owner, signal, f.now)
        f.owner.collect = vi.fn(async () => { f.switchAccount(); return JSON.stringify(f.proof) })
        await expect(session.run(signal, () => {})).rejects.toMatchObject({ kind: 'mismatch' })
      }
      expect(f.owner.returnToAction).not.toHaveBeenCalled()
    }
  })

  it('retains the earlier original nonce and catalog deadlines after a longer-lived proof', async () => {
    for (const catalogCeiling of [false, true]) {
      const f = fixture(), signal = new AbortController().signal
      if (catalogCeiling) (f.catalog.projection as { expiresAt: string }).expiresAt = new Date(epoch + 1000).toISOString()
      const session = await ConditionalStepUpSession.resolve(entry, f.owner, signal, f.now)
      f.owner.collect = vi.fn(async () => { f.advance(catalogCeiling ? 1000 : 300_000); return JSON.stringify(f.proof) })
      await expect(session.run(signal, () => {})).rejects.toMatchObject({ kind: 'expired' })
      expect(session.remainingSeconds()).toBe(0)
      expect(f.owner.returnToAction).not.toHaveBeenCalled()
    }
  })

  it('rejects stale evidence or a proof for another account session', async () => {
    for (const stale of [true, false]) {
      const f = fixture(), signal = new AbortController().signal
      const session = await ConditionalStepUpSession.resolve(entry, f.owner, signal, f.now)
      if (stale) { f.proof.evidenceRevision = '1'; f.proof.action.evidenceRevision = '1' }
      else f.proof.action.expectedAccountSessionId = id(11)
      await expect(session.run(signal, () => {})).rejects.toMatchObject({ kind: 'mismatch' })
      expect(f.owner.returnToAction).not.toHaveBeenCalled()
    }
  })

  it('does not dispatch a late proof after abandonment or repeat an uncertain return', async () => {
    const f = fixture(), controller = new AbortController()
    const session = await ConditionalStepUpSession.resolve(entry, f.owner, controller.signal, f.now)
    f.owner.collect = vi.fn(async () => { controller.abort(); return JSON.stringify(f.proof) })
    await expect(session.run(controller.signal, () => {})).rejects.toThrow()
    expect(f.owner.returnToAction).not.toHaveBeenCalled()
    const g = fixture(), signal = new AbortController().signal
    const second = await ConditionalStepUpSession.resolve(entry, g.owner, signal, g.now)
    g.owner.returnToAction = vi.fn(async () => { throw new Error('Lost return response') })
    await expect(second.run(signal, () => {})).rejects.toThrow('Lost return response')
    await expect(second.run(signal, () => {})).rejects.toMatchObject({ kind: 'uncertain' })
    expect(g.owner.collect).toHaveBeenCalledTimes(1)
    expect(g.owner.returnToAction).toHaveBeenCalledTimes(1)
  })
})
