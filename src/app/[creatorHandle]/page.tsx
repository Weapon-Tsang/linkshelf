import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/features/auth/adapter";
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

export default async function CreatorPage({ params, searchParams }: CreatorPageProps) {
  const { creatorHandle } = await params;
  const search = searchParams ? await searchParams : {};
  const database = getSharedPublicShelvesDatabase();
  const result = getCreatorProfile(database, creatorHandle);

  if (!result.ok) {
    notFound();
  }

  const session = getAuthSession(database, { headers: await headers() });
  const resume = resumeCreatorEngagement(database, {
    resume: search.resume,
    creatorId: result.profile.creator.id,
    session,
  });
  if (resume.completed) {
    redirect(`/${result.profile.creator.handle}`);
  }

  return <CreatorProfilePage profile={result.profile} />;
}
