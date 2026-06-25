import { notFound } from "next/navigation";
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
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { creatorHandle } = await params;
  const result = getCreatorProfile(getSharedPublicShelvesDatabase(), creatorHandle);

  if (!result.ok) {
    notFound();
  }

  return <CreatorProfilePage profile={result.profile} />;
}
