// Generated from metamorph-saas/crates/enterprise-security-contract. Do not edit.
import type { ExternalIdentityCallbackRequestV1 } from "./types/ExternalIdentityCallbackRequestV1";
import type { ExternalIdentityStartRequestV1 } from "./types/ExternalIdentityStartRequestV1";
import type { ExternalIdentityStartV1 } from "./types/ExternalIdentityStartV1";
import type { IdentityDashboardLaunchRequestV1 } from "./types/IdentityDashboardLaunchRequestV1";
import type { IdentityEmailStartRequestV1 } from "./types/IdentityEmailStartRequestV1";
import type { IdentityEmailVerifyRequestV1 } from "./types/IdentityEmailVerifyRequestV1";
import type { IdentityEntryRequestV1 } from "./types/IdentityEntryRequestV1";
import type { IdentityFederatedStepUpRequestV1 } from "./types/IdentityFederatedStepUpRequestV1";
import type { IdentityFederationProgressV1 } from "./types/IdentityFederationProgressV1";
import type { IdentityIdpSamlHandoffRedeemRequestV1 } from "./types/IdentityIdpSamlHandoffRedeemRequestV1";
import type { IdentityIdpSamlHandoffRedeemResultV1 } from "./types/IdentityIdpSamlHandoffRedeemResultV1";
import type { IdentityJitPrimaryEmailStartResultV1 } from "./types/IdentityJitPrimaryEmailStartResultV1";
import type { IdentityMethodResolutionV1 } from "./types/IdentityMethodResolutionV1";
import type { IdentityProfileCompleteRequestV1 } from "./types/IdentityProfileCompleteRequestV1";
import type { IdentityStepUpResultV1 } from "./types/IdentityStepUpResultV1";
import type { ProfileConnectedIdentitiesPageV1 } from "./types/ProfileConnectedIdentitiesPageV1";
import type { ProfileIdentityLinkPreparedV1 } from "./types/ProfileIdentityLinkPreparedV1";
import type { ProfileIdentityLinkRequestV1 } from "./types/ProfileIdentityLinkRequestV1";
import type { ProfileIdentityUnlinkRequestV1 } from "./types/ProfileIdentityUnlinkRequestV1";
import type { ProfileIdentityUnlinkResultV1 } from "./types/ProfileIdentityUnlinkResultV1";
import type { SelfPageRequestV1 } from "./types/SelfPageRequestV1";

export interface FederationRequestMap {
  "identity.federation.callback": ExternalIdentityCallbackRequestV1;
  "identity.federation.dashboard_launch": IdentityDashboardLaunchRequestV1;
  "identity.federation.handoff.redeem": IdentityIdpSamlHandoffRedeemRequestV1;
  "identity.federation.start": ExternalIdentityStartRequestV1;
  "identity.federation.step_up": IdentityFederatedStepUpRequestV1;
  "identity.jit.primary_email.start": IdentityEmailStartRequestV1;
  "identity.jit.primary_email.verify": IdentityEmailVerifyRequestV1;
  "identity.jit.profile_complete": IdentityProfileCompleteRequestV1;
  "identity.methods.resolve": IdentityEntryRequestV1;
  "profile.identities.link": ProfileIdentityLinkRequestV1;
  "profile.identities.list": SelfPageRequestV1;
  "profile.identities.unlink": ProfileIdentityUnlinkRequestV1;
}

export interface FederationResponseMap {
  "identity.federation.callback": IdentityFederationProgressV1;
  "identity.federation.dashboard_launch": ExternalIdentityStartV1;
  "identity.federation.handoff.redeem": IdentityIdpSamlHandoffRedeemResultV1;
  "identity.federation.start": ExternalIdentityStartV1;
  "identity.federation.step_up": IdentityStepUpResultV1;
  "identity.jit.primary_email.start": IdentityJitPrimaryEmailStartResultV1;
  "identity.jit.primary_email.verify": IdentityFederationProgressV1;
  "identity.jit.profile_complete": IdentityFederationProgressV1;
  "identity.methods.resolve": IdentityMethodResolutionV1;
  "profile.identities.link": ProfileIdentityLinkPreparedV1;
  "profile.identities.list": ProfileConnectedIdentitiesPageV1;
  "profile.identities.unlink": ProfileIdentityUnlinkResultV1;
}
