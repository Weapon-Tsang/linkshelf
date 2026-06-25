import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/features/auth/adapter";
import { resumeShelfEngagement } from "@/features/engagement/resume";
import { ShelfPage } from "@/features/public-profile/shelf-page";
import {
  getPublicShelf,
  getSharedPublicShelvesDatabase,
  validatePublicShareCode,
} from "@/features/shelves/service";

interface ShelfRouteProps {
  readonly params:
    | Promise<{
        readonly creatorHandle: string;
        readonly shelfId: string;
      }>
    | {
        readonly creatorHandle: string;
        readonly shelfId: string;
      };
  readonly searchParams?:
    | Promise<{
        readonly share?: string | string[];
        readonly resume?: string | string[];
        readonly channel?: string | string[];
      }>
    | {
        readonly share?: string | string[];
        readonly resume?: string | string[];
        readonly channel?: string | string[];
      };
}

function shelfPath(handle: string, slug: string, shareCode?: string | null) {
  const path = `/${handle}/${slug}`;
  return shareCode ? `${path}?share=${encodeURIComponent(shareCode)}` : path;
}

export default async function PublicShelfRoute({ params, searchParams }: ShelfRouteProps) {
  const { creatorHandle, shelfId } = await params;
  const search = searchParams ? await searchParams : {};
  const database = getSharedPublicShelvesDatabase();
  const result = getPublicShelf(database, {
    creatorHandle,
    shelfId,
  });

  if (!result.ok) {
    notFound();
  }

  const session = getAuthSession(database, { headers: await headers() });
  const resume = resumeShelfEngagement(database, {
    resume: search.resume,
    channel: search.channel,
    shelfId: result.shelf.id,
    session,
  });
  if (resume.completed) {
    const existingShareCode = typeof search.share === "string" ? search.share : null;
    redirect(
      shelfPath(
        result.shelf.creator.handle,
        result.shelf.slug,
        resume.kind === "share" ? resume.shareCode : existingShareCode,
      ),
    );
  }

  const shareCode = validatePublicShareCode(database, {
    shelfId: result.shelf.id,
    shareCode: search.share,
  });

  return <ShelfPage shareCode={shareCode ?? undefined} shelf={result.shelf} />;
}
