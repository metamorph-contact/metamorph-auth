import { afterEach, expect, it, vi } from "vitest";
import {
  render,
  cleanup,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import {
  EmergencyEntryContext,
  emergencyEntryOwnerForFlow,
} from "./emergency-entry-owner";
import { EmergencyEntryGate } from "./emergency-entry-gate";
const { call } = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock("./emergency-client", () => ({
  identityEmergencyClient: () => ({ call }),
}));
vi.mock("@polymorph/core", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  Icon: () => null,
}));
afterEach(() => {
  cleanup();
  call.mockReset();
  owner.complete.mockReset();
});
const id = "01994000-0000-7000-8000-000000000001",
  tenant = "01994000-0000-7000-8000-000000000002";
const expiresAt = new Date(Date.now() + 60000).toISOString();
const flow = {
  bootstrap: { flowId: id, expiresAt },
  catalog: { projection: { expiresAt } },
} as never;
const emergencyFlowFixture = {
  bootstrap: {
    flowId: id,
    expiresAt,
    intent: "emergency",
    emergencyEntry: {
      purpose: "entry",
      targetUserId: null,
      resultNonce: null,
      targetTenantId: tenant,
      identityHomeRegionId: "local-a",
      expiresAt,
    },
    emergencyAuthorization: "header.payload.signature",
  },
  catalog: { projection: { expiresAt } },
};
const emergencyFlow = emergencyFlowFixture as never;
const owner = {
  flowId: id,
  targetTenantId: tenant,
  identityHomeRegionId: "local-a",
  complete: vi.fn(),
};
it("rejects stale or malformed emergency purpose authority", () => {
  for (const bootstrap of [
    {
      ...emergencyFlowFixture.bootstrap,
      emergencyAuthorization: "",
    },
    {
      ...emergencyFlowFixture.bootstrap,
      emergencyEntry: {
        ...emergencyFlowFixture.bootstrap.emergencyEntry,
        expiresAt: "not-a-time",
      },
    },
    {
      ...emergencyFlowFixture.bootstrap,
      emergencyEntry: {
        ...emergencyFlowFixture.bootstrap.emergencyEntry,
        expiresAt: new Date(Date.now() - 1).toISOString(),
      },
    },
  ])
    expect(
      emergencyEntryOwnerForFlow({
        ...emergencyFlowFixture,
        bootstrap,
      } as never),
    ).toBeUndefined();
});
it("exposes entry only on the matched emergency-purpose flow", async () => {
  expect(emergencyEntryOwnerForFlow(emergencyFlow)).toBeDefined();
  const props = {
    flow,
    email: "admin@example.com",
    disabled: false,
    navigate: vi.fn(),
  };
  const view = render(<EmergencyEntryGate {...props} />);
  expect(screen.queryByRole("button")).toBeNull();
  view.rerender(
    <EmergencyEntryContext.Provider value={{ ...owner, flowId: tenant }}>
      <EmergencyEntryGate {...props} />
    </EmergencyEntryContext.Provider>,
  );
  expect(screen.queryByRole("button")).toBeNull();
  cleanup();
  render(<EmergencyEntryGate {...props} flow={emergencyFlow} />);
  expect(
    await screen.findByRole(
      "button",
      {
        name: "Emergency administrator access",
      },
      { timeout: 5_000 },
    ),
  ).toBeDefined();
});
it("reconciles an unknown activation with the same proof then scrubs on pagehide", async () => {
  const navigate = vi.fn();
  owner.complete.mockResolvedValue("/en/account");
  call.mockImplementation(async (op: string, request: unknown) => {
    if (op === "identity.emergency.entry")
      return {
        schemaVersion: 1,
        accepted: true,
        continuationId: tenant,
        expiresAt,
      };
    if (
      call.mock.calls.filter((v) => v[0] === "identity.emergency.activate")
        .length === 1
    )
      throw new Error("Timeout");
    const body = request as { ceremony: { attemptId: string } };
    return {
      schemaVersion: 1,
      attemptId: body.ceremony.attemptId,
      continuationId: tenant,
      activationId: id,
      targetTenantId: tenant,
      startsAt: new Date().toISOString(),
      expiresAt,
      reviewId: id,
      alertDelivery: "degraded",
      criticalIncidentId: id,
      nextAlertAttemptAt: expiresAt,
      alertDeliveryOperation: {
        operationId: id,
        state: "queued",
        revision: "1",
        acceptedAt: new Date().toISOString(),
        nextPollAfterSeconds: 1,
      },
    };
  });
  render(
    <EmergencyEntryContext.Provider value={owner}>
      <EmergencyEntryGate
        flow={emergencyFlow}
        email="admin@example.com"
        disabled={false}
        navigate={navigate}
      />
    </EmergencyEntryContext.Provider>,
  );
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Emergency administrator access",
    }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Start emergency verification" }),
  );
  fireEvent.change(
    await screen.findByLabelText(/Reason for emergency access/),
    { target: { value: "Recover provider configuration" } },
  );
  fireEvent.change(screen.getByLabelText("Local password"), {
    target: { value: "fresh local secret" },
  });
  fireEvent.change(screen.getByLabelText("Authenticator code"), {
    target: { value: "123456" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Verify password and authenticator" }),
  );
  await waitFor(() =>
    expect(
      call.mock.calls.filter((v) => v[0] === "identity.emergency.activate"),
    ).toHaveLength(1),
  );
  expect(
    (screen.getByLabelText("Local password") as HTMLInputElement).value,
  ).toBe("");
  fireEvent.click(await screen.findByRole("button", { name: /Retry/i }));
  await waitFor(() =>
    expect(
      call.mock.calls.filter((v) => v[0] === "identity.emergency.activate"),
    ).toHaveLength(2),
  );
  const requests = call.mock.calls.filter(
    (v) => v[0] === "identity.emergency.activate",
  );
  expect(requests[0].slice(1, 3)).toEqual(requests[1].slice(1, 3));
  await waitFor(() =>
    expect(screen.queryByLabelText("Local password")).toBeNull(),
  );
  expect(
    screen.getByText(
      "Critical alert delivery is degraded; an incident is recorded and independent retries continue.",
    ),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "actions.continue" }));
  await waitFor(() => expect(owner.complete).toHaveBeenCalledOnce());
  expect(owner.complete.mock.calls[0]?.[0]).toBe(emergencyFlow);
  expect(owner.complete.mock.calls[0]?.[1]).toMatchObject({
    activationId: id,
    targetTenantId: tenant,
  });
  await waitFor(() => expect(navigate).toHaveBeenCalledWith("/en/account"));
  fireEvent(window, new Event("pagehide"));
  expect(screen.queryByRole("button", { name: "actions.continue" })).toBeNull();
  expect(owner.complete).toHaveBeenCalledOnce();
});

it("clears entry and proof form when the actual owner context changes", async () => {
  call.mockResolvedValue({
    schemaVersion: 1,
    accepted: true,
    continuationId: tenant,
    expiresAt,
  });
  const props = {
    flow: emergencyFlow,
    email: "admin@example.com",
    disabled: false,
    navigate: vi.fn(),
  };
  const view = render(
    <EmergencyEntryContext.Provider value={owner}>
      <EmergencyEntryGate {...props} />
    </EmergencyEntryContext.Provider>,
  );
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Emergency administrator access",
    }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Start emergency verification" }),
  );
  fireEvent.change(await screen.findByLabelText("Local password"), {
    target: { value: "private password" },
  });
  view.rerender(
    <EmergencyEntryContext.Provider value={{ ...owner }}>
      <EmergencyEntryGate {...props} />
    </EmergencyEntryContext.Provider>,
  );
  expect(screen.queryByLabelText("Local password")).toBeNull();
  expect(
    await screen.findByRole("button", {
      name: "Emergency administrator access",
    }),
  ).toBeDefined();
});
