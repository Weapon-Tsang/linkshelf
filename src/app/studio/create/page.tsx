import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/features/auth/adapter";
import { extractMetadata } from "@/features/shelves/metadata-adapter";
import {
  publishShelfFromEditor,
  saveShelfDraft,
  type ShelfEditorInput,
} from "@/features/shelves/actions";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import { ShelfEditor } from "@/features/studio/shelf-editor";

async function getStudioContext(returnTo: string) {
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

  const { database, session } = await getStudioContext("/studio/create");
  const input = parsePayload(formData);
  const intent = formData.get("intent");
  const result =
    intent === "publish"
      ? publishShelfFromEditor(database, input, session)
      : saveShelfDraft(database, input, session);

  if (result.ok) {
    redirect(`/studio/shelves/${result.shelfId}/edit`);
  }
  redirect("/studio/create?error=validation");
}

export default function StudioCreateShelfPage() {
  return <ShelfEditor action={submitShelf} onExtractMetadata={extractProductMetadata} />;
}
