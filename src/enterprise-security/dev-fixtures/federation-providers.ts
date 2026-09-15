import type { IdentityFederationProviderV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityFederationProviderV1'
export const fixtureFederationProviders: IdentityFederationProviderV1[] = [
  {
    targetTenantId: '01994000-0000-7000-8000-000000000001',
    providerId: '01994000-0000-7000-8000-000000000002',
    providerRevision: '1',
    protocol: 'oidc',
    providerDisplayName: 'Example OIDC',
    providerRegionId: 'local-a',
  },
  {
    targetTenantId: '01994000-0000-7000-8000-000000000001',
    providerId: '01994000-0000-7000-8000-000000000003',
    providerRevision: '1',
    protocol: 'saml',
    providerDisplayName: 'Example SAML',
    providerRegionId: 'local-a',
  },
]
