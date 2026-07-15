import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { resolveServerAuthSession } from "@/features/auth/server";
import { readResumeEntryCookie } from "@/features/auth/session";
import { resumeShelfEngagement } from "@/features/engagement/resume";
import { ShelfPage } from "@/features/public-profile/shelf-page";
import {
  getPublicShelf,
  getSharedPublicShelvesDatabase,
  validatePublicShareCode,
} from "@/features/shelves/service";

interface ShelfRouteProps {
  readonly params: Promise<{
    readonly creatorHandle: string;
    readonly shelfId: string;
  }>;
  readonly searchParams?: Promise<{
    readonly share?: string | string[];
    readonly resume?: string | string[];
    readonly channel?: string | string[];
    readonly shareModal?: string | string[];
  }>;
}

function shelfPath(
  handle: string,
  slug: string,
  shareCode?: string | null,
  openShareModal = false,
) {
  const path = `/${handle}/${slug}`;
  const params = new URLSearchParams();
  if (shareCode) {
    params.set("share", shareCode);
  }
  if (openShareModal) {
    params.set("shareModal", "1");
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

type SearchValue = string | string[] | undefined;

function appendSearchValue(
  params: URLSearchParams,
  key: "resume" | "channel",
  value: SearchValue,
) {
  if (typeof value === "string") {
    params.append(key, value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      params.append(key, item);
    }
  }
}

function shelfResumeReturnTo(
  handle: string,
  slug: string,
  search: {
    readonly resume?: SearchValue;
    readonly channel?: SearchValue;
  },
) {
  const params = new URLSearchParams();
  appendSearchValue(params, "resume", search.resume);
  appendSearchValue(params, "channel", search.channel);
  const query = params.toString();
  const path = `/${handle}/${slug}`;
  return query ? `${path}?${query}` : path;
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

  const requestHeaders = await headers();
  const session = await resolveServerAuthSession(
    requestHeaders,
    `/${result.shelf.creator.handle}/${result.shelf.slug}`,
  );
  const resume = resumeShelfEngagement(database, {
    resume: search.resume,
    channel: search.channel,
    shelfId: result.shelf.id,
    session,
    resumeEntryToken: readResumeEntryCookie({ headers: requestHeaders }),
    returnTo: shelfResumeReturnTo(
      result.shelf.creator.handle,
      result.shelf.slug,
      search,
    ),
  });
  if (resume.completed) {
    const existingShareCode = typeof search.share === "string" ? search.share : null;
    redirect(
      shelfPath(
        result.shelf.creator.handle,
        result.shelf.slug,
        resume.kind === "share" ? resume.shareCode : existingShareCode,
        resume.kind === "share",
      ),
    );
  }

  const shareCode = validatePublicShareCode(database, {
    shelfId: result.shelf.id,
    shareCode: search.share,
  });

  return (
    <ShelfPage
      initialShareDialogOpen={shareCode !== null && search.shareModal === "1"}
      shareCode={shareCode ?? undefined}
      shelf={result.shelf}
    />
  );
}
