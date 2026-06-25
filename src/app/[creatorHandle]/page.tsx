import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/features/auth/adapter";
import { readResumeEntryCookie } from "@/features/auth/session";
import { resumeCreatorEngagement } from "@/features/engagement/resume";
import { CreatorProfilePage } from "@/features/public-profile/creator-profile-page";
import {
  getCreatorProfile,
  getSharedPublicShelvesDatabase,
} from "@/features/shelves/service";

interface CreatorPageProps {
  readonly params:
    | Promise<{
        readonly creatorHandle: string;
      }>
    | {
        readonly creatorHandle: string;
      };
  readonly searchParams?:
    | Promise<{
        readonly resume?: string | string[];
      }>
    | {
        readonly resume?: string | string[];
      };
}

function creatorResumeReturnTo(
  handle: string,
  search: {
    readonly resume?: string | string[];
  },
) {
  const params = new URLSearchParams();
  if (typeof search.resume === "string") {
    params.append("resume", search.resume);
  } else if (Array.isArray(search.resume)) {
    for (const item of search.resume) {
      params.append("resume", item);
    }
  }

  const query = params.toString();
  const path = `/${handle}`;
  return query ? `${path}?${query}` : path;
}

export default async function CreatorPage({ params, searchParams }: CreatorPageProps) {
  const { creatorHandle } = await params;
  const search = searchParams ? await searchParams : {};
  const database = getSharedPublicShelvesDatabase();
  const result = getCreatorProfile(database, creatorHandle);

  if (!result.ok) {
    notFound();
  }

  const requestHeaders = await headers();
  const session = getAuthSession(database, { headers: requestHeaders });
  const resume = resumeCreatorEngagement(database, {
    resume: search.resume,
    creatorId: result.profile.creator.id,
    session,
    resumeEntryToken: readResumeEntryCookie({ headers: requestHeaders }),
    returnTo: creatorResumeReturnTo(result.profile.creator.handle, search),
  });
  if (resume.completed) {
    redirect(`/${result.profile.creator.handle}`);
  }

  return <CreatorProfilePage profile={result.profile} />;
}
