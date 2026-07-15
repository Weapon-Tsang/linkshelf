import type { DatabaseSync } from "node:sqlite";
import { resolveAffiliateRedirect } from "@/features/affiliate/resolve-redirect";
import { openApplicationDatabase } from "@/lib/db/runtime";
import {
  recordOperationalEvent,
  type OperationalEventInput,
} from "@/lib/monitoring/events";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AffiliateRouteContext {
  readonly params:
    | Promise<{
        readonly productId: string;
      }>
    | {
        readonly productId: string;
      };
}

export interface AffiliateRouteDependencies {
  readonly database?: DatabaseSync;
  readonly getDatabase?: () => DatabaseSync;
  readonly platformTag?: string;
  readonly random?: () => number;
  readonly now?: () => Date;
  readonly createId?: () => string;
  readonly recordEvent?: (event: OperationalEventInput) => void;
}

export type AffiliateRouteHandler = (
  request: Request,
  context: AffiliateRouteContext,
) => Promise<Response>;

let affiliateDatabase: DatabaseSync | null = null;

export function openAffiliateDatabase(nodeEnv = process.env.NODE_ENV): DatabaseSync {
  return openApplicationDatabase({
    NODE_ENV: nodeEnv,
    LINKSHELF_DB_PATH: process.env.LINKSHELF_DB_PATH,
  });
}

function getSharedAffiliateDatabase(): DatabaseSync {
  affiliateDatabase ??= openAffiliateDatabase();
  return affiliateDatabase;
}

function noStoreResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

function redirectResponse(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      "cache-control": "no-store",
      location,
    },
  });
}

export function createAffiliateRouteHandler(
  dependencies: AffiliateRouteDependencies = {},
): AffiliateRouteHandler {
  return async function GET(request, context) {
    const params = await context.params;
    const database =
      dependencies.database ?? dependencies.getDatabase?.() ?? getSharedAffiliateDatabase();
    const shareCode = new URL(request.url).searchParams.get("share");

    const result = resolveAffiliateRedirect(
      {
        productId: params.productId,
        shareCode,
      },
      {
        database,
        platformTag: dependencies.platformTag ?? siteConfig.defaultPlatformTag,
        random: dependencies.random,
        now: dependencies.now,
        createId: dependencies.createId,
      },
    );
    const recordEvent = dependencies.recordEvent ?? recordOperationalEvent;

    if (!result.ok) {
      if (result.reason === "NOT_FOUND") {
        recordEvent({
          level: "warn",
          name: "affiliate.redirect",
          outcome: "not_found",
          metadata: { productId: params.productId, status: 404 },
        });
        return noStoreResponse("Product not found", 404);
      }
      if (result.reason === "INVALID_DESTINATION") {
        recordEvent({
          level: "warn",
          name: "affiliate.redirect",
          outcome: "invalid_destination",
          metadata: { productId: params.productId, status: 400 },
        });
        return noStoreResponse("Invalid destination", 400);
      }
      recordEvent({
        level: "error",
        name: "affiliate.redirect",
        outcome: "persistence_failed",
        metadata: { productId: params.productId, status: 503 },
      });
      return noStoreResponse("Click could not be recorded", 503);
    }

    recordEvent({
      level: "info",
      name: "affiliate.redirect",
      outcome: "redirected",
      metadata: {
        productId: params.productId,
        status: 302,
        beneficiary: result.beneficiary,
        fallbackReason: result.fallbackReason,
      },
    });
    return redirectResponse(result.destinationUrl);
  };
}

export const GET = createAffiliateRouteHandler();
