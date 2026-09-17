import type { BootstrapRequestV1 } from '../contracts/generated/csi10/BootstrapRequestV1'
import type { BootstrapResultV1 } from '../contracts/generated/csi10/BootstrapResultV1'
import type { ProfileActivityPageV1 } from '../contracts/generated/enterprise-security-v1/types/ProfileActivityPageV1'
import type { SelfPageRequestV1 } from '../contracts/generated/enterprise-security-v1/types/SelfPageRequestV1'
import { AuthApi } from '../protocol/http'

const UUID7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u

export interface AccountActivitySession {
  readonly accountSlotId: string
  readonly bootstrap: Extract<BootstrapResultV1, { kind: 'ordinary' }>
}

export function accountSlotFromSearch(search: string): string {
  const parameters = new URLSearchParams(search)
  const values = parameters.getAll('accountSlotId')
  if (values.length !== 1 || [...parameters.keys()].some((key) => key !== 'accountSlotId') || !UUID7.test(values[0] ?? '')) {
    throw new Error('Invalid account activity selection')
  }
  return values[0]!
}

export class AccountSecurityActivityClient {
  readonly #api: AuthApi

  constructor(api = new AuthApi(window.location.origin)) {
    this.#api = api
  }

  async bootstrap(accountSlotId: string): Promise<AccountActivitySession> {
    if (!UUID7.test(accountSlotId)) throw new Error('Invalid account activity selection')
    const request: BootstrapRequestV1 = { schemaVersion: 1, kind: 'ordinary', accountSlotId }
    const bootstrap = await this.#api.post<BootstrapRequestV1, BootstrapResultV1>(
      '/api/auth/v1/product-sessions/bootstrap',
      request,
      'productBootstrap',
    )
    if (bootstrap.kind !== 'ordinary' || bootstrap.accountSlotId !== accountSlotId) {
      throw new Error('Product bootstrap selected another account')
    }
    return Object.freeze({ accountSlotId, bootstrap })
  }

  async page(session: AccountActivitySession, cursor: string | null = null): Promise<ProfileActivityPageV1> {
    const request: SelfPageRequestV1 = { schemaVersion: 1, page: { limit: 25, cursor } }
    const result = await this.#api.post<SelfPageRequestV1, ProfileActivityPageV1>(
      '/api/auth/v1/security/profile/activity/list',
      request,
      'profileActivity',
      session.bootstrap.csrfToken,
      { 'X-Metamorph-Account-Slot': session.accountSlotId },
    )
    if (result.page.partialFailures.length !== 0 || new Set(result.page.items.map((item) => item.eventId)).size !== result.page.items.length) {
      throw new Error('Invalid self activity page')
    }
    return result
  }
}
