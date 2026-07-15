import { describe, expect, it, vi } from "vitest";
import {
  operationalEventEnabled,
  recordOperationalEvent,
} from "@/lib/monitoring/events";

function createSink() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe("operational monitoring events", () => {
  it("emits one-line JSON events in production", () => {
    const sink = createSink();

    recordOperationalEvent(
      {
        level: "warn",
        name: "auth.google.request",
        outcome: "cross_origin_rejected",
        requestId: "request-123",
        metadata: {
          status: 403,
          AUTH_SECRET: "do-not-log",
          token: "do-not-log",
          productId: "product-sony-a7iv",
          omitted: undefined,
        },
      },
      {
        environment: { NODE_ENV: "production" },
        now: () => new Date("2026-07-15T09:30:00.000Z"),
        sink,
      },
    );

    expect(sink.warn).toHaveBeenCalledTimes(1);
    expect(sink.info).not.toHaveBeenCalled();
    expect(sink.error).not.toHaveBeenCalled();
    expect(JSON.parse(sink.warn.mock.calls[0][0] as string)).toEqual({
      type: "linkshelf.operational_event",
      timestamp: "2026-07-15T09:30:00.000Z",
      level: "warn",
      name: "auth.google.request",
      outcome: "cross_origin_rejected",
      requestId: "request-123",
      metadata: {
        status: 403,
        AUTH_SECRET: "[redacted]",
        token: "[redacted]",
        productId: "product-sony-a7iv",
      },
    });
  });

  it("stays quiet outside production unless stdout monitoring is enabled", () => {
    const sink = createSink();

    expect(operationalEventEnabled({ NODE_ENV: "test" })).toBe(false);
    recordOperationalEvent(
      { level: "info", name: "health.check", outcome: "ok" },
      { environment: { NODE_ENV: "test" }, sink },
    );
    expect(sink.info).not.toHaveBeenCalled();

    expect(
      operationalEventEnabled({
        NODE_ENV: "test",
        LINKSHELF_MONITORING_STDOUT: "1",
      }),
    ).toBe(true);
    recordOperationalEvent(
      { level: "info", name: "health.check", outcome: "ok" },
      {
        environment: {
          NODE_ENV: "test",
          LINKSHELF_MONITORING_STDOUT: "1",
        },
        sink,
      },
    );
    expect(sink.info).toHaveBeenCalledTimes(1);
  });
});
