import { openApplicationDatabase } from "@/lib/db/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const database = openApplicationDatabase();
    database.close();

    return Response.json({
      ok: true,
      database: "ok",
    });
  } catch {
    return Response.json(
      {
        ok: false,
        database: "error",
      },
      { status: 503 },
    );
  }
}
