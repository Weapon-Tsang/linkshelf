import type { DatabaseSync } from "node:sqlite";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveServerAuthSession } from "@/features/auth/server";
import { listCreatorShelves } from "@/features/shelves/actions";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import { AnalyticsView } from "@/features/studio/analytics-view";

function toNumber(value: number | bigint | null | undefined) {
  if (typeof value === "bigint") return Number(value);
  return Number(value ?? 0);
}

function readAnalyticsMetrics(database: DatabaseSync, creatorId: string) {
  const clicks = database
    .prepare(
      `SELECT COUNT(click_events.id) AS count
       FROM click_events
       INNER JOIN shelves ON shelves.id = click_events.shelf_id
       WHERE shelves.creator_id = ?
         AND shelves.deleted_at IS NULL`,
    )
    .get(creatorId) as { count: number | bigint } | undefined;
  const shares = database
    .prepare(
      `SELECT COUNT(shares.id) AS count
       FROM shares
       INNER JOIN shelves ON shelves.id = shares.shelf_id
       WHERE shelves.creator_id = ?
         AND shelves.deleted_at IS NULL`,
    )
    .get(creatorId) as { count: number | bigint } | undefined;
  const revenue = database
    .prepare(
      `SELECT COALESCE(SUM(products.price_cents), 0) AS cents
       FROM click_events
       INNER JOIN shelves ON shelves.id = click_events.shelf_id
       LEFT JOIN products ON products.id = click_events.product_id
       WHERE shelves.creator_id = ?
         AND shelves.deleted_at IS NULL`,
    )
    .get(creatorId) as { cents: number | bigint } | undefined;

  const clickCount = toNumber(clicks?.count);
  const shareCount = toNumber(shares?.count);
  return {
    clicks: clickCount,
    shares: shareCount,
    conversionRate: shareCount > 0 ? Number(((clickCount / shareCount) * 100).toFixed(1)) : 0,
    revenueCents: Math.round(toNumber(revenue?.cents) * 0.04),
  };
}

export default async function StudioAnalyticsPage() {
  const database = getSharedPublicShelvesDatabase();
  const session = await resolveServerAuthSession(await headers(), "/studio/analytics");
  const studio = listCreatorShelves(database, session);

  if (!session) {
    redirect("/login?returnTo=/studio/analytics");
  }
  if (!studio.ok) {
    redirect("/forbidden");
  }

  return <AnalyticsView metrics={readAnalyticsMetrics(database, studio.creator.id)} />;
}
