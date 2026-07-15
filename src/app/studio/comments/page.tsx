import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveServerAuthSession } from "@/features/auth/server";
import {
  listStudioComments,
  replyToComment,
  softDeleteComment,
} from "@/features/engagement/comment-actions";
import { listCreatorShelves } from "@/features/shelves/actions";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import { CommentsView } from "@/features/studio/comments-view";

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

async function replyAction(formData: FormData) {
  "use server";

  const commentId = String(formData.get("commentId") ?? "");
  const body = String(formData.get("body") ?? "");
  const { database, session } = await getStudioSession("/studio/comments");
  replyToComment(database, { commentId, body }, session);
  revalidatePath("/studio/comments");
}

async function hideAction(formData: FormData) {
  "use server";

  const commentId = String(formData.get("commentId") ?? "");
  const { database, session } = await getStudioSession("/studio/comments");
  softDeleteComment(database, { commentId }, session);
  revalidatePath("/studio/comments");
}

export default async function StudioCommentsPage() {
  const { database, session } = await getStudioSession("/studio/comments");
  const comments = listStudioComments(database, session);
  const studio = listCreatorShelves(database, session);

  if (!comments.ok || !studio.ok) {
    redirect("/forbidden");
  }

  return (
    <CommentsView
      comments={comments.comments}
      deleteAction={hideAction}
      replyAction={replyAction}
      shelves={studio.shelves.map((shelf) => ({ id: shelf.id, title: shelf.title }))}
    />
  );
}
