import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { resolveServerAuthSession } from "@/features/auth/server";
import { extractMetadata } from "@/features/shelves/metadata-adapter";
import {
  getShelfEditorData,
  publishShelfFromEditor,
  saveShelfDraft,
  type ShelfEditorInput,
} from "@/features/shelves/actions";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import { ShelfEditor } from "@/features/studio/shelf-editor";

interface EditShelfPageProps {
  readonly params: Promise<{
    readonly shelfId: string;
  }>;
}

async function getStudioContext(returnTo: string) {
  const database = getSharedPublicShelvesDatabase();
  const session = await resolveServerAuthSession(await headers(), returnTo);
  if (!session) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (session.user.role !== "CREATOR") {
    redirect("/forbidden");
  }
  return { database, session };
}

function parsePayload(formData: FormData): ShelfEditorInput {
  const raw = String(formData.get("payload") ?? "{}");
  try {
    const parsed = JSON.parse(raw) as ShelfEditorInput;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function extractProductMetadata(productUrl: string) {
  "use server";

  return extractMetadata(productUrl);
}

async function submitShelf(formData: FormData) {
  "use server";

  const input = parsePayload(formData);
  const shelfId = input.shelfId ?? String(formData.get("shelfId") ?? "");
  const { database, session } = await getStudioContext(
    shelfId ? `/studio/shelves/${shelfId}/edit` : "/studio/shelves",
  );
  const nextInput = { ...input, shelfId };
  const result =
    formData.get("intent") === "publish"
      ? publishShelfFromEditor(database, nextInput, session)
      : saveShelfDraft(database, nextInput, session);

  if (result.ok) {
    redirect(`/studio/shelves/${result.shelfId}/edit`);
  }
  redirect("/studio/shelves?error=validation");
}

export default async function EditShelfPage({ params }: EditShelfPageProps) {
  const { shelfId } = await params;
  const { database, session } = await getStudioContext(
    `/studio/shelves/${shelfId}/edit`,
  );
  const result = getShelfEditorData(database, shelfId, session);

  if (!result.ok) {
    notFound();
  }

  return (
    <ShelfEditor
      action={submitShelf}
      initialValue={{
        shelfId: result.shelf.id,
        title: result.shelf.title,
        slug: result.shelf.slug,
        description: result.shelf.description,
        category: result.shelf.category,
        theme: result.shelf.theme,
        sourceContentUrl: result.shelf.sourceContentUrl,
        coverUrl: result.shelf.coverUrl,
        products: result.shelf.products,
      }}
      onExtractMetadata={extractProductMetadata}
    />
  );
}
