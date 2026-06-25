import type { DatabaseSync } from "node:sqlite";
import { resolveAffiliateRedirect } from "@/features/affiliate/resolve-redirect";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";
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
}

export type AffiliateRouteHandler = (
  request: Request,
  context: AffiliateRouteContext,
) => Promise<Response>;

let affiliateDatabase: DatabaseSync | null = null;

export function openAffiliateDatabase(nodeEnv = process.env.NODE_ENV): DatabaseSync {
  const database = createDatabase();
  migrate(database);
  if (nodeEnv !== "production") {
    seed(database);
  }
  return database;
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

    if (!result.ok) {
      if (result.reason === "NOT_FOUND") {
        return noStoreResponse("Product not found", 404);
      }
      if (result.reason === "INVALID_DESTINATION") {
        return noStoreResponse("Invalid destination", 400);
      }
      return noStoreResponse("Click could not be recorded", 503);
    }

    return redirectResponse(result.destinationUrl);
  };
}

export const GET = createAffiliateRouteHandler();
