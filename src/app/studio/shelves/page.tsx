import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/features/auth/adapter";
import {
  listCreatorShelves,
  publishShelf,
  softDeleteShelf,
  type ShelfManagementFilter,
} from "@/features/shelves/actions";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import { ShelfManagementView } from "@/features/studio/shelf-management-view";

interface StudioShelvesPageProps {
  readonly searchParams?: Promise<{
    readonly q?: string | string[];
    readonly status?: string | string[];
  }>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value: string | undefined): ShelfManagementFilter {
  return value === "PUBLISHED" || value === "DRAFT" ? value : "ALL";
}

async function getStudioSession(returnTo: string) {
  const database = getSharedPublicShelvesDatabase();
  const session = getAuthSession(database, { headers: await headers() });
  if (!session) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (session.user.role !== "CREATOR") {
    redirect("/forbidden");
  }
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
      deleteShelfAction={deleteShelfAction}
      publishShelfAction={publishShelfAction}
      query={search}
      shelves={studio.shelves}
      status={status}
      totals={studio.totals}
    />
  );
}
