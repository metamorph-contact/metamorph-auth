import {
  beginBrowserLogout,
  bindLogoutOperation,
  BrowserLogoutPendingError,
  completeBrowserLogout,
  readBrowserIdentityRecord,
  restoreBrowserAfterUncommittedLogout,
  type BrowserHeadState,
  type LogoutPendingState,
} from "../browser/head-store";
import type { LoadedIdentityCatalog } from "../catalog/runtime";
import {
  controllerApiForRegion,
  identityApiForRegion,
} from "../catalog/boundaries";
import type { BrowserLogoutCleanupPageAcknowledgementV1 } from "../contracts/generated/csi10/BrowserLogoutCleanupPageAcknowledgementV1";
import type { BrowserLogoutCommitRequestV1 } from "../contracts/generated/csi10/BrowserLogoutCommitRequestV1";
import type { BrowserLogoutCompleteAcknowledgementV1 } from "../contracts/generated/csi10/BrowserLogoutCompleteAcknowledgementV1";
import type { BrowserLogoutDetachRequestV1 } from "../contracts/generated/csi10/BrowserLogoutDetachRequestV1";
import type { BrowserLogoutOptionsRequestV1 } from "../contracts/generated/csi10/BrowserLogoutOptionsRequestV1";
import type { BrowserLogoutOptionsResultV1 } from "../contracts/generated/csi10/BrowserLogoutOptionsResultV1";
import type { BrowserLogoutPrepareRequestV1 } from "../contracts/generated/csi10/BrowserLogoutPrepareRequestV1";
import type { BrowserLogoutResultV1 } from "../contracts/generated/csi10/BrowserLogoutResultV1";
import type { BrowserLogoutStatusRequestV1 } from "../contracts/generated/csi10/BrowserLogoutStatusRequestV1";
import type { LogoutAccountMetadataRequestV1 } from "../contracts/generated/csi10/LogoutAccountMetadataRequestV1";
import type { LogoutAccountMetadataResultV1 } from "../contracts/generated/csi10/LogoutAccountMetadataResultV1";
import type { LogoutAccountReferenceV1 } from "../contracts/generated/csi10/LogoutAccountReferenceV1";
import type { AuthApi } from "./http";
import { randomSecret32 } from "./random";
import {
  clearAccountLogoutPending,
  readAccountLogoutPending,
  saveAccountLogoutPending,
  type AccountLogoutPending,
} from "../security/session-receipts";

export interface LogoutDisplayOption {
  readonly reference: LogoutAccountReferenceV1;
  readonly metadata: Extract<
    LogoutAccountMetadataResultV1,
    { kind: "current" }
  >;
}

export interface LogoutDisplayOptions {
  readonly accounts: readonly LogoutDisplayOption[];
  readonly unavailableCount: number;
}

function headReference(head: BrowserHeadState) {
  return {
    browserHeadId: head.browserHeadId,
    browserInitializationId: head.browserInitializationId,
    placement: head.placement,
  };
}

function safeId(value: string): string {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(
      value,
    )
  ) {
    throw new Error("Invalid logout operation identifier");
  }
  return encodeURIComponent(value);
}

function assertLogoutResult(
  result: BrowserLogoutResultV1,
  expectedScope: BrowserLogoutResultV1["scope"],
  expectedOperationId?: string,
  expectedAccountId?: string,
  expectedBrowserHeadId?: string,
): void {
  if (
    result.scope !== expectedScope ||
    (expectedOperationId !== undefined &&
      result.operationId !== expectedOperationId)
  ) {
    throw new Error("Logout response binding mismatch");
  }
  if (expectedScope === "identityAccount") {
    if (
      ["cleanupPage", "retired", "detached", "notCommittedBrowserAll"].includes(
        result.state,
      )
    ) {
      throw new Error("Invalid account logout state");
    }
    if (
      result.state === "notCommittedAccount" &&
      result.browserAccountId !== expectedAccountId
    ) {
      throw new Error("Account logout response selected another account");
    }
    if (
      expectedAccountId !== undefined &&
      result.state === "prepared" &&
      (result.accounts.length !== 1 ||
        result.accounts[0]?.browserAccountId !== expectedAccountId)
    ) {
      throw new Error("Account logout preparation selected another account");
    }
    if (
      expectedAccountId !== undefined &&
      result.state === "complete" &&
      (result.accounts.length !== 1 ||
        result.accounts[0]?.browserAccountId !== expectedAccountId)
    ) {
      throw new Error("Account logout completion selected another account");
    }
  } else {
    if (
      result.state === "acknowledged" ||
      result.state === "notCommittedAccount"
    ) {
      throw new Error("Invalid browser logout state");
    }
    if (
      result.state === "notCommittedBrowserAll" &&
      result.sourceBrowserHeadId !== expectedBrowserHeadId
    ) {
      throw new Error("Browser logout response selected another head");
    }
  }
}

