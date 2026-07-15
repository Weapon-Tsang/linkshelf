import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveServerAuthSession } from "@/features/auth/server";
import {
  listCreatorShelves,
  publishShelf,
  softDeleteShelf,
  type ShelfManagementFilter,
} from "@/features/shelves/actions";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import {
  ShelfManagementView,
  type ShelfManagementLayout,
} from "@/features/studio/shelf-management-view";

interface StudioShelvesPageProps {
  readonly searchParams?: Promise<{
    readonly q?: string | string[];
    readonly status?: string | string[];
    readonly layout?: string | string[];
  }>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value: string | undefined): ShelfManagementFilter {
  return value === "PUBLISHED" || value === "DRAFT" ? value : "ALL";
}

function parseLayout(value: string | undefined): ShelfManagementLayout {
  return value === "list" ? "list" : "grid";
}

async function getStudioSession(returnTo: string) {
  const session = await resolveServerAuthSession(await headers(), returnTo);
  if (!session) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (session.user.role !== "CREATOR") {
    redirect("/forbidden");
  }
  const database = getSharedPublicShelvesDatabase();
  return { database, session };
}

async function publishShelfAction(formData: FormData) {
  "use server";

  const shelfId = String(formData.get("shelfId") ?? "");
  const { database, session } = await getStudioSession("/studio/shelves");
  publishShelf(database, { shelfId }, session);
  revalidatePath("/studio/dashboard");
  revalidatePath("/studio/shelves");
}

async function deleteShelfAction(formData: FormData) {
  "use server";

  const shelfId = String(formData.get("shelfId") ?? "");
  const { database, session } = await getStudioSession("/studio/shelves");
  softDeleteShelf(database, { shelfId }, session);
  revalidatePath("/studio/dashboard");
  revalidatePath("/studio/shelves");
}

export default async function StudioShelvesPage({
  searchParams,
}: StudioShelvesPageProps) {
  const query = searchParams ? await searchParams : {};
  const status = parseStatus(first(query.status));
  const layout = parseLayout(first(query.layout));
  const search = first(query.q)?.trim() ?? "";
  const { database, session } = await getStudioSession("/studio/shelves");
  const studio = listCreatorShelves(database, session, {
    query: search,
    status,
  });

  if (!studio.ok) {
    redirect("/forbidden");
  }

  return (
    <ShelfManagementView
      creatorHandle={studio.creator.handle}
      deleteShelfAction={deleteShelfAction}
      publishShelfAction={publishShelfAction}
      layout={layout}
      query={search}
      shelves={studio.shelves}
      status={status}
      totals={studio.totals}
    />
  );
}
