import { openApplicationDatabase } from "@/lib/db/runtime";
import { recordOperationalEvent } from "@/lib/monitoring/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const database = openApplicationDatabase();
    database.close();
    recordOperationalEvent({
      level: "info",
      name: "health.check",
      outcome: "ok",
      metadata: { status: 200 },
    });

    return Response.json({
      ok: true,
      database: "ok",
    });
  } catch {
    recordOperationalEvent({
      level: "error",
      name: "health.check",
      outcome: "error",
      metadata: { status: 503 },
    });
    return Response.json(
      {
        ok: false,
        database: "error",
      },
      { status: 503 },
    );
  }
}