export const __test = Object.freeze({ assertLogoutResult });

export class BrowserLogoutClient {
  readonly api: AuthApi;

  constructor(
    readonly catalog: LoadedIdentityCatalog,
    readonly head: BrowserHeadState,
  ) {
    const region = catalog.projection.regions.find(
      (candidate) => candidate.regionId === head.placement.controllerRegionId,
    );
    if (region === undefined)
      throw new Error("Pinned controller is unavailable");
    this.api = controllerApiForRegion(
      catalog,
      region.regionId,
      region.controllerOrigin,
    );
  }

  async options(): Promise<LogoutDisplayOptions> {
    const request: BrowserLogoutOptionsRequestV1 = {
      schemaVersion: 1,
      head: headReference(this.head),
    };
    const options = await this.api.post<
      BrowserLogoutOptionsRequestV1,
      BrowserLogoutOptionsResultV1
    >("/api/auth/v1/browser-logout-options", request, "logoutOptions");
    if (
      new Set(options.accounts.map((account) => account.browserAccountId))
        .size !== options.accounts.length
    ) {
      throw new Error("Duplicate logout account option");
    }
    const resolved: Array<LogoutDisplayOption | null | undefined> = Array(
      options.accounts.length,
    );
    let unavailableCount = 0;
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(4, options.accounts.length) }, async () => {
        while (cursor < options.accounts.length) {
          const index = cursor++;
          const reference = options.accounts[index]!;
          try {
            const metadata = await identityApiForRegion(
              this.catalog,
              reference.homeRegionId,
              reference.identityApiOrigin,
            ).post<
              LogoutAccountMetadataRequestV1,
              LogoutAccountMetadataResultV1
            >(
              "/api/auth/v1/account-metadata",
              { schemaVersion: 1, capability: reference.metadataCapability },
              "logoutAccountMetadata",
            );
            if (
              metadata.kind === "current" &&
              metadata.browserAccountId === reference.browserAccountId
            ) {
              resolved[index] = Object.freeze({ reference, metadata });
            } else {
              resolved[index] = null;
              unavailableCount += 1;
            }
          } catch {
            resolved[index] = null;
            unavailableCount += 1;
            // A single unavailable home must not suppress all other logout choices.
          }
        }
      }),
    );
    return Object.freeze({
      accounts: Object.freeze(
        resolved.filter(
          (entry): entry is LogoutDisplayOption =>
            entry !== null && entry !== undefined,
        ),
      ),
      unavailableCount,
    });
  }

  async logoutAccount(
    browserAccountId: string,
  ): Promise<BrowserLogoutResultV1> {
    const existing = readAccountLogoutPending();
    if (existing !== null) {
      if (existing.browserAccountId !== browserAccountId)
        throw new Error(
          "Another account logout is already pending in this tab",
        );
      return this.resumeAccountLogout(existing);
    }
    const prepareAttemptId = randomSecret32();
    const pending = saveAccountLogoutPending({
      schemaVersion: 1,
      browserAccountId,
      prepareAttemptId,
      operationId: null,
      startedAt: new Date().toISOString(),
    });
    const request: BrowserLogoutPrepareRequestV1 = {
      schemaVersion: 1,
      scope: "identityAccount",
      prepareAttemptId,
      browserAccountId,
      head: headReference(this.head),
    };
    return this.resumeAccountLogout(pending, request);
  }

  async prepareLogoutAll(): Promise<BrowserLogoutResultV1> {
    const resume = async (pending: LogoutPendingState) => {
      if (
        pending.source.browserHeadId !== this.head.browserHeadId ||
        pending.source.browserInitializationId !==
          this.head.browserInitializationId
      ) {
        throw new Error(
          "Pending browser logout belongs to another browser head",
        );
      }
      return BrowserLogoutClient.resumeBrowserLogout(this.catalog, pending);
    };
    const existing = await readBrowserIdentityRecord();
    if (existing?.state === "logoutPending") return resume(existing);
    const prepareAttemptId = randomSecret32();
    try {
      await beginBrowserLogout(this.head, prepareAttemptId);
    } catch (error) {
      if (error instanceof BrowserLogoutPendingError)
        return resume(error.pending);
      throw error;
    }
    const result = await this.prepare({
      schemaVersion: 1,
      scope: "identityBrowserAll",
      prepareAttemptId,
      head: headReference(this.head),
    });
    return result.state === "prepared"
      ? result
      : this.finishServerCleanup(result);
  }

  private async prepare(
    request: BrowserLogoutPrepareRequestV1,
  ): Promise<BrowserLogoutResultV1> {
    const result = await this.api.post<
      BrowserLogoutPrepareRequestV1,
      BrowserLogoutResultV1
    >(
      "/api/auth/v1/browser-logout-operations",
      request,
      "logoutResult",
      undefined,
      { "Idempotency-Key": request.prepareAttemptId },
    );
    assertLogoutResult(
      result,
      request.scope,
      undefined,
      request.scope === "identityAccount"
        ? request.browserAccountId
        : undefined,
      request.scope === "identityBrowserAll"
        ? request.head.browserHeadId
        : undefined,
    );
    if (request.scope === "identityBrowserAll")
      await bindLogoutOperation(request.prepareAttemptId, result.operationId);
    return result;
  }

  async commitPrepared(
    prepared: Extract<BrowserLogoutResultV1, { state: "prepared" }>,
  ): Promise<BrowserLogoutResultV1> {
    const expectedAccountId =
      prepared.scope === "identityAccount"
        ? prepared.accounts.length === 1
          ? prepared.accounts[0]?.browserAccountId
          : undefined
        : undefined;
    if (
      prepared.scope === "identityAccount" &&
      expectedAccountId === undefined
    ) {
      throw new Error(
        "Account logout preparation has no unique account binding",
      );
    }
    const result = await this.api.post<
      BrowserLogoutCommitRequestV1,
      BrowserLogoutResultV1
    >(
      `/api/auth/v1/browser-logout-operations/${safeId(prepared.operationId)}/commit`,
      {
        schemaVersion: 1,
        operationId: prepared.operationId,
        logoutCsrfToken: prepared.logoutCsrfToken,
        head: headReference(this.head),
      },
      "logoutResult",
      prepared.logoutCsrfToken,
      { "Idempotency-Key": prepared.operationId },
    );
    assertLogoutResult(
      result,
      prepared.scope,
      prepared.operationId,
      expectedAccountId,
      this.head.browserHeadId,
    );
    return this.finishServerCleanup(result, expectedAccountId);
  }

  async resumeAccountLogout(
    pending: AccountLogoutPending,
    request: BrowserLogoutPrepareRequestV1 = {
      schemaVersion: 1,
      scope: "identityAccount",
      prepareAttemptId: pending.prepareAttemptId,
      browserAccountId: pending.browserAccountId,
      head: headReference(this.head),
    },
  ): Promise<BrowserLogoutResultV1> {
    if (
      request.scope !== "identityAccount" ||
      request.prepareAttemptId !== pending.prepareAttemptId ||
      request.browserAccountId !== pending.browserAccountId ||
      request.head.browserHeadId !== this.head.browserHeadId ||
      request.head.browserInitializationId !== this.head.browserInitializationId
    ) {
      throw new Error("Account logout recovery request mismatch");
    }
    let result: BrowserLogoutResultV1;
    if (pending.operationId === null) {
      result = await this.prepare(request);
    } else {
      const status: BrowserLogoutStatusRequestV1 = {
        schemaVersion: 1,
        operationId: pending.operationId,
        // The source initialization survives the acknowledgement response-loss
        // window in which the server has already deleted the operation cookie.
        proof: { kind: "sourceInitialization", head: headReference(this.head) },
      };
      result = await this.api.post<
        BrowserLogoutStatusRequestV1,
        BrowserLogoutResultV1
      >(
        `/api/auth/v1/browser-logout-operations/${safeId(pending.operationId)}/status`,
        status,
        "logoutResult",
      );
      assertLogoutResult(
        result,
        "identityAccount",
        pending.operationId,
        pending.browserAccountId,
      );
    }
    const bound = saveAccountLogoutPending({
      ...pending,
      operationId: result.operationId,
    });
    if (result.state === "prepared") result = await this.commitPrepared(result);
    else
      result = await this.finishServerCleanup(result, pending.browserAccountId);
    if (
      result.state === "acknowledged" ||
      result.state === "notCommittedAccount"
    ) {
      clearAccountLogoutPending(bound.operationId ?? undefined);
    }
    return result;
  }

  async finishServerCleanup(
    initial: BrowserLogoutResultV1,
    expectedAccountId?: string,
  ): Promise<BrowserLogoutResultV1> {
    let result = initial;
    const expectedScope = initial.scope;
    const expectedOperationId = initial.operationId;
    if (
      expectedScope === "identityAccount" &&
      expectedAccountId === undefined
    ) {
      throw new Error("Account logout cleanup is missing its account binding");
    }
    let cleanupPages = 0;
    // Delivery itself is durable. Browser work here only acknowledges terminal
    // server state and bounded cookie-cleanup pages.
    if (result.state === "complete") {
      const request: BrowserLogoutCompleteAcknowledgementV1 = {
        schemaVersion: 1,
        operationId: result.operationId,
        logoutCsrfToken: result.logoutCsrfToken,
      };
      result = await this.api.post<
        BrowserLogoutCompleteAcknowledgementV1,
        BrowserLogoutResultV1
      >(
        `/api/auth/v1/browser-logout-operations/${safeId(result.operationId)}/complete-acknowledgements`,
        request,
        "logoutResult",
        result.logoutCsrfToken,
        { "Idempotency-Key": `${result.operationId}:complete` },
      );
      assertLogoutResult(
        result,
        expectedScope,
        expectedOperationId,
        expectedAccountId,
        this.head.browserHeadId,
      );
    }
    while (result.state === "cleanupPage") {
      cleanupPages += 1;
      if (cleanupPages > 64)
        throw new Error("Browser logout cleanup exceeded its page limit");
      const request: BrowserLogoutCleanupPageAcknowledgementV1 = {
        schemaVersion: 1,
        operationId: result.operationId,
        logoutCsrfToken: result.logoutCsrfToken,
        pageId: result.pageId,
      };
      result = await this.api.post<
        BrowserLogoutCleanupPageAcknowledgementV1,
        BrowserLogoutResultV1
      >(
        `/api/auth/v1/browser-logout-operations/${safeId(result.operationId)}/cleanup-page-acknowledgements`,
        request,
        "logoutResult",
        result.logoutCsrfToken,
        { "Idempotency-Key": result.pageId },
      );
      assertLogoutResult(
        result,
        expectedScope,
        expectedOperationId,
        expectedAccountId,
        this.head.browserHeadId,
      );
    }
    if (
      result.scope === "identityBrowserAll" &&
      result.state === "acknowledged"
    ) {
      throw new Error("Browser-wide logout stopped before cleanup");
    }
    if (
      result.scope === "identityBrowserAll" &&
      (result.state === "retired" || result.state === "detached")
    ) {
      await completeBrowserLogout(result.operationId);
    } else if (result.state === "notCommittedBrowserAll") {
      await restoreBrowserAfterUncommittedLogout(result.operationId);
    }
    return result;
  }

  async refresh(result: BrowserLogoutResultV1): Promise<BrowserLogoutResultV1> {
    if (
      result.state === "retired" ||
      result.state === "detached" ||
      result.state === "acknowledged" ||
      result.state === "notCommittedAccount" ||
      result.state === "notCommittedBrowserAll"
    ) {
      return result;
    }
    if (result.scope === "identityAccount") {
      const pending = readAccountLogoutPending();
      if (pending === null || pending.operationId !== result.operationId) {
        throw new Error("Missing account logout recovery binding");
      }
      return this.resumeAccountLogout(pending);
    }
    const request: BrowserLogoutStatusRequestV1 = {
      schemaVersion: 1,
      operationId: result.operationId,
      proof: { kind: "sourceInitialization", head: headReference(this.head) },
    };
    const current = await this.api.post<
      BrowserLogoutStatusRequestV1,
      BrowserLogoutResultV1
    >(
      `/api/auth/v1/browser-logout-operations/${safeId(result.operationId)}/status`,
      request,
      "logoutResult",
    );
    assertLogoutResult(
      current,
      result.scope,
      result.operationId,
      undefined,
      this.head.browserHeadId,
    );
    const finished = await this.finishServerCleanup(current);
    if (
      finished.scope === "identityAccount" &&
      (finished.state === "acknowledged" ||
        finished.state === "notCommittedAccount")
    ) {
      clearAccountLogoutPending(finished.operationId);
    }
    return finished;
  }

  async detach(
    result: Extract<
      BrowserLogoutResultV1,
      { state: "partial" | "complete" | "cleanupPage" }
    >,
  ): Promise<BrowserLogoutResultV1> {
    if (result.scope !== "identityBrowserAll")
      throw new Error("Only browser-wide logout can detach");
    const request: BrowserLogoutDetachRequestV1 = {
      schemaVersion: 1,
      operationId: result.operationId,
      logoutCsrfToken: result.logoutCsrfToken,
    };
    const detached = await this.api.post<
      BrowserLogoutDetachRequestV1,
      BrowserLogoutResultV1
    >(
      `/api/auth/v1/browser-logout-operations/${safeId(result.operationId)}/detachments`,
      request,
      "logoutResult",
      result.logoutCsrfToken,
      { "Idempotency-Key": `${result.operationId}:detach` },
    );
    assertLogoutResult(
      detached,
      "identityBrowserAll",
      result.operationId,
      undefined,
      this.head.browserHeadId,
    );
    if (detached.state !== "detached")
      throw new Error("Logout detach did not reach a terminal result");
    await completeBrowserLogout(detached.operationId);
    return detached;
  }

  static async resumeBrowserLogout(
    catalog: LoadedIdentityCatalog,
    pending: LogoutPendingState,
  ): Promise<BrowserLogoutResultV1> {
    const client = new BrowserLogoutClient(catalog, pending.source);
    if (pending.operationId === null) {
      const result = await client.prepare({
        schemaVersion: 1,
        scope: "identityBrowserAll",
        prepareAttemptId: pending.prepareAttemptId,
        head: headReference(pending.source),
      });
      return result.state === "prepared"
        ? result
        : client.finishServerCleanup(result);
    }
    const request: BrowserLogoutStatusRequestV1 = {
      schemaVersion: 1,
      operationId: pending.operationId,
      proof: {
        kind: "sourceInitialization",
        head: headReference(pending.source),
      },
    };
    const result = await client.api.post<
      BrowserLogoutStatusRequestV1,
      BrowserLogoutResultV1
    >(
      `/api/auth/v1/browser-logout-operations/${safeId(pending.operationId)}/status`,
      request,
      "logoutResult",
    );
    assertLogoutResult(
      result,
      "identityBrowserAll",
      pending.operationId,
      undefined,
      pending.source.browserHeadId,
    );
    return client.finishServerCleanup(result);
  }
}
