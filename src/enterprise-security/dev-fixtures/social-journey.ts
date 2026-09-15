import type { SocialProviderV1 } from '../../contracts/generated/enterprise-security-v1/types/SocialProviderV1'
/** Development-only navigation fixture. No credential, callback or session. */
export function socialAuthorizationUri(provider: SocialProviderV1): string {
  const url = new URL({
    google: 'https://accounts.google.com/o/oauth2/v2/auth',
    microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    github: 'https://github.com/login/oauth/authorize',
  }[provider])
  for (const [key, value] of Object.entries({
    client_id: 'development-only', redirect_uri: 'https://identity.example.invalid/social/callback',
    response_type: 'code', scope: provider === 'github' ? 'user:email' : 'openid email',
    state: 'A'.repeat(43), code_challenge: 'B'.repeat(43), code_challenge_method: 'S256',
    ...(provider === 'github' ? {} : { nonce: 'C'.repeat(43) }),
  })) url.searchParams.set(key, value)
  return url.href
}
